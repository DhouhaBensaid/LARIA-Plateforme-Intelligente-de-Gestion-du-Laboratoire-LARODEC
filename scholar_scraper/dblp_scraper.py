import requests
import pandas as pd
import re
import os
import unicodedata
from datetime import datetime

ANNEE_ACTUELLE = datetime.now().year
ANNEE_LIMITE   = ANNEE_ACTUELLE - 5
DBLP_API       = "https://dblp.org/search/publ/api"


def normaliser(nom):
    return unicodedata.normalize("NFD", nom).encode("ascii", "ignore").decode("ascii")


def recuperer_publications(nom):
    articles  = []
    offset    = 0
    page_size = 100
    nom_query = normaliser(nom)

    if nom_query != nom:
        print(f"  (Nom normalisé : '{nom_query}')")

    while True:
        resp = requests.get(DBLP_API, params={
            "q": nom_query, "format": "json",
            "h": page_size, "f": offset
        }, timeout=15)
        resp.raise_for_status()

        hits_data = resp.json().get("result", {}).get("hits", {})
        total     = int(hits_data.get("@total", 0))
        hits      = hits_data.get("hit", [])

        if not hits:
            break
        if isinstance(hits, dict):
            hits = [hits]

        print(f"  offset={offset} — {len(hits)} résultats (total: {total})")

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

            articles.append({
                "Annee"  : year,
                "Titre"  : info.get("title", "").rstrip("."),
                "Auteurs": ", ".join(a.get("text", "") for a in authors_raw),
                "Venue"  : info.get("venue", ""),
                "Type"   : info.get("type", ""),
                "DOI"    : info.get("doi", ""),
                "Lien"   : info.get("ee", info.get("url", ""))
            })

        offset += page_size
        if offset >= total:
            break

    return articles


def format_apa(art):
    auteurs = art.get("Auteurs", "")
    annee   = art.get("Annee", "s.d.")
    titre   = art.get("Titre", "")
    venue   = art.get("Venue", "")
    doi     = art.get("DOI", "")
    lien    = art.get("Lien", "")
    typ     = art.get("Type", "").lower()

    citation = f"{auteurs} ({annee}). {titre}."
    if venue:
        if "conference" in typ or "proceedings" in typ:
            citation += f" In *{venue}*."
        else:
            citation += f" *{venue}*."
    if doi:
        citation += f" https://doi.org/{doi}"
    elif lien:
        citation += f" {lien}"
    return citation


# ─── MAIN ─────────────────────────────────────────────────
print("=" * 60)
print("   DBLP Scraper - LARODEC")
print(f"   Période : {ANNEE_LIMITE} - {ANNEE_ACTUELLE}")
print("=" * 60)

nom_input = input("\nEntrez le nom du chercheur :\n> ").strip()
print(f"\nRecherche DBLP pour '{nom_input}'...")

try:
    articles = recuperer_publications(nom_input)
except Exception as e:
    print(f"Erreur : {e}")
    exit()

if articles:
    df = (pd.DataFrame(articles)
            .sort_values("Annee", ascending=False)
            .drop_duplicates(subset=["Titre"]))

    df["APA"] = df.apply(format_apa, axis=1)

    nom_fichier = re.sub(r"[^a-z0-9]", "_", normaliser(nom_input).lower())
    os.makedirs("dblp_csv", exist_ok=True)
    nom_csv = os.path.join("dblp_csv", f"{nom_fichier}_dblp_{ANNEE_LIMITE}_{ANNEE_ACTUELLE}.csv")
    df.to_csv(nom_csv, index=False, encoding="utf-8-sig")

    print("\n" + "=" * 60)
    print(f"SUCCESS : {len(df)} articles trouvés")
    print(f"FICHIER : {os.path.abspath(nom_csv)}")
    print("=" * 60)
    for i, row in df.iterrows():
        print(f"\n  {row['APA']}")
else:
    print(f"Aucun article trouvé pour {ANNEE_LIMITE}-{ANNEE_ACTUELLE}.")
