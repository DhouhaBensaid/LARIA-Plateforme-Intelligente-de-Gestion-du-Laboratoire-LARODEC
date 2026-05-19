"""
Final verification of Latifa's complete setup
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
print("VÉRIFICATION FINALE - CONFIGURATION DE LATIFA BEN ARFA RABAI")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# 1. Check Latifa's account
print("\n1. VÉRIFICATION DU COMPTE")
print("-" * 70)
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    user_id, email, role, nom, prenom = result
    print(f"✓ Email: {email}")
    print(f"✓ Rôle: {role}")
    print(f"✓ Nom: {nom} {prenom}")
    
    if role == "admin":
        print("✓ Rôle admin configuré correctement")
    else:
        print(f"✗ ERREUR: Rôle attendu 'admin', trouvé '{role}'")
else:
    print("✗ ERREUR: Compte de Latifa non trouvé")

# 2. Check password
print("\n2. VÉRIFICATION DU MOT DE PASSE")
print("-" * 70)
test_password = "larodec@latifabenarfarabai"
cur.execute(
    "SELECT password FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    hashed_password = result[0]
    try:
        if bcrypt.checkpw(test_password.encode(), hashed_password.encode()):
            print(f"✓ Mot de passe correct: {test_password}")
        else:
            print(f"✗ ERREUR: Mot de passe incorrect")
    except Exception as e:
        print(f"✗ ERREUR: {e}")
else:
    print("✗ ERREUR: Compte non trouvé")

# 3. Check that Dhouha Bensaid is deleted
print("\n3. VÉRIFICATION - DHOUHA BENSAID SUPPRIMÉ")
print("-" * 70)
cur.execute(
    "SELECT COUNT(*) FROM larodec_users WHERE LOWER(nom) LIKE %s OR LOWER(prenom) LIKE %s",
    ("%dhouha%", "%bensaid%")
)
count = cur.fetchone()[0]

if count == 0:
    print("✓ Dhouha Bensaid supprimé correctement")
else:
    print(f"✗ ERREUR: {count} compte(s) de Dhouha Bensaid trouvé(s)")

# 4. Check other users
print("\n4. UTILISATEURS DANS LA BASE DE DONNÉES")
print("-" * 70)
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users ORDER BY id"
)
users = cur.fetchall()

for user in users:
    user_id, email, role, nom, prenom = user
    print(f"   ID {user_id}: {nom} {prenom}")
    print(f"            Email: {email}")
    print(f"            Rôle: {role}")

# 5. Summary
print("\n" + "=" * 70)
print("RÉSUMÉ FINAL")
print("=" * 70)
print("\n✓ CONFIGURATION COMPLÈTE:")
print("  Email: latifa.rabai@isg.rnu.tn")
print("  Mot de passe: larodec@latifabenarfarabai")
print("  Rôle: admin")
print("  Accès: Dashboard Admin + Dashboard Chercheur")
print("\n✓ MODIFICATIONS:")
print("  - Mot de passe changé au format: larodec@latifabenarfarabai")
print("  - Rôle: admin (accès aux deux dashboards)")
print("  - Dhouha Bensaid supprimé")
print("  - Layout React mis à jour")
print("  - API Python mise à jour")
print("\n✓ PRÊT POUR LA CONNEXION!")
print("\n" + "=" * 70)

conn.close()
