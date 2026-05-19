#!/usr/bin/env python3
"""Test downloading the photo"""

import requests

print("Testing photo endpoint for Rim (ID 10)...")
response = requests.get("http://localhost:3001/api/auth/photo/10")
print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('content-type')}")
print(f"Content-Length: {response.headers.get('content-length')}")
print(f"Response size: {len(response.content)} bytes")

if response.status_code == 200:
    print("SUCCESS! Photo endpoint works!")
    # Save to file to verify
    with open("rim_photo.png", "wb") as f:
        f.write(response.content)
    print("Photo saved to rim_photo.png")
else:
    print(f"ERROR: {response.text}")
