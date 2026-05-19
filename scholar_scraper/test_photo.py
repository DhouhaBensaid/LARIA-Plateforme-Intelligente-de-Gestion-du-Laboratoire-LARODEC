#!/usr/bin/env python3
"""Test if photos are stored in the database"""

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

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def query(sql, params=(), one=False):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params)
    result = cur.fetchone() if one else cur.fetchall()
    cur.close()
    conn.close()
    return result

# Check if Latifa has a photo
print("=== Checking Latifa's photo ===")
latifa = query("""
    SELECT id, nom, prenom, email, photo, photo_filename
    FROM larodec_users
    WHERE LOWER(CONCAT(prenom, ' ', nom)) = LOWER(%s)
""", ("Latifa Ben Arfa Rabai",), one=True)

if latifa:
    print(f"Found: {latifa['prenom']} {latifa['nom']} (ID: {latifa['id']})")
    print(f"  Email: {latifa['email']}")
    print(f"  Photo filename: {latifa['photo_filename']}")
    if latifa['photo']:
        print(f"  Photo size: {len(latifa['photo'])} bytes")
    else:
        print(f"  Photo: NULL (no photo stored)")
else:
    print("Latifa not found")

# Check Rim
print("\n=== Checking Rim's photo ===")
rim = query("""
    SELECT id, nom, prenom, email, photo, photo_filename
    FROM larodec_users
    WHERE LOWER(CONCAT(prenom, ' ', nom)) = LOWER(%s)
""", ("Rim Faiz",), one=True)

if rim:
    print(f"Found: {rim['prenom']} {rim['nom']} (ID: {rim['id']})")
    print(f"  Email: {rim['email']}")
    print(f"  Photo filename: {rim['photo_filename']}")
    if rim['photo']:
        print(f"  Photo size: {len(rim['photo'])} bytes")
    else:
        print(f"  Photo: NULL (no photo stored)")
else:
    print("Rim not found")

# List all users with photos
print("\n=== All users with photos ===")
users_with_photos = query("""
    SELECT id, nom, prenom, email, photo_filename, 
           CASE WHEN photo IS NOT NULL THEN 'YES' ELSE 'NO' END as has_photo,
           OCTET_LENGTH(photo) as photo_size
    FROM larodec_users
    WHERE role IN ('chercheur', 'admin+chercheur')
    ORDER BY nom, prenom
""")

for user in users_with_photos:
    size = user['photo_size'] if user['photo_size'] else 0
    print(f"  {user['prenom']} {user['nom']}: {user['has_photo']} ({size} bytes, filename: {user['photo_filename']})")
