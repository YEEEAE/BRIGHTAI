import requests
import json
import os

API_KEY = "FPSX52aea0f994196e970227afa61c67dd1a"
BASE_URL = "https://api.freepik.com/v1/resources"

def search_and_download_icons(query, limit=3):
    headers = {
        "x-freepik-api-key": API_KEY,
        "Accept-Language": "en-US"
    }
    
    params = {
        "page": 1,
        "limit": limit,
        "term": query
        # Removing filters for now to ensure we get results, or fix format if needed. 
        # The error said filters.orientation must be an array, but simple dict params in requests often flatten.
        # Let's try without strict orientation filter first to debug.
    }
    
    # Try to find resources - Note: Freepik API structure might vary, this is a best-effort guess based on common patterns
    # Real Freepik API usually requires looking for 'resources' endpoint.
    print(f"Searching for: {query}...")
    
    try:
        response = requests.get(BASE_URL, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return

        data = response.json()
        resources = data.get('data', [])
        
        if not resources:
            print("No resources found.")
            return

        print(f"Found {len(resources)} resources. Downloading...")
        
        for i, resource in enumerate(resources):
            # The API usually returns a preview URL. For full download, we might need another endpoint, 
            # but for website display, the high-quality preview is often sufficient or we check 'image' keys.
            image_url = resource.get('image', {}).get('source', {}).get('url')
            
            if not image_url:
                # Fallback to preview if source not available
                 image_url = resource.get('image', {}).get('preview', {}).get('url')
            
            if image_url:
                print(f"Downloading {i+1}: {resource.get('title')}...")
                img_data = requests.get(image_url).content
                
                # Determine extension text
                ext = "jpg"
                if "png" in image_url: ext = "png"
                
                filename = f"assets/3d-icons/icon_{i+1}_{query.replace(' ', '_')}.{ext}"
                with open(filename, 'wb') as f:
                    f.write(img_data)
                print(f"Saved to {filename}")
                
    except Exception as e:
        print(f"Exception occurred: {e}")

if __name__ == "__main__":
    # Search for specific 3D AI related terms
    search_and_download_icons("3d robot artificial intelligence icon", limit=3)
    search_and_download_icons("3d rocket startup icon", limit=1)
