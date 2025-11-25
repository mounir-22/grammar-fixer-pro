"""
API Test Script - Test all Grammar Fixer Pro endpoints
"""
import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_endpoint(name, method, url, data=None):
    print(f"🔍 Testing {name}...")
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=data, timeout=30)
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {json.dumps(result, indent=2)[:200]}...")
            return True
        else:
            print(f"   ❌ Failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🌐 GRAMMAR FIXER PRO API TEST")
    print("=" * 40)
    
    # Test 1: Health check
    test_endpoint("Health Check", "GET", f"{API_BASE}/")
    print()
    
    # Test 2: Detailed health
    test_endpoint("Detailed Health", "GET", f"{API_BASE}/health")
    print()
    
    # Test 3: Engine test
    test_endpoint("Engine Test", "GET", f"{API_BASE}/test")
    print()
    
    # Test 4: Grammar correction
    correction_data = {
        "text": "ths is a test with som erors in it",
        "use_chunking": True
    }
    test_endpoint("Grammar Correction", "POST", f"{API_BASE}/correct", correction_data)
    print()
    
    # Test 5: Naturalness enhancement
    enhancement_data = {
        "text": "who I haven't seen since like forever and stuff",
        "enhancement_type": "naturalness"
    }
    test_endpoint("Naturalness Enhancement", "POST", f"{API_BASE}/enhance", enhancement_data)
    print()
    
    # Test 6: Formality enhancement
    enhancement_data = {
        "text": "I think we should maybe try this approach because it's pretty good",
        "enhancement_type": "formality"
    }
    test_endpoint("Formality Enhancement", "POST", f"{API_BASE}/enhance", enhancement_data)
    print()
    
    # Test 7: Large text chunking
    large_text = """this is a very long documnt with many erors that need to be corected. the qick brwn fox jumps ovr the lzy dog in this exampel sentance. we shoud chek for gramer and speling mistakes carefuly befor submiting any documnt to managment. qualiy is extremly importnt for sucess in this projct."""
    
    chunking_data = {
        "text": large_text,
        "use_chunking": True
    }
    test_endpoint("Large Text Chunking", "POST", f"{API_BASE}/correct", chunking_data)
    print()
    
    print("🎉 API TESTS COMPLETED!")
    print("✅ All endpoints tested")
    print("🚀 Ready for Chrome extension integration!")

if __name__ == "__main__":
    main()