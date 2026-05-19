"""Check all users in the database"""
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
    
    cur.execute("SELECT id, email, nom, prenom, role FROM larodec_users ORDER BY nom, prenom")
    results = cur.fetchall()
    
    print("All users in database:")
    for row in results:
        print(f"  ID: {row[0]}, Email: {row[1]}, Name: {row[2]} {row[3]}, Role: {row[4]}")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
