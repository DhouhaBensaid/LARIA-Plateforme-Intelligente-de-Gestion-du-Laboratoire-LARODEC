import requests
import csv
import re
import os
import unicodedata
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ANNEE_LIMITE   = 2021
ANNEE_ACTUELLE = 2026

OPENALEX_URL = "https://api.openalex.org"


def make_session():
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; research-scraper/1.0; mailto:research@larodec.tn)"
    })
    return session


SESSION = make_session()


def normaliser(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii")


def find_author(nom, prenom):
    """Cherche l'auteur sur OpenAlex par nom."""
    query = f"{prenom} {nom}"
    resp  = SESSION.get(
        f"{OPENALEX_URL}/authors",
        params={"search": query, "per_page": 10},
        timeout=20
    )
    resp.raise_for_status()
    results = resp.json().get("results", [])

    if not results:
        print("Aucun auteur trouvé.")
        return None

    print(f"\n  {len(results)} profil(s) trouvé(s) :")
    for i, a in enumerate(results):
        affil = a.get("last_known_institution", {})
        affil_name = affil.get("display_name", "?") if affil else "?"
        print(f"  [{i}] {a.get('display_name')} — {affil_name} — {a.get('works_count',0)} publications")

    # Sélection automatique : meilleur score de correspondance avec le nom cherché
    query_norm = normaliser(f"{prenom} {nom}").lower()
    best_i, best_score = 0, -1
    for i, a in enumerate(results):
        name_norm = normaliser(a.get("display_name", "")).lower()
        # Score basé sur les mots du nom cherché présents dans le résultat
        mots = query_norm.split()
        score = sum(1 for w in mots if w in name_norm)
        # Bonus si le nom affiché commence par le même prénom
        if name_norm.startswith(normaliser(prenom).lower()):
            score += 0.5
        if score > best_score:
            best_score, best_i = score, i

    chosen = results[best_i]
    print(f"\n  Sélection automatique : {chosen.get('display_name')} ({chosen.get('works_count',0)} publications)")
    return chosen["id"]


def fetch_publications(author_id):
    """Récupère toutes les publications 2021-2026 d'un auteur."""
    articles  = []
    page      = 1
    per_page  = 100

    while True:
        resp = SESSION.get(
            f"{OPENALEX_URL}/works",
            params={
                "filter"  : f"author.id:{author_id},publication_year:{ANNEE_LIMITE}-{ANNEE_ACTUELLE}",
                "per_page": per_page,
                "page"    : page,
                "sort"    : "publication_year:desc"
            },
            timeout=20
        )
        resp.raise_for_status()
        data  = resp.json()
        works = data.get("results", [])
        total = data.get("meta", {}).get("count", 0)

        if not works:
            break

        for w in works:
            year = w.get("publication_year", "")

            # Auteurs
            auteurs = "; ".join(
                a.get("author", {}).get("display_name", "")
                for a in w.get("authorships", [])
            )

            # Venue
            venue = ""
            loc   = w.get("primary_location") or {}
            src   = loc.get("source") or {}
            venue = src.get("display_name", "")

            # DOI
            doi = w.get("doi", "")
            if doi:
                doi = doi.replace("https://doi.org/", "")

            # Type
            doc_type = w.get("type", "")

            # WOS ID
            wos_id = ""
            for uid in w.get("ids", {}).values():
                if isinstance(uid, str) and "wos" in uid.lower():
                    wos_id = uid
                    break

            articles.append({
                "Annee"  : year,
                "Titre"  : w.get("title", ""),
                "Auteurs": auteurs,
                "Venue"  : venue,
                "Type"   : doc_type,
                "DOI"    : doi,
                "WOS_ID" : wos_id,
                "Lien"   : w.get("doi", w.get("id", ""))
            })

        print(f"  {len(articles)}/{total} articles récupérés")

        if len(articles) >= total:
            break
        page += 1

    return articles


# ─── MAIN ─────────────────────────────────────────────────
print("=" * 60)
print("   WOS/OpenAlex Scraper - Publications 2021-2026")
print("=" * 60)

prenom = input("\nPrénom du chercheur : ").strip()
nom    = input("Nom du chercheur    : ").strip()

print(f"\nRecherche pour '{prenom} {nom}'...")
author_id = find_author(nom, prenom)

if not author_id:
    print("Auteur introuvable.")
    exit()

print(f"\nRécupération des publications ({ANNEE_LIMITE}-{ANNEE_ACTUELLE})...")
articles = fetch_publications(author_id)

# Dédoublonnage
seen, unique = set(), []
for a in articles:
    key = (a["Titre"] or "").lower().strip()
    if key and key not in seen:
        seen.add(key)
        unique.append(a)

if unique:
    nom_fichier = normaliser(re.sub(r"[^a-z0-9]", "_", f"{nom}_{prenom}".lower()))
    nom_csv     = f"{nom_fichier}_wos_{ANNEE_LIMITE}_{ANNEE_ACTUELLE}.csv"

    with open(nom_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["Annee", "Titre", "Auteurs", "Venue", "Type", "DOI", "WOS_ID", "Lien"])
        writer.writeheader()
        writer.writerows(unique)

    print("\n" + "=" * 60)
    print(f"SUCCESS : {len(unique)} articles ({ANNEE_LIMITE}-{ANNEE_ACTUELLE})")
    print(f"FICHIER : {os.path.abspath(nom_csv)}")
    print("=" * 60)
    for a in unique:
        print(f"  {a['Annee']} | {str(a['Titre'])[:70]}")
else:
    print(f"\nAucun article trouvé pour {ANNEE_LIMITE}-{ANNEE_ACTUELLE}.")
