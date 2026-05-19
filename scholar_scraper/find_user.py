#!/usr/bin/env python3
"""Find users by name"""

import os
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

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Find users with "Rim" or "Faiz" in their name
    cursor.execute("""
        SELECT id, email, nom, prenom, role 
        FROM larodec_users 
        WHERE LOWER(nom) LIKE '%rim%' OR LOWER(prenom) LIKE '%rim%'
           OR LOWER(nom) LIKE '%faiz%' OR LOWER(prenom) LIKE '%faiz%'
        ORDER BY nom, prenom
    """)
    
    users = cursor.fetchall()
    
    if users:
        print("Utilisateurs trouvés:")
        for user_id, email, nom, prenom, role in users:
            print(f"  ID: {user_id} | {prenom} {nom} | {email} | Role: {role}")
    else:
        print("Aucun utilisateur trouvé avec 'Rim' ou 'Faiz'")
        print("\nTous les utilisateurs:")
        cursor.execute("SELECT id, email, nom, prenom, role FROM larodec_users ORDER BY nom, prenom")
        for user_id, email, nom, prenom, role in cursor.fetchall():
            print(f"  ID: {user_id} | {prenom} {nom} | {email} | Role: {role}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Erreur: {e}")
