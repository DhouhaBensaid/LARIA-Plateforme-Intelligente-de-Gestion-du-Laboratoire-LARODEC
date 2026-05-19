"""
Fix Latifa's account:
1. Change password to larodec@latifabenarfarabai
2. Ensure role is admin (not admin+chercheur)
3. Verify everything works
"""
import os
import bcrypt
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

# New password format
password = "larodec@latifabenarfarabai"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Update Latifa's password and role to admin
cur.execute(
    "UPDATE larodec_users SET password = %s, role = %s WHERE email = %s",
    (hashed, "admin", "latifa.rabai@isg.rnu.tn")
)
print("✓ Mot de passe de Latifa changé à: larodec@latifabenarfarabai")
print("✓ Rôle de Latifa changé à: admin")

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

conn.commit()
conn.close()
print("\nDone!")
