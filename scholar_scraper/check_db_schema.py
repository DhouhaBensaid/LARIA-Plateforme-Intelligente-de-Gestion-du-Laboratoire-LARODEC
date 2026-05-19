#!/usr/bin/env python3
"""
Check if database schema is initialized
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "larodec_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_PORT = os.getenv("DB_PORT", "5432")

print("=" * 60)
print("Database Schema Check")
print("=" * 60)

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cur = conn.cursor()
    
    # Get all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cur.fetchall()
    
    if tables:
        print(f"\n✓ Found {len(tables)} tables in database:")
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("\n✗ No tables found in database!")
        print("  The schema needs to be initialized.")
    
    conn.close()
    
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
