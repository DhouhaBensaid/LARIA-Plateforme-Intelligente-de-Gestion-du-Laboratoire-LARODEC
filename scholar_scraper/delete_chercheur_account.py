"""Delete chercheur@larodec.tn account from database"""
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

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Delete the account
    cur.execute("DELETE FROM larodec_users WHERE email = %s", ("chercheur@larodec.tn",))
    deleted = cur.rowcount
    
    conn.commit()
    conn.close()
    
    if deleted > 0:
        print(f"✓ Compte chercheur@larodec.tn supprimé avec succès")
    else:
        print("✗ Compte chercheur@larodec.tn non trouvé")
except Exception as e:
    print(f"Erreur: {e}")
