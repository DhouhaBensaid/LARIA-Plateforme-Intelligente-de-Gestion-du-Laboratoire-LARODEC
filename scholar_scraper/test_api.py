#!/usr/bin/env python3
"""
Test API endpoints
"""
import requests
import json
import time

BASE_URL = "http://localhost:3001/api"

print("=" * 60)
print("API Endpoint Tests")
print("=" * 60)

# Wait a moment for API to be ready
time.sleep(2)

# Test 1: Health check
print("\n[Test 1] Health check...")
try:
    response = requests.get("http://localhost:3001/health", timeout=5)
    print(f"✓ Status: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 2: Login with demo credentials
print("\n[Test 2] Login with demo credentials...")
try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@larodec.tn", "password": "admin123"},
        timeout=5
    )
    print(f"✓ Status: {response.status_code}")
    data = response.json()
    if "token" in data:
        print(f"  Token: {data['token'][:20]}...")
        print(f"  User: {data['user']['email']}")
    else:
        print(f"  Response: {data}")
except Exception as e:
    print(f"✗ Error: {e}")

# Test 3: Get researchers
print("\n[Test 3] Get researchers...")
try:
    response = requests.get(f"{BASE_URL}/researchers", timeout=5)
    print(f"✓ Status: {response.status_code}")
    data = response.json()
    print(f"  Found {len(data)} researchers")
    if data:
        print(f"  First: {data[0]}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Tests complete")
print("=" * 60)
