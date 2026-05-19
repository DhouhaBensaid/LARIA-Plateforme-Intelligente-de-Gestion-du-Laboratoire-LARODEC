#!/usr/bin/env python3
"""
Migration script to add photo, google_scholar_url, and telephone fields to larodec_users table
Run: python migrate_add_photo.py
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "larodec_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "doudou"),
    "port": os.getenv("DB_PORT", "5432"),
}

def migrate():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Add columns if they don't exist
        cursor.execute("""
            ALTER TABLE larodec_users 
            ADD COLUMN IF NOT EXISTS telephone TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS photo BYTEA DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS photo_filename TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS google_scholar_url TEXT DEFAULT NULL;
        """)
        
        conn.commit()
        print("✓ Migration completed successfully!")
        print("  - Added 'telephone' column (TEXT)")
        print("  - Added 'photo' column (BYTEA)")
        print("  - Added 'photo_filename' column (TEXT)")
        print("  - Added 'google_scholar_url' column (TEXT)")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()
