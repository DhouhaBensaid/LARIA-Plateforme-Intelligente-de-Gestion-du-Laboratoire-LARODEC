#!/usr/bin/env python3
"""
Script to reset a user's password
Usage: python reset_password.py <email> <new_password>
Example: python reset_password.py "faiz.rim@example.com" "larodec@faizrim"
"""

import os
import sys
import bcrypt
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "larodec_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "doudou"),
    "port": os.getenv("DB_PORT", "5432"),
}

def reset_password(email: str, new_password: str):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id, nom, prenom FROM larodec_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"✗ Utilisateur avec l'email '{email}' introuvable")
            return False
        
        user_id, nom, prenom = user
        
        # Hash the new password
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        
        # Update password
        cursor.execute("UPDATE larodec_users SET password = %s WHERE id = %s", (hashed, user_id))
        conn.commit()
        
        print(f"✓ Mot de passe changé avec succès!")
        print(f"  Utilisateur: {prenom} {nom} ({email})")
        print(f"  Nouveau mot de passe: {new_password}")
        return True
        
    except Exception as e:
        print(f"✗ Erreur: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <email> <new_password>")
        print("Example: python reset_password.py 'faiz.rim@example.com' 'larodec@faizrim'")
        sys.exit(1)
    
    email = sys.argv[1]
    new_password = sys.argv[2]
    
    reset_password(email, new_password)
