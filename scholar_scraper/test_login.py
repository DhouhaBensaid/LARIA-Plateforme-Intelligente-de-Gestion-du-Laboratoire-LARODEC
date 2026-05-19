"""
Test login with Latifa's credentials
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

# Test password
test_password = "larodecbenarfaLatifa"

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Get Latifa's account
cur.execute(
    "SELECT id, email, password, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    user_id, email, hashed_password, role, nom, prenom = result
    
    print("✓ Compte de Latifa trouvé:")
    print(f"  Email: {email}")
    print(f"  Rôle: {role}")
    print(f"  Nom: {nom} {prenom}")
    print()
    
    # Test password
    try:
        if bcrypt.checkpw(test_password.encode(), hashed_password.encode()):
            print(f"✓ Mot de passe correct: {test_password}")
        else:
            print(f"✗ Mot de passe incorrect")
    except Exception as e:
        print(f"✗ Erreur lors de la vérification du mot de passe: {e}")
else:
    print("✗ Compte de Latifa non trouvé")

conn.close()
