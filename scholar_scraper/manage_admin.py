"""
Manage admin user dynamically based on laboratory direction.
The admin changes automatically when the direction changes.

Usage: python manage_admin.py [--set-admin "NOM PRENOM"] [--get-admin]
"""
import os
import sys
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

def generate_password(nom: str, prenom: str) -> str:
    """Generate password: larodec + nom + prenom (lowercase, no spaces)"""
    nom_clean = nom.replace(" ", "").lower()
    prenom_clean = prenom.replace(" ", "").lower()
    return f"larodec{nom_clean}{prenom_clean}"

def get_current_admin():
    """Get current admin user"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT id, email, nom, prenom FROM larodec_users WHERE role = 'admin' LIMIT 1")
        result = cur.fetchone()
        conn.close()
        if result:
            return {"id": result[0], "email": result[1], "nom": result[2], "prenom": result[3]}
        return None
    except Exception as e:
        print(f"Error getting current admin: {e}")
        return None

def set_admin(nom: str, prenom: str, email: str = None):
    """Set a new admin user"""
    if email is None:
        email = "admin@larodec.tn"
    
    password = generate_password(nom, prenom)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Remove admin role from all users
        cur.execute("UPDATE larodec_users SET role = 'chercheur' WHERE role = 'admin'")
        
        # Check if user exists
        cur.execute("SELECT id FROM larodec_users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user:
            # Update existing user
            cur.execute("""
                UPDATE larodec_users 
                SET role = 'admin', password = %s, nom = %s, prenom = %s
                WHERE email = %s
            """, (hashed, nom, prenom, email))
        else:
            # Create new user
            cur.execute("""
                INSERT INTO larodec_users (email, password, role, nom, prenom, cin, etablissement, universite, grade)
                VALUES (%s, %s, 'admin', %s, %s, '', 'ISG Tunis', 'Université de Tunis', 'Professeur')
            """, (email, hashed, nom, prenom))
        
        conn.commit()
        conn.close()
        
        print(f"✓ Admin updated successfully!")
        print(f"  Name: {nom} {prenom}")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        return True
    except Exception as e:
        print(f"Error setting admin: {e}")
        return False

def list_researchers():
    """List all researchers who can be admin"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, nom, prenom, grade, email 
            FROM larodec_users 
            WHERE role IN ('chercheur', 'admin')
            ORDER BY nom, prenom
        """)
        results = cur.fetchall()
        conn.close()
        
        print("\nAvailable researchers:")
        for row in results:
            role = "ADMIN" if row[4] == "admin@larodec.tn" else "chercheur"
            print(f"  {row[1]} {row[2]} ({row[3]}) - {role}")
        return results
    except Exception as e:
        print(f"Error listing researchers: {e}")
        return []

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--get-admin":
            admin = get_current_admin()
            if admin:
                print(f"Current admin: {admin['nom']} {admin['prenom']} ({admin['email']})")
            else:
                print("No admin found")
        elif sys.argv[1] == "--set-admin" and len(sys.argv) > 2:
            name_parts = sys.argv[2].split()
            if len(name_parts) >= 2:
                nom = " ".join(name_parts[:-1]).upper()
                prenom = name_parts[-1].upper()
                set_admin(nom, prenom)
            else:
                print("Usage: python manage_admin.py --set-admin 'NOM PRENOM'")
        elif sys.argv[1] == "--list":
            list_researchers()
        else:
            print("Usage:")
            print("  python manage_admin.py --get-admin          # Get current admin")
            print("  python manage_admin.py --set-admin 'NOM PRENOM'  # Set new admin")
            print("  python manage_admin.py --list               # List all researchers")
    else:
        admin = get_current_admin()
        if admin:
            print(f"Current admin: {admin['nom']} {admin['prenom']} ({admin['email']})")
        else:
            print("No admin found")
