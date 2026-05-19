"""
Google Scholar Scraper - via scholarly
Logique originale conservée, bugs corrigés, code nettoyé.
Install : pip install scholarly openpyxl
"""

import re
import csv
import os
import time
from datetime import datetime
from urllib.parse import urlparse, parse_qs

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from scholarly import scholarly


# ── Style Excel ────────────────────────────────────────────────────────────────

BLEU_FONCE = "1F4E79"
BLEU_MOYEN = "2E75B6"
BLEU_CLAIR = "D6E4F0"
BLANC      = "FFFFFF"
GRIS_CLAIR = "F2F2F2"

BORDURE = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"),  bottom=Side(style="thin"),
)

COLONNES_EXCEL = ["#", "Titre", "Auteurs", "Annee", "Journal",
                  "Volume", "Issue", "Pages", "Publisher", "Citations", "URL"]

LARGEURS_COLS  = {"A": 5,  "B": 50, "C": 30, "D": 8,  "E": 30,
                  "F": 8,  "G": 8,  "H": 10, "I": 20, "J": 12, "K": 40}

COLONNES_CSV   = ["annee", "titre", "auteurs", "journal", "volume",
                  "issue", "pages", "publisher", "citations", "url"]


# ── Etape 1 : saisie de l'URL ──────────────────────────────────────────────────

print("=" * 55)
print("   Google Scholar Scraper - Details complets")
print("=" * 55)

url = input("\nCollez l'URL du profil Google Scholar :\n> ").strip()


# ── Etape 2 : extraction de l'ID auteur ───────────────────────────────────────

try:
    author_id = parse_qs(urlparse(url).query)["user"][0]
    print(f"\nID detecte : {author_id}")
except (KeyError, IndexError):
    print("\nErreur : URL invalide.")
    exit(1)


# ── Etape 3 : calcul de la période ────────────────────────────────────────────

annee_actuelle = datetime.now().year
annee_limite   = annee_actuelle - 5
print(f"Filtre      : {annee_limite} - {annee_actuelle}")


# ── Etape 4 : chargement du profil ────────────────────────────────────────────

print("\nChargement du profil...")
try:
    author        = scholarly.search_author_id(author_id)
    time.sleep(2)
    author_filled = scholarly.fill(author)
except Exception as e:
    print(f"Erreur : {e}")
    exit(1)


# ── Etape 5 : filtrage des 5 dernières années ─────────────────────────────────

pubs_recentes = []
for pub in author_filled.get("publications", []):
    annee_str = pub["bib"].get("pub_year", "")
    try:
        if annee_str and int(annee_str) >= annee_limite:
            pubs_recentes.append(pub)
    except ValueError:
        pass

print(f"{len(pubs_recentes)} publications trouvees ({annee_limite}-{annee_actuelle})")


# ── Etape 6 : chargement des détails de chaque article ───────────────────────

print("\nChargement des details de chaque article...")
print("(Cela peut prendre quelques minutes)\n")

articles_details = []
total = len(pubs_recentes)

for i, pub in enumerate(pubs_recentes, 1):
    titre_court = pub["bib"].get("title", "Sans titre")[:50]
    print(f"  [{i}/{total}] {titre_court}...")

    try:
        pub_filled = scholarly.fill(pub)
        bib        = pub_filled.get("bib", {})
        articles_details.append({
            "titre"      : bib.get("title", ""),
            "auteurs"    : bib.get("author", ""),
            "annee"      : bib.get("pub_year", ""),
            "journal"    : bib.get("journal", bib.get("venue", "")),
            "volume"     : bib.get("volume", ""),
            "issue"      : bib.get("number", ""),
            "pages"      : bib.get("pages", ""),
            "publisher"  : bib.get("publisher", ""),
            "description": bib.get("abstract", ""),
            "citations"  : pub_filled.get("num_citations", 0),
            "url"        : pub_filled.get("pub_url", ""),
        })
        time.sleep(2)

    except Exception as e:
        print(f"     Erreur sur cet article : {e}")
        articles_details.append({
            "titre"      : pub["bib"].get("title", ""),
            "auteurs"    : pub["bib"].get("author", ""),
            "annee"      : pub["bib"].get("pub_year", ""),
            "journal"    : pub["bib"].get("journal", ""),
            "volume"     : "", "issue": "", "pages": "",
            "publisher"  : "", "description": "",
            "citations"  : pub.get("num_citations", 0),
            "url"        : "",
        })
        time.sleep(3)


