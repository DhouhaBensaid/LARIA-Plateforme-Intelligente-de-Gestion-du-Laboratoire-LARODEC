"""
Fix the larodec_theses table structure to match the API requirements.
Remove unnecessary columns and ensure we have the right ones.
"""
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
    
    print("Checking current table structure...")
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'larodec_theses'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    print("Current columns:")
    for col_name, col_type in columns:
        print(f"  - {col_name}: {col_type}")
    
    # Drop the old table and recreate it with the correct structure
    print("\nRecreating table with correct structure...")
    
    cur.execute("DROP TABLE IF EXISTS larodec_theses CASCADE")
    
    cur.execute("""
        CREATE TABLE larodec_theses (
            id                          SERIAL PRIMARY KEY,
            titre                       TEXT NOT NULL,
            annee                       INT NOT NULL DEFAULT 0,
            annee_premiere_inscription  INT NOT NULL DEFAULT 0,
            sujet                       TEXT NOT NULL DEFAULT '',
            chercheur_id                INT REFERENCES larodec_users(id) ON DELETE SET NULL,
            created_at                  TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    
    conn.commit()
    
    print("✓ Table recreated successfully!")
    
    # Verify
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'larodec_theses'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    print("\nNew columns:")
    for col_name, col_type in columns:
        print(f"  - {col_name}: {col_type}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
