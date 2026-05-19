"""
Migrate larodec_theses table to add new fields for chercheur theses management.
Adds: annee_premiere_inscription, sujet, chercheur_id
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
    
    # Check if columns exist, if not add them
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'larodec_theses' AND column_name = 'annee_premiere_inscription'
    """)
    
    if not cur.fetchone():
        print("Adding annee_premiere_inscription column...")
        cur.execute("""
            ALTER TABLE larodec_theses 
            ADD COLUMN annee_premiere_inscription INT DEFAULT 0
        """)
    
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'larodec_theses' AND column_name = 'sujet'
    """)
    
    if not cur.fetchone():
        print("Adding sujet column...")
        cur.execute("""
            ALTER TABLE larodec_theses 
            ADD COLUMN sujet TEXT DEFAULT ''
        """)
    
    cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'larodec_theses' AND column_name = 'chercheur_id'
    """)
    
    if not cur.fetchone():
        print("Adding chercheur_id column...")
        cur.execute("""
            ALTER TABLE larodec_theses 
            ADD COLUMN chercheur_id INT REFERENCES larodec_users(id) ON DELETE SET NULL
        """)
    
    conn.commit()
    conn.close()
    
    print("✓ Migration completed successfully!")
except Exception as e:
    print(f"Error: {e}")
