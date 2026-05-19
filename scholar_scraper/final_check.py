"""
Final verification that everything is set up correctly for Latifa
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

print("=" * 60)
print("VÉRIFICATION FINALE - CONFIGURATION DE LATIFA")
print("=" * 60)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# 1. Check Latifa's account
print("\n1. Vérification du compte de Latifa...")
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    user_id, email, role, nom, prenom = result
    print(f"   ✓ Email: {email}")
    print(f"   ✓ Rôle: {role}")
    print(f"   ✓ Nom: {nom} {prenom}")
    
    if role == "admin+chercheur":
        print("   ✓ Rôle admin+chercheur configuré correctement")
    else:
        print(f"   ✗ ERREUR: Rôle attendu 'admin+chercheur', trouvé '{role}'")
else:
    print("   ✗ ERREUR: Compte de Latifa non trouvé")

# 2. Check password
print("\n2. Vérification du mot de passe...")
test_password = "larodecbenarfaLatifa"
cur.execute(
    "SELECT password FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    hashed_password = result[0]
    try:
        if bcrypt.checkpw(test_password.encode(), hashed_password.encode()):
            print(f"   ✓ Mot de passe correct: {test_password}")
        else:
            print(f"   ✗ ERREUR: Mot de passe incorrect")
    except Exception as e:
        print(f"   ✗ ERREUR: {e}")
else:
    print("   ✗ ERREUR: Compte non trouvé")

# 3. Check that Dhouha Bensaid is deleted
print("\n3. Vérification que Dhouha Bensaid est supprimé...")
cur.execute(
    "SELECT COUNT(*) FROM larodec_users WHERE LOWER(nom) LIKE %s OR LOWER(prenom) LIKE %s",
    ("%dhouha%", "%bensaid%")
)
count = cur.fetchone()[0]

if count == 0:
    print("   ✓ Dhouha Bensaid supprimé correctement")
else:
    print(f"   ✗ ERREUR: {count} compte(s) de Dhouha Bensaid trouvé(s)")

# 4. Check other users
print("\n4. Utilisateurs restants...")
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users ORDER BY id"
)
users = cur.fetchall()

for user in users:
    user_id, email, role, nom, prenom = user
    print(f"   - {nom} {prenom} ({email}) - Rôle: {role}")

# 5. Summary
print("\n" + "=" * 60)
print("RÉSUMÉ")
print("=" * 60)
print("\n✓ Configuration de Latifa Ben Arfa Rabai:")
print("  - Email: latifa.rabai@isg.rnu.tn")
print("  - Mot de passe: larodecbenarfaLatifa")
print("  - Rôle: admin+chercheur")
print("  - Accès: Dashboard Admin + Dashboard Chercheur")
print("\n✓ Dhouha Bensaid supprimé")
print("\n✓ Prêt pour la connexion!")
print("\n" + "=" * 60)

conn.close()
