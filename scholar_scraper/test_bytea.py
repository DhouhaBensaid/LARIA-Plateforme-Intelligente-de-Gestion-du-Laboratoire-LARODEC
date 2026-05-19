#!/usr/bin/env python3
"""Test how BYTEA is returned"""

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

# Check Rim's photo
cur.execute("SELECT id, nom, prenom, photo FROM larodec_users WHERE id = 10")
rim = cur.fetchone()

print(f"Rim (ID 10):")
print(f"  photo type: {type(rim['photo'])}")
print(f"  photo value: {rim['photo'][:50] if rim['photo'] else 'None'}...")
print(f"  photo bool: {bool(rim['photo'])}")
print(f"  photo len: {len(rim['photo']) if rim['photo'] else 0}")

# Check Latifa's photo
cur.execute("SELECT id, nom, prenom, photo FROM larodec_users WHERE id = 1")
latifa = cur.fetchone()

print(f"\nLatifa (ID 1):")
print(f"  photo type: {type(latifa['photo'])}")
print(f"  photo value: {latifa['photo']}")
print(f"  photo bool: {bool(latifa['photo'])}")
print(f"  photo len: {len(latifa['photo']) if latifa['photo'] else 0}")

cur.close()
conn.close()
