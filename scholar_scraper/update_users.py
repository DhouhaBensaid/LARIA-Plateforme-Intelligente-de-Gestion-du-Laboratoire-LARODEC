"""
Update user accounts:
1. Change Latifa's email to latifa.rabai@isg.rnu.tn
2. Delete Dhouha Bensaid's account
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

# 1. Change Latifa's email
cur.execute(
    "UPDATE larodec_users SET email = %s WHERE nom = %s AND prenom = %s",
    ("latifa.rabai@isg.rnu.tn", "BEN ARFA RABAI", "LATIFA")
)
print("✓ Email de Latifa changé à: latifa.rabai@isg.rnu.tn")

# 2. Delete all Dhouha Bensaid accounts (check both name orders)
cur.execute(
    "DELETE FROM larodec_users WHERE (LOWER(nom) LIKE %s AND LOWER(prenom) LIKE %s) OR (LOWER(nom) LIKE %s AND LOWER(prenom) LIKE %s)",
    ("%dhouha%", "%bensaid%", "%bensaid%", "%dhouha%")
)
deleted_count = cur.rowcount
print(f"✓ {deleted_count} compte(s) de Dhouha Bensaid supprimé(s)")

conn.commit()
conn.close()
print("\nDone!")
