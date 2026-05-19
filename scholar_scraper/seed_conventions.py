"""
Run once to insert the 2 real conventions into the database.
Usage: python seed_conventions.py
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host"    : os.getenv("DB_HOST",     "localhost"),
    "database": os.getenv("DB_NAME",     "larodec_db"),
    "user"    : os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "port"    : os.getenv("DB_PORT",     "5432"),
}

conn = psycopg2.connect(**DB_CONFIG)
cur  = conn.cursor()

# Add missing columns if they don't exist
for col, typ in [
    ("annee",        "INT DEFAULT 2025"),
    ("programme",    "TEXT"),
    ("budget",       "TEXT"),
    ("pays",         "TEXT"),
    ("coordinateur", "TEXT"),
    ("categorie",    "TEXT DEFAULT 'entreprise'"),
]:
    cur.execute(f"""
        ALTER TABLE larodec_conventions
        ADD COLUMN IF NOT EXISTS {col} {typ}
    """)

# Insert the 2 real conventions
conventions = [
    {
        "titre"     : "Convention multilatérale — Universités partenaires 2025",
        "partenaire": "Université de Sousse, Université de Helwan, Université de Powiślański, Université de Madeira",
        "annee"     : 2025,
        "type"      : "Multilatéral",
        "categorie" : "cooperation",
        "pays"      : "Tunisie, Égypte, Pologne, Portugal",
    },
    {
        "titre"     : "Convention multilatérale — Partenaires santé 2025",
        "partenaire": "Institut Pasteur, Faculté de Médecine de Tunis",
        "annee"     : 2025,
        "type"      : "Multilatéral",
        "categorie" : "entreprise",
        "pays"      : "Tunisie",
    },
]

for c in conventions:
    cur.execute("""
        INSERT INTO larodec_conventions (titre, partenaire, annee, type, categorie, pays)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (c["titre"], c["partenaire"], c["annee"], c["type"], c["categorie"], c.get("pays", "")))
    print(f"✓ {c['titre'][:60]}...")

conn.commit()
conn.close()
print("\nDone.")
