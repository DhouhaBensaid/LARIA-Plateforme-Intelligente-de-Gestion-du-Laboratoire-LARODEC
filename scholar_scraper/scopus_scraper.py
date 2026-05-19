import requests
import pandas as pd
import re
import os
import time
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import unicodedata

API_KEY = "52b68d84f40379915effbb9e8fa7d0fb"

HEADERS_SEARCH = {"Accept": "application/json"}
HEADERS_DETAIL = {
    "Accept"       : "application/json",
    "X-ELS-APIKey" : API_KEY
}

def supprimer_accents(texte):
    texte = unicodedata.normalize('NFD', texte)
    return "".join(c for c in texte if unicodedata.category(c) != 'Mn')

# ─── Detail complet d un article via EID ──────────────────
def get_detail_article(eid):
    """
    Recupere tous les champs bibliographiques via l API Abstract
    """
    url = f"https://api.elsevier.com/content/abstract/eid/{eid}"
    try:
        r = requests.get(url, headers=HEADERS_DETAIL, params={
            "field": "dc:title,dc:creator,prism:publicationName,"
                     "prism:coverDate,prism:volume,prism:issueIdentifier,"
                     "prism:pageRange,prism:doi,citedby-count,"
                     "subtypeDescription,eid,prism:issn,prism:issueIdentifier,"
                     "article-number,pubmed-id,source-id,prism:aggregationType,"
                     "openaccess,openaccessFlag,prism:publisher,"
                     "dc:description,language,author,affiliation,"
                     "prism:publicationDate,prism:isbn,prism:url"
        }, timeout=30)

        if r.status_code == 200:
            return r.json()
        else:
            print(f"    Detail erreur {r.status_code} pour {eid}")
            return None
    except Exception as e:
        print(f"    Erreur detail : {e}")
        return None

