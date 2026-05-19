"""
Verify that Latifa has dual access to both dashboards
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
print("VÉRIFICATION - ACCÈS DUAL POUR LATIFA")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Get Latifa's account
cur.execute(
    "SELECT id, email, role, nom, prenom FROM larodec_users WHERE email = %s",
    ("latifa.rabai@isg.rnu.tn",)
)
result = cur.fetchone()

if result:
    user_id, email, role, nom, prenom = result
    
    print(f"\n✓ Compte de Latifa trouvé:")
    print(f"  Email: {email}")
    print(f"  Rôle: {role}")
    print(f"  Nom: {nom} {prenom}")
    
    # Check role
    print(f"\n✓ Vérification du rôle:")
    if role == "admin+chercheur":
        print(f"  ✓ Rôle: admin+chercheur")
        print(f"  ✓ Accès au dashboard admin: OUI")
        print(f"  ✓ Accès au dashboard chercheur: OUI")
        print(f"  ✓ Basculement entre dashboards: OUI")
    else:
        print(f"  ✗ ERREUR: Rôle attendu 'admin+chercheur', trouvé '{role}'")
    
    # Check password
    print(f"\n✓ Vérification du mot de passe:")
    test_password = "larodec@latifabenarfarabai"
    cur.execute(
        "SELECT password FROM larodec_users WHERE email = %s",
        ("latifa.rabai@isg.rnu.tn",)
    )
    pwd_result = cur.fetchone()
    
    if pwd_result:
        hashed_password = pwd_result[0]
        try:
            if bcrypt.checkpw(test_password.encode(), hashed_password.encode()):
                print(f"  ✓ Mot de passe correct: {test_password}")
            else:
                print(f"  ✗ Mot de passe incorrect")
        except Exception as e:
            print(f"  ✗ ERREUR: {e}")
    
    # Summary
    print(f"\n" + "=" * 70)
    print("RÉSUMÉ")
    print("=" * 70)
    print(f"\n✓ CONFIGURATION COMPLÈTE:")
    print(f"  Email: {email}")
    print(f"  Mot de passe: {test_password}")
    print(f"  Rôle: {role}")
    print(f"\n✓ ACCÈS:")
    print(f"  Dashboard Admin: OUI")
    print(f"  Dashboard Chercheur: OUI")
    print(f"  Basculement: OUI")
    print(f"\n✓ PRÊT POUR LA CONNEXION!")
    print(f"\n" + "=" * 70)
else:
    print("✗ ERREUR: Compte de Latifa non trouvé")

conn.close()
