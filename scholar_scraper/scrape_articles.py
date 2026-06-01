#!/usr/bin/env python3
"""
LARODEC Article Scraper
Utilise les scrapers existants : DBLP, OpenAlex/WOS, ResearchGate, Scopus
Insère les résultats dans PostgreSQL avec citation APA 7
"""
import os, re, time, unicodedata
import requests
import psycopg2
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

# ─── Config DB ────────────────────────────────────────────
DB_CONFIG = {
    "host"    : os.getenv("DB_HOST",     "localhost"),
    "database": os.getenv("DB_NAME",     "larodec_db"),
    "user"    : os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", "doudou"),
    "port"    : os.getenv("DB_PORT",     "5432")
}

ANNEE_LIMITE   = 2021
ANNEE_ACTUELLE = 2026
DBLP_API       = "https://dblp.org/search/publ/api"
OPENALEX_URL   = "https://api.openalex.org"
SCOPUS_API_KEY = "52b68d84f40379915effbb9e8fa7d0fb"


# ─── Session HTTP avec retry ──────────────────────────────
def make_session():
    s = requests.Session()
    retry = Retry(total=3, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.headers.update({"User-Agent": "Mozilla/5.0 (compatible; larodec-scraper/1.0)"})
    return s

SESSION = make_session()


# ─── Utilitaires ──────────────────────────────────────────
def normaliser(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii")

def normaliser_nom_fichier(s):
    return re.sub(r"[^a-z0-9]", "_", normaliser(s).lower())


# ══════════════════════════════════════════════════════════
# SCRAPER 1 — DBLP (depuis dblp_scraper.py)
# ══════════════════════════════════════════════════════════
def _auteur_valide(nom_chercheur: str, auteurs: str) -> bool:
    """
    Vérifie strictement que le chercheur est bien dans la liste des auteurs.
    Utilise une normalisation robuste (accents, casse, ponctuation).
    Retourne True si au moins 2 parties significatives du nom sont présentes.
    """
    def norm(s):
        s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower()
        return re.sub(r"[^a-z0-9\s]", " ", s)

    nom_norm    = norm(nom_chercheur)
    auteurs_norm = norm(auteurs)
    parts = [p for p in nom_norm.split() if len(p) > 2]
    if not parts:
        return False
    matches = sum(1 for p in parts if p in auteurs_norm)
    required = min(2, len(parts))
    return matches >= required


def scrape_dblp(nom_chercheur):
    """
    Extrait les publications DBLP 2021-2026 pour un chercheur.
    Amélioration : validation stricte de l'auteur + gestion des variantes de nom.
    """
    articles  = []
    offset    = 0
    page_size = 100
    nom_query = normaliser(nom_chercheur)

    # Générer des variantes de recherche (nom complet + initiales)
    parts = nom_chercheur.strip().split()
    variantes_query = [nom_query]
    if len(parts) >= 2:
        # Variante avec initiale du prénom : "Ben Amor N"
        variantes_query.append(f"{normaliser(' '.join(parts[:-1]))} {normaliser(parts[-1])[0]}")

    for query_str in variantes_query:
        offset = 0
        while True:
            try:
                resp = SESSION.get(DBLP_API, params={
                    "q": query_str, "format": "json",
                    "h": page_size, "f": offset
                }, timeout=15)
                resp.raise_for_status()
            except Exception as e:
                print(f"    [DBLP] Erreur : {e}")
                break

            data      = resp.json()
            hits_data = data.get("result", {}).get("hits", {})
            total     = int(hits_data.get("@total", 0))
            hits      = hits_data.get("hit", [])

            if not hits:
                break
            if isinstance(hits, dict):
                hits = [hits]

            for hit in hits:
                info     = hit.get("info", {})
                year_str = str(info.get("year", ""))
                if not year_str.isdigit():
                    continue
                year = int(year_str)
                if not (ANNEE_LIMITE <= year <= ANNEE_ACTUELLE):
                    continue

                authors_raw = info.get("authors", {}).get("author", [])
                if isinstance(authors_raw, dict):
                    authors_raw = [authors_raw]
                auteurs = ", ".join(a.get("text", "") for a in authors_raw)

                # Validation stricte : le chercheur doit être dans les auteurs
                if not _auteur_valide(nom_chercheur, auteurs):
                    continue

                titre = info.get("title", "").rstrip(".")
                # Éviter les doublons entre variantes
                if any(a.get("titre") == titre for a in articles):
                    continue

                articles.append({
                    "titre"   : titre,
                    "auteurs" : auteurs,
                    "venue"   : info.get("venue", ""),
                    "annee"   : year,
                    "doi"     : info.get("doi", ""),
                    "url"     : info.get("ee", info.get("url", "")),
                    "type"    : info.get("type", ""),
                    "source"  : "DBLP"
                })

            offset += page_size
            if offset >= total:
                break

        # Si la première variante a donné des résultats, pas besoin des autres
        if articles:
            break

    return articles


# ══════════════════════════════════════════════════════════
# SCRAPER 2 — OpenAlex/WOS (depuis wos_scraper.py)
# ══════════════════════════════════════════════════════════
def scrape_openalex(prenom, nom):
    """
    Extrait les publications OpenAlex 2021-2026.
    Amélioration : sélection d'auteur par score pondéré + filtre affiliation Tunisie.
    """
    articles = []
    nom_complet = f"{prenom} {nom}"

    # Trouver l'auteur — essayer plusieurs variantes
    variantes = [nom_complet, f"{nom} {prenom}", normaliser(nom_complet)]
    author_id = None

    for variante in variantes:
        try:
            resp = SESSION.get(f"{OPENALEX_URL}/authors", params={
                "search": variante, "per_page": 10
            }, timeout=20)
            resp.raise_for_status()
            results = resp.json().get("results", [])
        except Exception as e:
            print(f"    [OpenAlex] Erreur recherche auteur ({variante}): {e}")
            continue

        if not results:
            continue

        # Sélection par score pondéré : correspondance nom + affiliation Tunisie
        query_norm = normaliser(nom_complet).lower()
        best_i, best_score = 0, -1
        for i, a in enumerate(results):
            name_norm = normaliser(a.get("display_name", "")).lower()
            score = sum(1 for w in query_norm.split() if len(w) > 2 and w in name_norm)
            # Bonus affiliation Tunisie
            affil = (a.get("last_known_institution") or {})
            if "tunis" in (affil.get("display_name") or "").lower() or \
               "tunis" in (affil.get("country_code") or "").lower() or \
               affil.get("country_code") == "TN":
                score += 2
            # Bonus si le nom commence pareil
            if name_norm.startswith(normaliser(prenom).lower()):
                score += 0.5
            if score > best_score:
                best_score, best_i = score, i

        if best_score >= 1:
            author_id = results[best_i]["id"]
            break

    if not author_id:
        print(f"    [OpenAlex] Auteur non trouvé : {nom_complet}")
        return articles

    # Récupérer les publications
    page, per_page = 1, 100
    while True:
        try:
            resp = SESSION.get(f"{OPENALEX_URL}/works", params={
                "filter"  : f"author.id:{author_id},publication_year:{ANNEE_LIMITE}-{ANNEE_ACTUELLE}",
                "per_page": per_page,
                "page"    : page,
                "sort"    : "publication_year:desc"
            }, timeout=20)
            resp.raise_for_status()
        except Exception as e:
            print(f"    [OpenAlex] Erreur publications : {e}")
            break

        data  = resp.json()
        works = data.get("results", [])
        total = data.get("meta", {}).get("count", 0)

        if not works:
            break

        for w in works:
            year = w.get("publication_year", "")
            auteurs = "; ".join(
                a.get("author", {}).get("display_name", "")
                for a in w.get("authorships", [])
            )
            loc   = w.get("primary_location") or {}
            src   = loc.get("source") or {}
            venue = src.get("display_name", "")
            doi   = (w.get("doi", "") or "").replace("https://doi.org/", "")

            articles.append({
                "titre"   : w.get("title", ""),
                "auteurs" : auteurs,
                "venue"   : venue,
                "annee"   : year,
                "doi"     : doi,
                "url"     : w.get("doi", w.get("id", "")),
                "type"    : w.get("type", ""),
                "source"  : "OpenAlex/WOS"
            })

        if len(articles) >= total:
            break
        page += 1
        time.sleep(0.5)

    return articles


# ══════════════════════════════════════════════════════════
# SCRAPER 3 — Scopus (depuis scopus_scraper.py)
# ══════════════════════════════════════════════════════════
def scrape_scopus(prenom, nom):
    """
    Extrait les publications Scopus 2021-2026.
    Amélioration : 3 variantes de requête + filtre affiliation Tunisie en priorité.
    """
    nom_clean = normaliser(nom)
    pre_clean = normaliser(prenom)
    initiale  = pre_clean[0].upper() if pre_clean else ""

    # Variantes de requête : du plus précis au plus large
    variantes = [
        f'AUTHNAME("{nom_clean}, {pre_clean}") AND PUBYEAR > 2020 AND AFFILCOUNTRY(Tunisia)',
        f'AUTHNAME("{nom_clean}, {pre_clean}") AND PUBYEAR > 2020',
        f'AUTHNAME("{nom_clean}, {initiale}") AND PUBYEAR > 2020 AND AFFILCOUNTRY(Tunisia)',
        f'AUTHNAME("{nom_clean}, {initiale}") AND PUBYEAR > 2020',
    ]

    seen_titres = set()
    articles    = []

    for query in variantes:
        if len(articles) >= 5:  # si on a déjà des résultats précis, on s'arrête
            break
        start, par_page = 0, 25
        while True:
            try:
                r = SESSION.get(
                    "https://api.elsevier.com/content/search/scopus",
                    headers={"Accept": "application/json"},
                    params={
                        "query" : query,
                        "apiKey": SCOPUS_API_KEY,
                        "count" : par_page,
                        "start" : start,
                        "sort"  : "coverDate,desc",
                        "field" : "dc:title,dc:creator,prism:publicationName,"
                                  "prism:coverDate,prism:volume,prism:issueIdentifier,"
                                  "prism:pageRange,prism:doi,citedby-count,"
                                  "subtypeDescription,eid,prism:issn"
                    }, timeout=30
                )
            except Exception as e:
                print(f"    [Scopus] Erreur : {e}")
                break

            if r.status_code == 429:
                print("    [Scopus] Rate limit — pause 10s")
                time.sleep(10)
                continue
            if r.status_code != 200:
                break

            data    = r.json().get("search-results", {})
            entries = data.get("entry", [])
            total   = int(data.get("opensearch:totalResults", 0))

            if not entries or (entries and entries[0].get("error")):
                break

            for art in entries:
                date_pub = art.get("prism:coverDate", "")
                annee    = int(date_pub[:4]) if date_pub and len(date_pub) >= 4 else 0
                if not (ANNEE_LIMITE <= annee <= ANNEE_ACTUELLE):
                    continue

                titre = art.get("dc:title", "")
                cle   = normaliser(titre).lower().strip()
                if cle in seen_titres:
                    continue
                seen_titres.add(cle)

                doi = art.get("prism:doi", "")
                articles.append({
                    "titre"      : titre,
                    "auteurs"    : art.get("dc:creator", ""),
                    "venue"      : art.get("prism:publicationName", ""),
                    "annee"      : annee,
                    "volume"     : art.get("prism:volume", ""),
                    "numero"     : art.get("prism:issueIdentifier", ""),
                    "pages"      : art.get("prism:pageRange", ""),
                    "doi"        : doi,
                    "url"        : f"https://doi.org/{doi}" if doi else "",
                    "type"       : art.get("subtypeDescription", ""),
                    "source"     : "Scopus",
                    "indexation" : "Scopus",
                })

            if start + par_page >= total or len(entries) < par_page:
                break
            start += par_page
            time.sleep(1)

    return articles


# ══════════════════════════════════════════════════════════
# SCRAPER 4 — ResearchGate (depuis rg2.py)
# ══════════════════════════════════════════════════════════
def scrape_researchgate(nom_chercheur):
    """Extrait les publications ResearchGate 2021-2026 (même logique que rg2.py)."""
    articles = []
    try:
        from curl_cffi import requests as cf_requests
        import json
    except ImportError:
        print("    [RG] curl_cffi non installé — pip install curl_cffi")
        return articles

    PATTERN = re.compile(r"RGCommons\.react\.mountWidgetTree\((\{.*?\})\);;", re.DOTALL)

    def auteur_correspond(auteurs_pub, nom):
        mots = set(normaliser(nom).lower().split())
        for auteur in auteurs_pub:
            mots_auteur = set(normaliser(auteur.get("name", "")).lower().split())
            if mots.issubset(mots_auteur):
                return True
        return False

    session     = cf_requests.Session()
    page        = 1
    pages_vides = 0

    while True:
        url = f"https://www.researchgate.net/search/publication?q={cf_requests.utils.quote(nom_chercheur)}&page={page}"
        try:
            resp = session.get(url, impersonate="chrome120", timeout=30)
        except Exception as e:
            print(f"    [RG] Erreur : {e}")
            break

        if resp.status_code != 200:
            break

        match = PATTERN.search(resp.text)
        if not match:
            break

        try:
            data  = json.loads(match.group(1))
            items = data["data"]["searchItemsList"]["data"]["items"]
        except Exception:
            break

        if not items:
            break

        nb_avant = len(articles)
        for item in items:
            pub = item.get("data", {}).get("publication", {})
            if not pub:
                continue
            auteurs_pub = pub.get("authors", [])
            if not auteur_correspond(auteurs_pub, nom_chercheur):
                continue
            date_str = str(pub.get("creationDate", ""))
            m = re.search(r"\b(20\d{2})\b", date_str)
            year = int(m.group(1)) if m else None
            if year and ANNEE_LIMITE <= year <= ANNEE_ACTUELLE:
                articles.append({
                    "titre"   : pub.get("title", ""),
                    "auteurs" : ", ".join(a.get("name", "") for a in auteurs_pub),
                    "venue"   : "",
                    "annee"   : year,
                    "doi"     : pub.get("doi", ""),
                    "url"     : "https://www.researchgate.net/" + pub.get("url", "").split("?")[0],
                    "type"    : pub.get("type", ""),
                    "source"  : "ResearchGate"
                })

        if len(articles) == nb_avant:
            pages_vides += 1
            if pages_vides >= 3:
                break
        else:
            pages_vides = 0

        page += 1
        time.sleep(2)

    return articles


# ══════════════════════════════════════════════════════════
# SCRAPER 5 — Google Scholar (via URL profil)
# ══════════════════════════════════════════════════════════
def scrape_scholar_url(profile_url):
    """Extrait les publications depuis une URL de profil Google Scholar."""
    from urllib.parse import urlparse, parse_qs
    from scholarly import scholarly as sc

    try:
        author_id = parse_qs(urlparse(profile_url).query)["user"][0]
    except (KeyError, IndexError):
        print("    [Scholar] URL invalide")
        return []

    articles = []
    try:
        auteur = sc.search_author_id(author_id)
        auteur = sc.fill(auteur, sections=["publications"])
        for pub in auteur.get("publications", []):
            bib   = pub.get("bib", {})
            annee = str(bib.get("pub_year", ""))
            try:
                if annee and not (ANNEE_LIMITE <= int(annee) <= ANNEE_ACTUELLE):
                    continue
            except ValueError:
                pass
            articles.append({
                "titre"   : bib.get("title", ""),
                "auteurs" : bib.get("author", ""),
                "venue"   : bib.get("journal", bib.get("booktitle", "")),
                "annee"   : annee,
                "doi"     : "",
                "url"     : pub.get("pub_url", ""),
                "type"    : "article_journal",
                "source"  : "Google Scholar"
            })
    except Exception as e:
        print(f"    [Scholar] Erreur : {e}")

    return articles


# ══════════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════
def format_apa(article):
    auteurs = article.get("auteurs", "")
    annee   = article.get("annee", "n.d.")
    titre   = article.get("titre", "Untitled")
    venue   = article.get("venue", "")
    volume  = article.get("volume", "")
    numero  = article.get("numero", "")
    pages   = article.get("pages", "")
    doi     = article.get("doi", "")
    url     = article.get("url", "")
    typ     = article.get("type", "").lower()

    # Tronquer après 20 auteurs (APA 7)
    auteur_list = [a.strip() for a in auteurs.split(";") if a.strip()]
    if len(auteur_list) > 20:
        auteurs_fmt = "; ".join(auteur_list[:19]) + "; ... " + auteur_list[-1]
    else:
        auteurs_fmt = auteurs

    citation = f"{auteurs_fmt} ({annee}). {titre}."

    if "conference" in typ or "proceeding" in typ:
        if venue:
            citation += f" In *{venue}*."
    elif "book" in typ or "chapter" in typ:
        if venue:
            citation += f" In *{venue}*."
    else:
        # Journal article (défaut)
        if venue:
            citation += f" *{venue}*"
            if volume:
                citation += f", *{volume}*"
                if numero:
                    citation += f"({numero})"
            if pages:
                citation += f", {pages}"
            citation += "."

    if doi:
        citation += f" https://doi.org/{doi}"
    elif url:
        citation += f" {url}"

    return citation


# ══════════════════════════════════════════════════════════
# DB HELPERS
# ══════════════════════════════════════════════════════════
def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def fetch_researchers():
    conn = get_conn()
    cur  = conn.cursor()
    rows = []
    # Corps A, Corps B, Doctorants, Cadres Post-Doc — sans étudiants master
    for table in ["enseignants_corps_a", "enseignants_corps_b", "doctorants", "cadres_post_doc"]:
        cur.execute(f"SELECT nom_prenom, n_cin FROM {table}")
        for nom, cin in cur.fetchall():
            rows.append({"nom": nom, "cin": cin, "table": table})
    cur.close()
    conn.close()
    return rows


# URLs Scholar par CIN — à compléter au fur et à mesure
SCHOLAR_URLS = {
    "07654209": "https://scholar.google.com/citations?user=iGMpCmEAAAAJ",  # AYACHI RAOUIA
    "08317434": "",  # BACH TOBJI MOHAMED ANIS
    "08322554": "",  # BADREDDINE AHMED
    "07255550": "",  # BEN AMOR NAHLA
    "00310960": "",  # BEN ARFA RABAI LATIFA
    "07124936": "",  # BEN NCIR CHIHEB EDDINE
    "00321080": "",  # BEN YAGHLANE BOUTHEINA
    "08707111": "",  # BOUKHRIS IMEN
    "06514055": "",  # BOUNHAS MYRIAM
    "05221390": "",  # BOUZIRI HEND
    "06436642": "",  # CHELLY DAGDIA ZAINEB
    "06116842": "",  # ELOUEDI ZIED
    "00776226": "",  # ESSOUSSI NADIA
    "04600584": "",  # FAIZ RIM
    "05229104": "",  # KRICHEN SAOUSSEN
    "04715181": "",  # SMITI ABIR
    "06226046": "",  # TLILI TAKWA
    "09163758": "",  # ABDELKHALEK RAOUA
}


def insert_article(conn, chercheur_nom, chercheur_table, art):
    cur   = conn.cursor()
    doi   = (art.get("doi") or "").strip() or None
    titre = (art.get("titre") or "").strip()

    try:
        # 1. Doublon par DOI (global — même article peu importe le chercheur)
        if doi:
            cur.execute("SELECT id FROM articles WHERE doi_unique = %s", (doi,))
            if cur.fetchone():
                return False

        # 2. Doublon par titre normalisé pour le même chercheur (sans DOI)
        if titre and not doi:
            cur.execute("""
                SELECT id FROM articles
                WHERE chercheur_nom = %s
                  AND LOWER(TRIM(titre)) = LOWER(TRIM(%s))
            """, (chercheur_nom, titre))
            if cur.fetchone():
                return False

        # 3. Insertion
        cur.execute("""
            INSERT INTO articles
                (chercheur_nom, chercheur_table, titre, auteurs,
                 journal_ou_editeur, annee, volume, numero, pages,
                 doi, url, indexation, type_publication,
                 citation_apa, source_scraping)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            chercheur_nom, chercheur_table, titre,
            art.get("auteurs", ""),
            art.get("venue", ""),
            art.get("annee"),
            art.get("volume", ""),
            art.get("numero", ""),
            art.get("pages", ""),
            doi,
            art.get("url", ""),
            art.get("indexation", ""),
            art.get("type", ""),
            format_apa(art),
            art.get("source", "")
        ))
        result = cur.fetchone()
        conn.commit()
        return result is not None
    except Exception as e:
        conn.rollback()
        print(f"      [DB] Erreur insert : {e}")
        return False
    finally:
        cur.close()


def deduplicate(articles):
    """Dédoublonne par DOI puis par titre normalisé."""
    seen_doi   = set()
    seen_titre = set()
    unique     = []
    for a in articles:
        doi   = (a.get("doi") or "").strip()
        titre = normaliser(a.get("titre", "")).lower().strip()
        if doi and doi in seen_doi:
            continue
        if titre and titre in seen_titre:
            continue
        if doi:
            seen_doi.add(doi)
        if titre:
            seen_titre.add(titre)
        unique.append(a)
    return unique


# ══════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("   LARODEC Article Scraper — Multi-sources")
    print("   Sources : DBLP | OpenAlex/WOS | Scopus | ResearchGate | Scholar")
    print("=" * 60)

    import sys

    # Mode CLI : python scrape_articles.py PRENOM NOM [scholar_url]
    if len(sys.argv) >= 3:
        prenom_filtre = sys.argv[1].strip().upper()
        nom_filtre    = sys.argv[2].strip().upper()
        scholar_url   = sys.argv[3].strip() if len(sys.argv) >= 4 else ""
        researchers   = fetch_researchers()
        researchers   = [r for r in researchers
                         if prenom_filtre in r["nom"].upper() and nom_filtre in r["nom"].upper()]
        if not researchers:
            researchers = [{"nom": f"{nom_filtre} {prenom_filtre}", "table": "inconnu", "cin": ""}]
        print(f"\nMode CLI : {researchers[0]['nom']}\n")
    else:
        # Mode automatique : scraper tous les chercheurs de la base
        researchers = fetch_researchers()
        scholar_url = ""
        print(f"\n{len(researchers)} chercheurs à scraper (corps_a, corps_b, doctorants, cadres_post_doc)\n")

    conn = get_conn()
    total_inserted = 0
    total_skipped  = 0

    for i, r in enumerate(researchers, 1):
        nom_complet = r["nom"]
        table       = r["table"]

        # Séparer prénom et nom (format "NOM PRENOM" ou "PRENOM NOM")
        parts  = nom_complet.strip().split()
        prenom = parts[-1] if len(parts) > 1 else parts[0]
        nom    = " ".join(parts[:-1]) if len(parts) > 1 else parts[0]

        print(f"\n[{i:3d}/{len(researchers)}] {nom_complet} ({table})")

        all_articles = []

        # ── DBLP ──────────────────────────────────────────
        print(f"  → DBLP...")
        dblp_arts = scrape_dblp(nom_complet)
        print(f"     {len(dblp_arts)} trouvés")
        all_articles.extend(dblp_arts)
        time.sleep(1)

        # ── OpenAlex/WOS ───────────────────────────────────
        print(f"  → OpenAlex/WOS...")
        try:
            oa_arts = scrape_openalex(prenom, nom)
            print(f"     {len(oa_arts)} trouvés")
            all_articles.extend(oa_arts)
        except Exception as e:
            print(f"     Erreur : {e}")
        time.sleep(1)

        # ── Scopus ─────────────────────────────────────────
        print(f"  → Scopus...")
        try:
            sc_arts = scrape_scopus(prenom, nom)
            print(f"     {len(sc_arts)} trouvés")
            all_articles.extend(sc_arts)
        except Exception as e:
            print(f"     Erreur : {e}")
        time.sleep(1)

        # ── ResearchGate ───────────────────────────────────
        print(f"  → ResearchGate...")
        rg_arts = scrape_researchgate(nom_complet)
        print(f"     {len(rg_arts)} trouvés")
        all_articles.extend(rg_arts)
        time.sleep(1)

        # ── Scholar (via SCHOLAR_URLS ou URL CLI) ─────────
        scholar_url_chercheur = scholar_url or SCHOLAR_URLS.get(r.get("cin", ""), "")
        if scholar_url_chercheur:
            print(f"  → Google Scholar...")
            try:
                sc_scholar = scrape_scholar_url(scholar_url_chercheur)
                print(f"     {len(sc_scholar)} trouvés")
                all_articles.extend(sc_scholar)
            except Exception as e:
                print(f"     Erreur : {e}")
            time.sleep(1)

        # ── Dédoublonnage + insertion ──────────────────────
        unique   = deduplicate(all_articles)
        inserted = 0
        skipped  = 0

        for art in unique:
            if insert_article(conn, nom_complet, table, art):
                inserted += 1
                print(f"    ✓ [{art.get('source','?')}] {str(art.get('titre',''))[:60]}")
            else:
                skipped += 1

        total_inserted += inserted
        total_skipped  += skipped
        print(f"  ✓ {len(unique)} uniques | {inserted} insérés | {skipped} doublons DB")

    conn.close()

    print("\n" + "=" * 60)
    print(f"   TERMINÉ : {total_inserted} articles insérés | {total_skipped} doublons ignorés")
    print("=" * 60)


if __name__ == "__main__":
    main()
