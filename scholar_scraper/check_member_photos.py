#!/usr/bin/env python3
"""Check what photos are in member tables"""

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

# Check enseignants_corps_a for Latifa
print("=== Latifa in enseignants_corps_a ===")
cur.execute("""
    SELECT id, nom_prenom, url_photo, grade
    FROM enseignants_corps_a
    WHERE LOWER(nom_prenom) LIKE LOWER('%latifa%')
""")
result = cur.fetchone()
if result:
    print(f"Found: {result['nom_prenom']}")
    print(f"  url_photo: {result['url_photo']}")
    print(f"  grade: {result['grade']}")
else:
    print("Not found")

# Check enseignants_corps_a for Rim
print("\n=== Rim in enseignants_corps_a ===")
cur.execute("""
    SELECT id, nom_prenom, url_photo, grade
    FROM enseignants_corps_a
    WHERE LOWER(nom_prenom) LIKE LOWER('%rim%')
""")
result = cur.fetchone()
if result:
    print(f"Found: {result['nom_prenom']}")
    print(f"  url_photo: {result['url_photo']}")
    print(f"  grade: {result['grade']}")
else:
    print("Not found")

# Check cadres_post_doc for Rim
print("\n=== Rim in cadres_post_doc ===")
cur.execute("""
    SELECT id, nom_prenom, url_photo
    FROM cadres_post_doc
    WHERE LOWER(nom_prenom) LIKE LOWER('%rim%')
""")
result = cur.fetchone()
if result:
    print(f"Found: {result['nom_prenom']}")
    print(f"  url_photo: {result['url_photo']}")
else:
    print("Not found")

cur.close()
conn.close()