def extraire_detail(eid, data_base):
    if not data_base:
        return {}

    resp     = data_base.get("abstracts-retrieval-response", {})
    coredata = resp.get("coredata", {})
    item     = resp.get("item", {})

    # ── Auteurs — chercher dans TOUTES les structures possibles ──
    auteurs_detail = []

    # Structure 1 : resp["authors"]["author"]
    authors_raw = resp.get("authors", {})
    if isinstance(authors_raw, dict):
        authors_raw = authors_raw.get("author", [])
    if isinstance(authors_raw, dict):
        authors_raw = [authors_raw]

    # Structure 2 : coredata["dc:creator"] — peut être dict avec clé "author" ou "$"
    if not authors_raw:
        creator = coredata.get("dc:creator", "")
        if isinstance(creator, dict):
            # Format {"author": [...]} ou {"$": "Nom, P."}
            if "author" in creator:
                raw = creator["author"]
                if isinstance(raw, dict):
                    raw = [raw]
                for a in raw:
                    nom_a    = a.get("ce:surname", "")
                    prenom_a = a.get("ce:given-name", a.get("ce:initials", ""))
                    if nom_a:
                        auteurs_detail.append(f"{nom_a}, {prenom_a}".strip(", "))
            elif "$" in creator:
                auteurs_detail = [creator["$"]]
        elif isinstance(creator, str) and creator:
            auteurs_detail = [creator]

    # Structure 3 : item bibrecord
    if not authors_raw and not auteurs_detail:
        try:
            auth_grp = (item.get("bibrecord", {})
                            .get("head", {})
                            .get("author-group", []))
            if isinstance(auth_grp, dict):
                auth_grp = [auth_grp]
            for grp in auth_grp:
                auths = grp.get("author", [])
                if isinstance(auths, dict):
                    auths = [auths]
                for a in auths:
                    nom_a    = a.get("ce:surname",    "")
                    prenom_a = a.get("ce:given-name",
                               a.get("ce:initials",  ""))
                    if nom_a:
                        authors_raw.append({
                            "ce:surname"   : nom_a,
                            "ce:given-name": prenom_a,
                            "@seq"         : a.get("@seq", "")
                        })
        except:
            pass

    # Construire la chaine auteurs
    if authors_raw and isinstance(authors_raw, list):
        for a in authors_raw:
            nom_a    = a.get("ce:surname",    "")
            prenom_a = a.get("ce:given-name",
                       a.get("ce:initials",  ""))
            seq      = a.get("@seq",          "")
            if nom_a or prenom_a:
                auteurs_detail.append(
                    f"{nom_a}, {prenom_a}".strip(", ")
                )
    auteurs_str = " | ".join(auteurs_detail) if auteurs_detail else ""

    # ── Supprimer les messages debug ──────────────────────────
    if not auteurs_str:
        pass  # auteurs non trouvés, on continue sans debug

    # ── Affiliations ──────────────────────────────────────
    affils_raw = resp.get("affiliation", [])
    if isinstance(affils_raw, dict):
        affils_raw = [affils_raw]
    affils_str = " | ".join([
        f"[{a.get('@id','')}] "
        f"{a.get('affilname','')} — "
        f"{a.get('affiliation-city','')}, "
        f"{a.get('affiliation-country','')}"
        for a in affils_raw
    ]) if affils_raw else ""

    # ── Open Access ───────────────────────────────────────
    oa_flag = str(coredata.get("openaccess", "0"))
    oa_type = coredata.get("openaccessFlag", "")
    if oa_flag == "1":
        oa_str = f"Oui — {oa_type}" if oa_type else "Oui"
    else:
        oa_str = "Non"

    # ── Langue ────────────────────────────────────────────
    langue = ""
    try:
        langue_raw = (item.get("bibrecord", {})
                          .get("head", {})
                          .get("citation-info", {})
                          .get("citation-language", {}))
        langue = langue_raw.get("@xml:lang", "") if isinstance(langue_raw, dict) else ""
    except:
        pass
    if not langue:
        try:
            langue = resp.get("language", {}).get("@xml:lang", "")
        except:
            pass

    # ── PubMed ID ─────────────────────────────────────────
    pubmed_id = coredata.get("pubmed-id", "")

    # ── Numero article ────────────────────────────────────
    art_number = coredata.get("article-number", "")
    if not art_number:
        try:
            art_number = (item.get("bibrecord", {})
                              .get("head", {})
                              .get("source", {})
                              .get("article-number", ""))
        except:
            pass

    # ── Source type ───────────────────────────────────────
    source_type = coredata.get("prism:aggregationType", "")

    # ── ISSN ──────────────────────────────────────────────
    issn_raw = coredata.get("prism:issn", "")
    if not issn_raw:
        try:
            issns = (item.get("bibrecord", {})
                        .get("head", {})
                        .get("source", {})
                        .get("issn", []))
            if isinstance(issns, list) and issns:
                issn_raw = issns[0].get("$", "")
            elif isinstance(issns, dict):
                issn_raw = issns.get("$", "")
        except:
            pass

    # ── Publisher ─────────────────────────────────────────
    publisher = coredata.get("prism:publisher", "")
    if not publisher:
        try:
            publisher = (item.get("bibrecord", {})
                             .get("head", {})
                             .get("source", {})
                             .get("publisher", {})
                             .get("publishername", ""))
        except:
            pass

    # ── Abstract ──────────────────────────────────────────
    abstract = coredata.get("dc:description", "")
    if not abstract:
        try:
            abstract = (resp.get("item", {})
                            .get("bibrecord", {})
                            .get("head", {})
                            .get("abstracts", ""))
        except:
            pass

    # ── URL ───────────────────────────────────────────────
    doi     = coredata.get("prism:doi", "")
    url_art = f"https://doi.org/{doi}" if doi else \
              f"https://www.scopus.com/record/display.uri?eid={eid}"

    return {
        "Auteurs_detail" : auteurs_str,
        "Affiliations"   : affils_str,
        "Open_Access"    : oa_str,
        "Langue"         : langue,
        "PubMed_ID"      : pubmed_id,
        "Article_Number" : art_number,
        "Source_Type"    : source_type,
        "ISSN"           : issn_raw,
        "Publisher"      : publisher,
        "Abstract"       : abstract,
        "URL"            : url_art
    }

