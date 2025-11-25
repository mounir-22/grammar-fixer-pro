#!/usr/bin/env python3
"""
Test the API server to make sure it works with the Chrome extension
"""

import requests
import json

def test_api():
    """Test the API server"""
    
    print("🧪 TESTING API SERVER")
    print("=" * 40)
    
    url = "http://localhost:8000"
    
    # Test health check
    try:
        response = requests.get(f"{url}/")
        print(f"✅ Health Check: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test correction endpoint
    test_text = "this is a test with som erors in the text"
    
    try:
        response = requests.post(
            f"{url}/correct",
            json={"text": test_text, "use_chunking": True},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Correction API Working!")
            print(f"   Original: {test_text}")
            print(f"   Corrected: {result['text']}")
            print(f"   Method: {result['method']}")
            print(f"   Time: {result['time']:.2f}s")
            print(f"   Changes: {len(result['suggestions'])}")
            
            print("\n🎉 API Server is ready for Chrome extension!")
            
        else:
            print(f"❌ Correction failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Correction test failed: {e}")

if __name__ == "__main__":
    test_api()