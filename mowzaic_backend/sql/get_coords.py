import requests
import urllib.parse
import os

# Store the API token in an environment variable for security
token = os.environ.get("MAPBOX_TOKEN", "")

with open("test_addresses", "r") as f:
    for line in f:
        line = line.strip()
        
        if ":" not in line:
            print(f"Skipping invalid line: {line}")
            continue
        
        name, _, address = line.partition(":")  # Safer way to split
        
        # URL-encode the address
        encoded_address = urllib.parse.quote(address)

        # Fetch coordinates using Mapbox API
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded_address}.json?access_token={token}"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            if "features" in data and len(data["features"]) > 0:
                coords = data["features"][0]["center"]
                print(f"{name}:{address}:{coords}")
            else:
                print(f"{name}:No coordinates found")
        else:
            print(f"Error fetching data for {name}: {response.status_code}")