# ══════════════════════════════════════════════════════════
print("=" * 60)
print("   Scopus Scraper — Informations bibliographiques completes")
print("=" * 60)

nom    = input("\nNom    : ").strip()
prenom = input("Prenom : ").strip()

nom_clean    = supprimer_accents(nom)
prenom_clean = supprimer_accents(prenom)
initiale     = prenom_clean[0].upper()

annee_actuelle = datetime.now().year
annee_limite   = annee_actuelle - 5

print(f"\nNom normalise : {nom_clean}, {prenom_clean}")
print(f"Periode       : {annee_limite} - {annee_actuelle}\n")

# ─── Etape 1 : recuperation articles (toutes pages) ───────
url_search = "https://api.elsevier.com/content/search/scopus"
articles   = {}

def recuperer_articles(query, label):
    resultats = []
    start     = 0
    par_page  = 25
    page      = 1

    print(f"  [{label}] {query}")

    while True:
        r = requests.get(url_search, headers=HEADERS_SEARCH, params={
            "query" : query,
            "apiKey": API_KEY,
            "count" : par_page,
            "start" : start,
            "sort"  : "coverDate,desc",
            "field" : "dc:title,dc:creator,prism:publicationName,"
                      "prism:coverDate,prism:volume,prism:issueIdentifier,"
                      "prism:pageRange,prism:doi,citedby-count,"
                      "subtypeDescription,eid,prism:issn"
        })

        if r.status_code != 200:
            break

        data    = r.json()
        results = data.get("search-results", {})
        entries = results.get("entry", [])
        total   = int(results.get("opensearch:totalResults", 0))

        if page == 1:
            print(f"    Total : {total}")

        if not entries or total == 0:
            break
        if entries[0].get("error"):
            break

        for art in entries:
            date_pub = art.get("prism:coverDate", "")
            annee    = int(date_pub[:4]) if date_pub else 0
            # Nettoyer la date : si mois/jour = 01-01, afficher seulement l'année
            if date_pub and date_pub.endswith("-01-01"):
                date_affichee = date_pub[:4]
            else:
                date_affichee = date_pub
            titre    = art.get("dc:title", "")
            eid      = art.get("eid", "")

            resultats.append({
                "Annee"    : annee,
                "Date"     : date_affichee,
                "Titre"    : titre,
                "Auteurs"  : art.get("dc:creator",            ""),
                "Journal"  : art.get("prism:publicationName", ""),
                "Volume"   : art.get("prism:volume",          ""),
                "Issue"    : art.get("prism:issueIdentifier", ""),
                "Pages"    : art.get("prism:pageRange",       ""),
                "DOI"      : art.get("prism:doi",             ""),
                "Citations": int(art.get("citedby-count", 0) or 0),
                "Type"     : art.get("subtypeDescription",    ""),
                "EID"      : eid,
                # Champs detail — remplis apres
                "Auteurs_detail" : "",
                "Affiliations"   : "",
                "Open_Access"    : "",
                "Langue"         : "",
                "PubMed_ID"      : "",
                "Article_Number" : "",
                "Source_Type"    : "",
                "ISSN"           : art.get("prism:issn",""),
                "Publisher"      : "",
                "Abstract"       : "",
                "URL"            : f"https://doi.org/{art.get('prism:doi','')}"
                                   if art.get("prism:doi") else
                                   f"https://www.scopus.com/record/display.uri?eid={eid}"
            })

        print(f"    Page {page} : {len(entries)} | Cumul : {len(resultats)}/{total}")

        if len(resultats) >= total or len(entries) < par_page:
            break
        start += par_page
        page  += 1

    return resultats

