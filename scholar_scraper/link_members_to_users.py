#!/usr/bin/env python3
"""
Script pour lier les membres (enseignants, doctorants, etc.) avec les utilisateurs larodec_users
Crée des comptes utilisateurs pour chaque membre s'ils n'existent pas déjà
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "larodec")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

def get_conn():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME,
        user=DB_USER, password=DB_PASSWORD
    )

def query(sql, params=(), one=False):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(sql, params)
    result = cur.fetchone() if one else cur.fetchall()
    conn.close()
    return result

def execute(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()

def link_members_to_users():
    """Crée des comptes utilisateurs pour chaque membre"""
    
    tables = [
        ("enseignants_corps_a", "Professeur"),
        ("enseignants_corps_b", "Maitre Assistant"),
        ("doctorants", "Doctorant"),
        ("etudiants_master_recherche", "Master Recherche"),
        ("cadres_post_doc", "Post-Doc"),
    ]
    
    total_created = 0
    total_linked = 0
    
    for table, role in tables:
        print(f"\n=== Traitement de {table} ({role}) ===")
        
        try:
            # Récupérer tous les membres de cette table
            sql = f"""
                SELECT id, nom_prenom, COALESCE(url_photo, '') as url_photo, 
                       COALESCE(grade, '') as grade, COALESCE(etablissement, '') as etablissement
                FROM {table}
                ORDER BY nom_prenom
            """
            members = query(sql)
            print(f"Trouvé {len(members)} membres")
            
            for member in members:
                nom_prenom = member['nom_prenom']
                url_photo = member.get('url_photo', '')
                
                # Vérifier si un utilisateur existe déjà avec ce nom
                existing = query(
                    "SELECT id FROM larodec_users WHERE LOWER(nom || ' ' || prenom) = LOWER(%s)",
                    (nom_prenom,),
                    one=True
                )
                
                if existing:
                    print(f"  ✓ {nom_prenom} - Utilisateur existant (ID: {existing['id']})")
                    total_linked += 1
                else:
                    # Créer un nouvel utilisateur
                    parts = nom_prenom.split()
                    prenom = parts[0] if len(parts) > 0 else ""
                    nom = " ".join(parts[1:]) if len(parts) > 1 else parts[0]
                    
                    # Générer un mot de passe temporaire
                    temp_password = f"{nom.lower()}{prenom.lower()}123"
                    
                    try:
                        execute("""
                            INSERT INTO larodec_users (nom, prenom, email, telephone, photo_url, role, password_hash, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, crypt(%s, gen_salt('bf')), NOW())
                        """, (nom, prenom, "", "", url_photo, "chercheur", temp_password))
                        
                        print(f"  ✓ {nom_prenom} - Compte créé (mot de passe: {temp_password})")
                        total_created += 1
                    except Exception as e:
                        print(f"  ✗ {nom_prenom} - Erreur: {e}")
        
        except Exception as e:
            print(f"Erreur pour {table}: {e}")
    
    print(f"\n=== Résumé ===")
    print(f"Comptes créés: {total_created}")
    print(f"Comptes liés: {total_linked}")
    print(f"Total traité: {total_created + total_linked}")

if __name__ == "__main__":
    link_members_to_users()
