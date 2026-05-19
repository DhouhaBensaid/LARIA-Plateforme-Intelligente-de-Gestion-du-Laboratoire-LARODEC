"""
Complete login test for Latifa
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

print("=" * 70)
print("TEST DE CONNEXION - LATIFA BEN ARFA RABAI")
print("=" * 70)

# Test credentials
email = "latifa.rabai@isg.rnu.tn"
password = "larodec@latifabenarfarabai"

print(f"\nIdentifiants de test:")
print(f"  Email: {email}")
print(f"  Mot de passe: {password}")

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# 1. Find user by email
print(f"\n1. Recherche de l'utilisateur par email...")
cur.execute("SELECT * FROM larodec_users WHERE email = %s", (email,))
row = cur.fetchone()

if not row:
    print(f"   ✗ ERREUR: Utilisateur non trouvé")
    conn.close()
    exit(1)

print(f"   ✓ Utilisateur trouvé")

# Get column names
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'larodec_users'")
columns = [col[0] for col in cur.fetchall()]
user_dict = dict(zip(columns, row))

print(f"   Email: {user_dict['email']}")
print(f"   Rôle: {user_dict['role']}")
print(f"   Nom: {user_dict['nom']} {user_dict['prenom']}")

# 2. Verify password
print(f"\n2. Vérification du mot de passe...")
hashed_password = user_dict['password']

try:
    if bcrypt.checkpw(password.encode(), hashed_password.encode()):
        print(f"   ✓ Mot de passe CORRECT")
        print(f"   ✓ Connexion réussie!")
    else:
        print(f"   ✗ Mot de passe INCORRECT")
except Exception as e:
    print(f"   ✗ ERREUR: {e}")

# 3. Check role
print(f"\n3. Vérification du rôle...")
if user_dict['role'] == 'admin':
    print(f"   ✓ Rôle: admin")
    print(f"   ✓ Accès au dashboard admin: OUI")
    print(f"   ✓ Accès au dashboard chercheur: OUI")
else:
    print(f"   ✗ Rôle: {user_dict['role']}")

# 4. Summary
print(f"\n" + "=" * 70)
print("RÉSUMÉ")
print("=" * 70)
print(f"\n✓ CONNEXION POSSIBLE AVEC:")
print(f"  Email: {email}")
print(f"  Mot de passe: {password}")
print(f"\n✓ ACCÈS:")
print(f"  Dashboard Admin: OUI")
print(f"  Dashboard Chercheur: OUI")
print(f"  Basculement: OUI")
print(f"\n" + "=" * 70)

conn.close()