# ── Etape 7 : affichage terminal ──────────────────────────────────────────────

def formater_auteurs_apa(auteurs_str: str) -> str:
    """
    Convertit la chaîne d'auteurs au format APA.
    Ex : "John Smith and Alice Dupont" -> "Smith, J., & Dupont, A."
    """
    if not auteurs_str:
        return ""
    # scholarly utilise " and " comme séparateur
    auteurs = [a.strip() for a in auteurs_str.split(" and ")]
    apa = []
    for auteur in auteurs:
        parties = auteur.strip().split()
        if not parties:
            continue
        if len(parties) == 1:
            apa.append(parties[0])
        else:
            # Suppose format "Prénom(s) NomDeFamille"
            nom_fam  = parties[-1]
            prenoms  = parties[:-1]
            initiales = ". ".join(p[0].upper() for p in prenoms) + "."
            apa.append(f"{nom_fam}, {initiales}")
    if not apa:
        return auteurs_str
    if len(apa) == 1:
        return apa[0]
    return ", ".join(apa[:-1]) + ", & " + apa[-1]


def formater_apa(art: dict) -> str:
    """
    Construit la référence APA 7 :
    Auteurs (Année). Titre. Journal, Volume(Numéro), Pages. URL
    """
    auteurs = formater_auteurs_apa(art["auteurs"])
    annee   = f"({art['annee']})" if art["annee"] else "(s.d.)"
    titre   = art["titre"] or "Sans titre"
    journal = art["journal"]

    # Partie journal : Nom, Volume(Numéro), Pages.
    detail = ""
    if journal:
        detail = journal
        if art["volume"]:
            detail += f", {art['volume']}"
            if art["issue"]:
                detail += f"({art['issue']})"
        if art["pages"]:
            detail += f", {art['pages']}"
        detail += "."

    url = art["url"] if art["url"] else ""

    parties = [p for p in [auteurs, annee, titre + ".", detail, url] if p.strip()]
    return " ".join(parties)


nom_auteur = author_filled.get("name", "")

print("\n" + "=" * 55)
print(f"   PROFIL : {nom_auteur}")
print("=" * 55)
print(f"Affiliation : {author_filled.get('affiliation', '')}")
print(f"Citations   : {author_filled.get('citedby', 0)}")
print(f"h-index     : {author_filled.get('hindex', 0)}")
print(f"i10-index   : {author_filled.get('i10index', 0)}")
print(f"\n{len(articles_details)} articles ({annee_limite}-{annee_actuelle})\n")

for i, art in enumerate(articles_details, 1):
    ref_apa = formater_apa(art)
    print(f"  {i}. {ref_apa}")
    print(f"     [Citations : {art['citations']}]")
    print()


# ── Etape 8 : export CSV ──────────────────────────────────────────────────────

# Tri par année décroissante avant export
articles_tries   = sorted(articles_details, key=lambda a: a["annee"], reverse=True)
nom_fichier_base = re.sub(r"\s+", "_", nom_auteur.strip().lower())
os.makedirs("scholar_csv", exist_ok=True)
nom_csv          = os.path.join("scholar_csv", f"{nom_fichier_base}_{annee_limite}_{annee_actuelle}.csv")

with open(nom_csv, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=COLONNES_CSV, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(articles_tries)


# ── Résumé final ──────────────────────────────────────────────────────────────

print(f"\n{'=' * 55}")
print("   FICHIER CREE")
print("=" * 55)
print(f"  CSV : {nom_csv}")
print("=" * 55)