# Variantes de recherche
variantes = [
    (f'AUTHNAME("{nom_clean}, {prenom_clean}")', f"{nom_clean}, {prenom_clean}"),
    (f'AUTH("{nom_clean}, {initiale}")',          f"{nom_clean}, {initiale}"),
    (f'AUTHNAME("{nom}, {prenom}")',              f"original"),
]

print("Recherche multi-variantes...\n")
for query, label in variantes:
    for art in recuperer_articles(query, label):
        cle = supprimer_accents(art["Titre"]).lower().strip()
        if cle and cle not in articles:
            articles[cle] = art
    print(f"  Unique apres variante : {len(articles)}\n")

tous_articles = list(articles.values())

# Filtre 5 ans
articles_filtres = [
    a for a in tous_articles
    if annee_limite <= a["Annee"] <= annee_actuelle
]
print(f"Apres filtre : {len(articles_filtres)} articles\n")

# ─── Etape 2 : detail complet de chaque article ───────────
print("Chargement des details bibliographiques...\n")
print("(1 requete par article — environ 2 sec chacune)\n")

for i, art in enumerate(articles_filtres, 1):
    eid = art.get("EID", "")
    if not eid:
        continue

    print(f"  [{i:2d}/{len(articles_filtres)}] {art['Titre'][:55]}...")

    detail_raw = get_detail_article(eid)
    detail     = extraire_detail(eid, detail_raw)

    # Mettre a jour l article avec les details
    art.update(detail)
    time.sleep(1.5)   # respecter rate limit Scopus

# ─── Etape 3 : tri ────────────────────────────────────────
def cle_tri(art):
    date = art["Date"]
    if date and len(date) >= 7:
        annee = int(date[:4])
        mois  = int(date[5:7])
    else:
        annee = art["Annee"]
        mois  = 0
    return (annee, mois, art["Citations"])

articles_filtres.sort(key=cle_tri, reverse=True)

# ─── Fonction APA ─────────────────────────────────────────
def format_apa(art):
    auteurs = art.get("Auteurs_detail") or art.get("Auteurs", "")
    annee   = str(art.get("Annee", "s.d."))
    titre   = art.get("Titre", "")
    journal = art.get("Journal", "")
    volume  = art.get("Volume", "")
    pages   = art.get("Pages", "")
    doi     = art.get("DOI", "")
    typ     = art.get("Type", "").lower()

    citation = f"{auteurs} ({annee}). {titre}."
    if journal:
        if "conference" in typ or "proceeding" in typ:
            citation += f" In *{journal}*."
        else:
            citation += f" *{journal}*"
            if volume:
                citation += f", *{volume}*"
            if pages:
                citation += f", {pages}"
            citation += "."
    if doi:
        citation += f" https://doi.org/{doi}"
    return citation


# ─── Etape 4 : affichage terminal ─────────────────────────
print(f"\n{'=' * 60}")
print(f"   {prenom} {nom}")
print(f"   {len(articles_filtres)} articles — {annee_limite} a {annee_actuelle}")
print(f"{'=' * 60}")

annee_courante = None
for i, art in enumerate(articles_filtres, 1):
    if art["Annee"] != annee_courante:
        annee_courante = art["Annee"]
        print(f"\n  ── {annee_courante} " + "─" * 40)
    print(f"\n  {i}. {format_apa(art)}")
    print(f"     Citations : {art['Citations']} | OA : {art['Open_Access']}")

# ─── Etape 5 : export Excel ───────────────────────────────
nom_base = re.sub(r'[^a-z0-9]', '_', f"{nom_clean}_{prenom_clean}".lower())
os.makedirs("scopus_csv", exist_ok=True)
nom_xlsx = f"scopus_{nom_base}_{annee_limite}_{annee_actuelle}.xlsx"
nom_csv  = os.path.join("scopus_csv", f"scopus_{nom_base}_{annee_limite}_{annee_actuelle}.csv")

# CSV
colonnes_csv = [
    "Date","Titre","Type","Open_Access","DOI","EID",
    "Langue","PubMed_ID","Source_Type","ISSN","Publisher",
    "Journal","Volume","Issue","Pages","Article_Number",
    "Citations","Auteurs_detail","Affiliations","Abstract","URL"
]
df = pd.DataFrame([{c: a.get(c,"") for c in colonnes_csv}
                   for a in articles_filtres])
