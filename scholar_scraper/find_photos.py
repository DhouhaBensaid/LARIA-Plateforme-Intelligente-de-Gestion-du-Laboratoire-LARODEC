#!/usr/bin/env python3
"""Find all users with photos"""

import psycopg2
import psycopg2.extras
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
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Find all users with photos
cur.execute("""
    SELECT id, nom, prenom, email, photo_filename,
           photo IS NOT NULL as has_photo,
           OCTET_LENGTH(photo) as photo_size
    FROM larodec_users
    ORDER BY id
""")

results = cur.fetchall()
print("=== All users in larodec_users ===")
for row in results:
    status = "YES" if row['has_photo'] else "NO"
    size = row['photo_size'] if row['photo_size'] else 0
    print(f"ID {row['id']}: {row['prenom']} {row['nom']} - Photo: {status} ({size} bytes)")

cur.close()
conn.close()
