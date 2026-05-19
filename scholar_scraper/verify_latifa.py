"""
Verify Latifa's account settings
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
cur = conn.cursor()

# Get Latifa's account
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    print("✓ Compte de Latifa trouvé:")
    print(f"  ID: {result[0]}")
    print(f"  Email: {result[1]}")
    print(f"  Rôle: {result[2]}")
    print(f"  Nom: {result[3]}")
    print(f"  Prénom: {result[4]}")
else:
    print("✗ Compte de Latifa non trouvé")

conn.close()