df["APA"] = df.apply(lambda row: format_apa({
    "Auteurs_detail": row.get("Auteurs_detail",""),
    "Annee"         : row.get("Date","")[:4] if row.get("Date") else "",
    "Titre"         : row.get("Titre",""),
    "Journal"       : row.get("Journal",""),
    "Volume"        : row.get("Volume",""),
    "Pages"         : row.get("Pages",""),
    "DOI"           : row.get("DOI",""),
    "Type"          : row.get("Type",""),
}), axis=1)
df.to_csv(nom_csv, index=False, encoding="utf-8-sig")

# ── Excel avec mise en forme complete ─────────────────────
blanc      = "FFFFFF"
bleu_fonce = "1F4E79"
bleu_clair = "D6E4F0"
bleu_titre = "2E75B6"
gris_clair = "F2F2F2"
vert_clair = "E8F5E9"

bordure = Border(
    left  =Side(style="thin", color="CCCCCC"),
    right =Side(style="thin", color="CCCCCC"),
    top   =Side(style="thin", color="CCCCCC"),
    bottom=Side(style="thin", color="CCCCCC")
)
bordure_forte = Border(
    left  =Side(style="medium", color="1F4E79"),
    right =Side(style="medium", color="1F4E79"),
    top   =Side(style="medium", color="1F4E79"),
    bottom=Side(style="medium", color="1F4E79")
)

wb = Workbook()
ws = wb.active
ws.title = "Publications Scopus"

# ── Ligne 1 : titre principal ──────────────────────────────
nb_cols   = len(colonnes_csv) + 1
col_fin   = chr(ord('A') + nb_cols - 1)

ws.merge_cells(f"A1:{col_fin}1")
c           = ws["A1"]
c.value     = f"Publications Scopus — {prenom} {nom}"
c.font      = Font(bold=True, color=blanc, size=14, name="Calibri")
c.fill      = PatternFill("solid", fgColor=bleu_titre)
c.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 35

# ── Ligne 2 : infos auteur ────────────────────────────────
ws.merge_cells(f"A2:{col_fin}2")
c           = ws["A2"]
c.value     = (f"Periode : {annee_limite} - {annee_actuelle}   |   "
               f"{len(articles_filtres)} articles   |   "
               f"Tris : date decroissante + citations")
c.font      = Font(italic=True, color="1F4E79", size=11, name="Calibri")
c.fill      = PatternFill("solid", fgColor=bleu_clair)
c.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[2].height = 22

# ── Ligne 3 : vide decorative ─────────────────────────────
ws.row_dimensions[3].height = 6

# ── Ligne 4 : en-tetes colonnes ───────────────────────────
entetes = ["#"] + colonnes_csv
for col_idx, nom_col in enumerate(entetes, 1):
    c           = ws.cell(row=4, column=col_idx, value=nom_col)
    c.font      = Font(bold=True, color=blanc, size=10, name="Calibri")
    c.fill      = PatternFill("solid", fgColor=bleu_fonce)
    c.alignment = Alignment(
        horizontal="center",
        vertical="center",
        wrap_text=False
    )
    c.border    = bordure
ws.row_dimensions[4].height = 25

# ── Lignes de donnees ─────────────────────────────────────
annee_precedente = None

