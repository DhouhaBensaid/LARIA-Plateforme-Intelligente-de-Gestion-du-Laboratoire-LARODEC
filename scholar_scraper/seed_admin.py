"""
Run once to create the admin user in the database.
Admin: Latifa Ben Arfa Rabai
Password is auto-generated: larodec + nom + prenom

Usage: python seed_admin.py
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

def generate_password(nom: str, prenom: str) -> str:
    """Generate password: larodec + nom + prenom (lowercase, no spaces)"""
    nom_clean = nom.replace(" ", "").lower()
    prenom_clean = prenom.replace(" ", "").lower()
    return f"larodec{nom_clean}{prenom_clean}"

# Admin: Latifa Ben Arfa Rabai
# Password: larodecbenarfaLatifa
USERS = [
    {
        "email": "admin@larodec.tn",
        "nom": "BEN ARFA RABAI",
        "prenom": "LATIFA",
        "role": "admin",
        "grade": "Professeur"
    },
    {
        "email": "chercheur@larodec.tn",
        "nom": "Ben Arfa Rabai",
        "prenom": "Latifa",
        "role": "chercheur",
        "grade": "Professeur"
    },
]

conn = psycopg2.connect(**DB_CONFIG)
cur  = conn.cursor()

# First, remove admin role from all users
cur.execute("UPDATE larodec_users SET role = 'chercheur' WHERE role = 'admin'")

for u in USERS:
    password = generate_password(u["nom"], u["prenom"])
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    cur.execute("""
        INSERT INTO larodec_users (email, password, role, nom, prenom, cin, etablissement, universite, grade)
        VALUES (%s, %s, %s, %s, %s, '', 'ISG Tunis', 'Université de Tunis', %s)
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, nom = EXCLUDED.nom, prenom = EXCLUDED.prenom
    """, (u["email"], hashed, u["role"], u["nom"], u["prenom"], u["grade"]))
    print(f"✓ {u['role']}: {u['email']} / {password}")

conn.commit()
conn.close()
print("\nDone. You can now login with the credentials above.")
