#!/usr/bin/env python3
"""Check photos directly from database"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host"    : os.getenv("DB_HOST",     "localhost"),
    "database": os.getenv("DB_NAME",     "larodec_db"),
    "user"    : os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", "doudou"),
    "port"    : os.getenv("DB_PORT",     "5432"),
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# Check Latifa (ID 1)
cur.execute("SELECT id, nom, prenom, photo IS NOT NULL as has_photo, OCTET_LENGTH(photo) as size FROM larodec_users WHERE id = 1")
result = cur.fetchone()
print(f"Latifa (ID 1): {result}")

# Check Rim (ID 10)
cur.execute("SELECT id, nom, prenom, photo IS NOT NULL as has_photo, OCTET_LENGTH(photo) as size FROM larodec_users WHERE id = 10")
result = cur.fetchone()
print(f"Rim (ID 10): {result}")

# Check all users
cur.execute("""
    SELECT id, nom, prenom, 
           CASE WHEN photo IS NOT NULL THEN 'YES' ELSE 'NO' END as has_photo,
           OCTET_LENGTH(photo) as size
    FROM larodec_users
    WHERE role IN ('chercheur', 'admin+chercheur')
    ORDER BY id
""")
results = cur.fetchall()
print("\nAll users:")
for row in results:
    print(f"  ID {row[0]}: {row[1]} {row[2]} - Photo: {row[3]} (Size: {row[4]})")

cur.close()
conn.close()