for i, art in enumerate(articles_filtres, 1):
    r        = i + 4
    annee_art = art.get("Annee", 0)

    # Alternance couleur + separateur visuel par annee
    if annee_art != annee_precedente and annee_precedente is not None:
        # Ligne separatrice entre annees
        for col_idx in range(1, nb_cols + 1):
            sep_cell        = ws.cell(row=r, column=col_idx)
            sep_cell.fill   = PatternFill("solid", fgColor="BDD7EE")
            sep_cell.border = Border(
                top   =Side(style="medium", color=bleu_fonce),
                bottom=Side(style="medium", color=bleu_fonce)
            )
        ws.row_dimensions[r].height = 4
        r += 1
        # Decaler les données d'une ligne
        i_data = i + 5
    else:
        i_data = r

    annee_precedente = annee_art

    # Couleur alternee
    if i % 2 == 0:
        couleur = gris_clair
    else:
        couleur = blanc

    fill = PatternFill("solid", fgColor=couleur)

    vals = [
        i,
        art.get("Date",           ""),
        art.get("Titre",          ""),
        art.get("Type",           ""),
        art.get("Open_Access",    ""),
        art.get("DOI",            ""),
        art.get("EID",            ""),
        art.get("Langue",         ""),
        art.get("PubMed_ID",      ""),
        art.get("Source_Type",    ""),
        art.get("ISSN",           ""),
        art.get("Publisher",      ""),
        art.get("Journal",        ""),
        art.get("Volume",         ""),
        art.get("Issue",          ""),
        art.get("Pages",          ""),
        art.get("Article_Number", ""),
        art.get("Citations",      0),
        art.get("Auteurs_detail", ""),
        art.get("Affiliations",   ""),
        art.get("Abstract",       ""),
        art.get("URL",            "")
    ]

    for col_idx, val in enumerate(vals, 1):
        c = ws.cell(row=r, column=col_idx, value=val)
        c.fill   = fill
        c.border = bordure
        c.font   = Font(size=10, name="Calibri")
        c.alignment = Alignment(
            vertical  ="center",
            wrap_text =(col_idx in [3, 19, 20, 21]),
            horizontal="left" if col_idx > 2 else "center"
        )

        # Coloration speciale citations
        if col_idx == 18:
            cit_val = int(val) if str(val).isdigit() else 0
            if cit_val >= 10:
                c.fill = PatternFill("solid", fgColor="C6EFCE")
                c.font = Font(bold=True, color="276221",
                              size=10, name="Calibri")
            elif cit_val >= 1:
                c.fill = PatternFill("solid", fgColor="FFEB9C")
                c.font = Font(bold=True, color="9C6500",
                              size=10, name="Calibri")

        # Coloration Open Access
        if col_idx == 5:
            if "Oui" in str(val):
                c.fill = PatternFill("solid", fgColor="C6EFCE")
                c.font = Font(color="276221", size=10, name="Calibri")

    ws.row_dimensions[r].height = 55

# ── Largeurs des colonnes ─────────────────────────────────
largeurs = {
    1 : 5,   # #
    2 : 13,  # Date
    3 : 52,  # Titre
    4 : 18,  # Type
    5 : 16,  # Open Access
    6 : 35,  # DOI
    7 : 22,  # EID
    8 : 8,   # Langue
    9 : 12,  # PubMed ID
    10: 20,  # Source Type
    11: 16,  # ISSN
    12: 22,  # Publisher
    13: 32,  # Journal
    14: 8,   # Volume
    15: 8,   # Issue
    16: 12,  # Pages
    17: 14,  # Article Number
    18: 10,  # Citations
    19: 50,  # Auteurs detail
    20: 50,  # Affiliations
    21: 45,  # Abstract
    22: 40   # URL
}
for col_idx, larg in largeurs.items():
    col_letter = chr(ord('A') + col_idx - 1)
    ws.column_dimensions[col_letter].width = larg

# ── Figer la ligne d en-tete ──────────────────────────────
ws.freeze_panes = "B5"

# ── Filtre automatique sur les colonnes ───────────────────
ws.auto_filter.ref = f"A4:{col_fin}{len(articles_filtres) + 4}"

wb.save(nom_xlsx)

print(f"\n{'=' * 60}")
print(f"   FICHIERS CREES :")
print(f"   {nom_csv}")
print(f"   {nom_xlsx}")
print(f"   {len(articles_filtres)} articles exportes")
print(f"{'=' * 60}")

# Ouvrir Excel directement
os.startfile(nom_xlsx)