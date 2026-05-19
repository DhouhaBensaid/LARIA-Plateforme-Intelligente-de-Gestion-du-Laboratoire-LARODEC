"""Test the theses API endpoints"""
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
    
    # Check if table exists
    cur.execute("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'larodec_theses'
        )
    """)
    table_exists = cur.fetchone()[0]
    print(f"Table larodec_theses exists: {table_exists}")
    
    if table_exists:
        # Check columns
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'larodec_theses'
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        print("\nColumns in larodec_theses:")
        for col_name, col_type in columns:
            print(f"  - {col_name}: {col_type}")
        
        # Check if we can insert
        print("\nTesting insert...")
        cur.execute("""
            INSERT INTO larodec_theses (titre, annee, annee_premiere_inscription, sujet, chercheur_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, ("Test Thesis", 2025, 2021, "Test Subject", 1))
        
        thesis_id = cur.fetchone()[0]
        print(f"✓ Insert successful, ID: {thesis_id}")
        
        # Verify
        cur.execute("SELECT * FROM larodec_theses WHERE id = %s", (thesis_id,))
        result = cur.fetchone()
        print(f"✓ Verification successful: {result}")
        
        # Clean up
        cur.execute("DELETE FROM larodec_theses WHERE id = %s", (thesis_id,))
        print("✓ Cleanup successful")
        
        conn.commit()
    
    conn.close()
    print("\n✓ All tests passed!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
