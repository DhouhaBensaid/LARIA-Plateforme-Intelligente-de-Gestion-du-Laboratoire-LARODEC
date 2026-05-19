#!/usr/bin/env python3
"""Test the API response"""

import requests
import json

print("=== Testing /api/public/researchers ===")
response = requests.get("http://localhost:3001/api/public/researchers")
if response.status_code == 200:
    data = response.json()
    print(f"Found {len(data)} researchers")
    for researcher in data:
        if researcher.get('nom_prenom') and ('Rim' in researcher['nom_prenom'] or 'Latifa' in researcher['nom_prenom']):
            print(f"\n{researcher['nom_prenom']}:")
            print(f"  url_photo: {researcher.get('url_photo')}")
            print(f"  email: {researcher.get('email')}")
else:
    print(f"Error: {response.status_code}")

print("\n=== Testing /api/public/researcher/Rim Faiz ===")
response = requests.get("http://localhost:3001/api/public/researcher/Rim%20Faiz")
if response.status_code == 200:
    data = response.json()
    print(f"Rim Faiz:")
    print(f"  url_photo: {data.get('url_photo')}")
    print(f"  email: {data.get('email')}")
else:
    print(f"Error: {response.status_code}")
    print(f"Response: {response.text}")

print("\n=== Testing /api/public/researcher/LATIFA BEN ARFA RABAI ===")
response = requests.get("http://localhost:3001/api/public/researcher/LATIFA%20BEN%20ARFA%20RABAI")
if response.status_code == 200:
    data = response.json()
    print(f"Latifa:")
    print(f"  url_photo: {data.get('url_photo')}")
    print(f"  email: {data.get('email')}")
else:
    print(f"Error: {response.status_code}")
    print(f"Response: {response.text}")
