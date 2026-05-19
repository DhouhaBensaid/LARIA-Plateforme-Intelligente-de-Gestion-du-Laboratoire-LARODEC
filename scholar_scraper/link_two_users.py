#!/usr/bin/env python3
"""
Script pour lier deux utilisateurs spécifiques aux membres
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

def link_users():
    """Lie les deux utilisateurs aux membres"""
    
    users_to_link = [
        ("latifa.rabai@isg.rnu.tn", "BEN ARFA RABAI LATIFA"),
        ("rim.faiz@ihec.rnu.tn", "FAIZ RIM"),
    ]
    
    for email, nom_prenom in users_to_link:
        print(f"\n=== Liaison de {email} ({nom_prenom}) ===")
        
        # Trouver l'utilisateur
        user = query(
            "SELECT id, nom, prenom FROM larodec_users WHERE email = %s",
            (email,),
            one=True
        )
        
        if not user:
            print(f"  ✗ Utilisateur {email} non trouvé")
            continue
        
        print(f"  ✓ Utilisateur trouvé: {user['prenom']} {user['nom']} (ID: {user['id']})")
        
        # Chercher le membre dans les tables
        tables = [
            "enseignants_corps_a",
            "enseignants_corps_b",
            "doctorants",
            "etudiants_master_recherche",
            "cadres_post_doc",
        ]
        
        found = False
        for table in tables:
            member = query(
                f"SELECT id, nom_prenom FROM {table} WHERE LOWER(nom_prenom) = LOWER(%s)",
                (nom_prenom,),
                one=True
            )
            
            if member:
                print(f"  ✓ Membre trouvé dans {table}: {member['nom_prenom']} (ID: {member['id']})")
                
                # Mettre à jour l'utilisateur avec les infos du membre
                try:
                    member_info = query(
                        f"SELECT url_photo, grade, etablissement FROM {table} WHERE id = %s",
                        (member['id'],),
                        one=True
                    )
                    
                    if member_info:
                        execute(
                            "UPDATE larodec_users SET photo = %s WHERE id = %s",
                            (member_info.get('url_photo', ''), user['id'])
                        )
                        print(f"  ✓ Profil mis à jour avec la photo et les infos du membre")
                    
                    found = True
                    break
                except Exception as e:
                    print(f"  ✗ Erreur lors de la mise à jour: {e}")
        
        if not found:
            print(f"  ✗ Membre {nom_prenom} non trouvé dans aucune table")
    
    print(f"\n=== Liaison terminée ===")

if __name__ == "__main__":
    link_users()
