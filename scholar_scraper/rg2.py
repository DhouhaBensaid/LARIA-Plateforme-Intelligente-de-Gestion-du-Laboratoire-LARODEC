from curl_cffi import requests as cf_requests
import json, re, os, time, pandas as pd, unicodedata

ANNEE_LIMITE   = 2021
ANNEE_ACTUELLE = 2026
PATTERN = re.compile(r"RGCommons\.react\.mountWidgetTree\((\{.*?\})\);;", re.DOTALL)

def normaliser(t):
    t = t.lower().strip()
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")

def auteur_correspond(auteurs_pub, nom_chercheur):
    """Vérifie que TOUS les mots du nom chercheur sont présents chez un auteur."""
    mots = set(normaliser(nom_chercheur).split())
    for auteur in auteurs_pub:
        mots_auteur = set(normaliser(auteur.get("name", "")).split())
        if mots.issubset(mots_auteur):  # tous les mots doivent correspondre
            return True
    return False

def extraire_items(html):
    match = PATTERN.search(html)
    if not match:
        return []
    try:
        data = json.loads(match.group(1))
        return data["data"]["searchItemsList"]["data"]["items"]
    except Exception as e:
        print(f"  Erreur JSON : {e}")
        return []

def scraper(nom):
    articles = []
    page = 1
    session = cf_requests.Session()
    pages_vides = 0

    while True:
        url = f"https://www.researchgate.net/search/publication?q={cf_requests.utils.quote(nom)}&page={page}"
        print(f"  Page {page}...")
        try:
            resp = session.get(url, impersonate="chrome120", timeout=30)
        except Exception as e:
            print(f"  Erreur : {e}")
            break

        if resp.status_code != 200:
            print(f"  Bloque (status {resp.status_code})")
            break

        items = extraire_items(resp.text)
        if not items:
            print("  Plus de resultats.")
            break

        nb_avant = len(articles)
        for item in items:
            pub = item.get("data", {}).get("publication", {})
            if not pub:
                continue
            auteurs_pub = pub.get("authors", [])
            if not auteur_correspond(auteurs_pub, nom):
                continue
            date_str = str(pub.get("creationDate", ""))
            m = re.search(r"\b(20\d{2})\b", date_str)
            year = int(m.group(1)) if m else None
            if year and ANNEE_LIMITE <= year <= ANNEE_ACTUELLE:
                auteurs_str = ", ".join(a.get("name", "") for a in auteurs_pub)
                articles.append({
                    "Annee"  : year,
                    "Titre"  : pub.get("title", ""),
                    "Auteurs": auteurs_str,
                    "Type"   : pub.get("type", ""),
                    "DOI"    : pub.get("doi", ""),
                    "Lien"   : "https://www.researchgate.net/" + pub.get("url", "").split("?")[0]
                })

        print(f"  {len(items)} items — {len(articles)} valides")

        if len(articles) == nb_avant:
            pages_vides += 1
            if pages_vides >= 3:
                break
        else:
            pages_vides = 0

        page += 1
        time.sleep(2)

    return articles

print("=" * 60)
print("   ResearchGate Scraper - LARODEC 2021-2026")
print("=" * 60)

nom_input = input("\nEntrez le nom du chercheur :\n> ").strip()
print(f"\nExtraction pour '{nom_input}'...")

articles = scraper(nom_input)

if articles:
    df = pd.DataFrame(articles)
    df = df.sort_values(by="Annee", ascending=False).drop_duplicates(subset=["Titre"])
    nom_fichier = re.sub(r"[^a-z0-9]", "_", nom_input.lower())
    nom_csv = f"{nom_fichier}_researchgate_{ANNEE_LIMITE}_{ANNEE_ACTUELLE}.csv"
    df.to_csv(nom_csv, index=False, encoding="utf-8-sig")
    print("\n" + "=" * 60)
    print(f"SUCCESS : {len(df)} articles")
    print(f"FICHIER : {os.path.abspath(nom_csv)}")
    print("=" * 60)
    print(df[["Annee", "Titre"]].head(5).to_string(index=False))
else:
    print(f"Aucun article trouve pour {ANNEE_LIMITE}-{ANNEE_ACTUELLE}.")
