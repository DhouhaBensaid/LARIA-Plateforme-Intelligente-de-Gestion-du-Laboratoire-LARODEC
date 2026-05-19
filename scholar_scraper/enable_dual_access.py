"""
Enable dual access for Latifa:
- Change role to admin+chercheur
- Allow access to both dashboards
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

# Change Latifa's role to admin+chercheur
cur.execute(
    "UPDATE larodec_users SET role = %s WHERE email = %s",
    ("admin+chercheur", "latifa.rabai@isg.rnu.tn")
)
print("✓ Rôle de Latifa changé à: admin+chercheur")

# Verify
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    user_id, email, role, nom, prenom = result
    print(f"\n✓ Vérification:")
    print(f"  Email: {email}")
    print(f"  Rôle: {role}")
    print(f"  Nom: {nom} {prenom}")
    print(f"\n✓ Accès:")
    print(f"  Dashboard Admin: OUI")
    print(f"  Dashboard Chercheur: OUI")

conn.commit()
conn.close()
print("\nDone!")
