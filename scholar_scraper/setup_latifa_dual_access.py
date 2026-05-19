"""
Setup Latifa Ben Arfa Rabai with dual access (admin + chercheur).
This script:
1. Sets Latifa's email to latifa.rabai@isg.rnu.tn
2. Sets her password to larodec@latifabenarfarabai (hashed)
3. Sets her role to admin+chercheur (dual access)
4. Removes Dhouha Bensaid's account
"""
import os
import bcrypt
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

def setup_latifa():
    """Setup Latifa with dual access"""
    email = "latifa.rabai@isg.rnu.tn"
    password = "larodec@latifabenarfarabai"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Find all Latifa accounts
        cur.execute("""
            SELECT id, email, role FROM larodec_users 
            WHERE (nom ILIKE '%BEN ARFA RABAI%' OR nom ILIKE '%Ben Arfa Rabai%') 
              AND (prenom ILIKE '%LATIFA%' OR prenom ILIKE '%Latifa%')
        """)
        latifa_accounts = cur.fetchall()
        
        if latifa_accounts:
            # Find the account with the correct email (or the first one)
            target_id = None
            for account_id, current_email, current_role in latifa_accounts:
                if current_email == email:
                    target_id = account_id
                    break
            
            # If no account has the correct email, use the first one
            if target_id is None:
                target_id = latifa_accounts[0][0]
            
            # Update the target account
            cur.execute("""
                UPDATE larodec_users 
                SET email = %s, password = %s, role = 'admin+chercheur'
                WHERE id = %s
            """, (email, hashed, target_id))
            
            # Delete other Latifa accounts
            for account_id, _, _ in latifa_accounts:
                if account_id != target_id:
                    cur.execute("DELETE FROM larodec_users WHERE id = %s", (account_id,))
            
            latifa_updated = 1
        else:
            latifa_updated = 0
        
        # 2. Delete Dhouha Bensaid's account (if exists)
        cur.execute("""
            DELETE FROM larodec_users 
            WHERE (nom ILIKE '%BENSAID%' OR nom ILIKE '%Bensaid%') 
              AND (prenom ILIKE '%DHOUHA%' OR prenom ILIKE '%Dhouha%')
        """)
        
        dhouha_deleted = cur.rowcount
        
        conn.commit()
        conn.close()
        
        print("✓ Setup completed!")
        if latifa_updated > 0:
            print(f"  ✓ Latifa updated: email={email}, role=admin+chercheur")
            print(f"    Password: {password}")
        else:
            print("  ✗ Latifa not found or not updated")
        
        if dhouha_deleted > 0:
            print(f"  ✓ Dhouha Bensaid deleted")
        else:
            print("  ✗ Dhouha Bensaid not found")
        
        return latifa_updated > 0
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    setup_latifa()
