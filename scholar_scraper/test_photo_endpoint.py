#!/usr/bin/env python3
"""Test the photo endpoint"""

import requests
import json

# Test if the photo endpoint returns data
print("Testing photo endpoint for user ID 1 (Latifa)...")
response = requests.get("http://localhost:3001/api/auth/photo/1")
print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")
print(f"Content-Length: {response.headers.get('content-length')}")
if response.status_code == 200:
    print(f"Response size: {len(response.content)} bytes")
    print("Photo endpoint works!")
else:
    print(f"Error: {response.text}")

print("\nTesting photo endpoint for user ID 10 (Rim)...")
response = requests.get("http://localhost:3001/api/auth/photo/10")
print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")
if response.status_code == 200:
    print(f"Response size: {len(response.content)} bytes")
    print("Photo endpoint works!")
else:
    print(f"Error: {response.text}")
