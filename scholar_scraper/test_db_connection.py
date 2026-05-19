#!/usr/bin/env python3
"""
Test PostgreSQL connection with different authentication methods
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
print("PostgreSQL Connection Test")
print("=" * 60)
print(f"Host: {DB_HOST}")
print(f"Port: {DB_PORT}")
print(f"User: {DB_USER}")
print(f"Database: {DB_NAME}")
print(f"Password: {'*' * len(DB_PASSWORD) if DB_PASSWORD else '(empty)'}")
print("=" * 60)

# Test 1: Try with password from .env
print("\n[Test 1] Connecting with password from .env...")
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    print("✓ SUCCESS! Connected to database")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print(f"  PostgreSQL version: {version[0]}")
    conn.close()
except psycopg2.OperationalError as e:
    print(f"✗ FAILED: {e}")

# Test 2: Try without password (trust authentication)
print("\n[Test 2] Connecting without password (trust auth)...")
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        database=DB_NAME
    )
    print("✓ SUCCESS! Connected to database (no password needed)")
    conn.close()
except psycopg2.OperationalError as e:
    print(f"✗ FAILED: {e}")

# Test 3: Try connecting to postgres database (default)
print("\n[Test 3] Connecting to 'postgres' database with password...")
try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database="postgres"
    )
    print("✓ SUCCESS! Connected to 'postgres' database")
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datname = %s;", (DB_NAME,))
    result = cur.fetchone()
    if result:
        print(f"  Database '{DB_NAME}' exists")
    else:
        print(f"  Database '{DB_NAME}' does NOT exist")
    conn.close()
except psycopg2.OperationalError as e:
    print(f"✗ FAILED: {e}")

print("\n" + "=" * 60)
print("Diagnosis complete")
print("=" * 60)
