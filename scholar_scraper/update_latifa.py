"""
Update Latifa's account:
1. Change password to larodecbenarfaLatifa
2. Give her access to both admin and chercheur dashboards
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

# Generate new password
password = "larodecbenarfaLatifa"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Update Latifa's password and role to admin+chercheur
cur.execute(
    "UPDATE larodec_users SET password = %s, role = %s WHERE email = %s",
    (hashed, "admin+chercheur", "latifa.rabai@isg.rnu.tn")
)
print("✓ Mot de passe de Latifa changé à: larodecbenarfaLatifa")
print("✓ Rôle de Latifa changé à: admin+chercheur")
print("✓ Latifa peut maintenant accéder aux deux dashboards")

conn.commit()
conn.close()
print("\nDone!")
