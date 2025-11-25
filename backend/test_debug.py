"""
Debug script to test LLM connection
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
backend_dir = Path(__file__).parent
env_path = backend_dir / '.env'
load_dotenv(env_path)

print(f"🔍 Debug Information:")
print(f"   Backend dir: {backend_dir}")
print(f"   Env path: {env_path}")
print(f"   Env file exists: {env_path.exists()}")

# Check API token
api_token = os.getenv('REPLICATE_API_TOKEN')
if api_token:
    print(f"   API Token: {api_token[:10]}...{api_token[-4:]}")
else:
    print("   ❌ No API token found!")

# Test replicate import
try:
    import replicate
    print("✅ Replicate library imported successfully")
    
    # Test simple model call
    print("\n🧪 Testing LLM connection...")
    
    input_data = {
        "prompt": "Fix spelling: ths is a test",
        "max_new_tokens": 100,
        "temperature": 0.0,
        "top_p": 1.0,
        "do_sample": False
    }
    
    print(f"   Model: meta/meta-llama-3-8b-instruct")
    print(f"   Input: {input_data['prompt']}")
    
    output = ""
    for event in replicate.stream("meta/meta-llama-3-8b-instruct", input=input_data):
        output += str(event)
        if len(output) > 200:  # Stop early for test
            break
    
    print(f"✅ LLM Response (first 200 chars): {output[:200]}...")
    
except Exception as e:
    print(f"❌ Error testing LLM: {e}")
    print(f"   Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()

# Test engine
try:
    print("\n🧪 Testing Engine...")
    sys.path.append('.')
    from engine import LLMEngine
    
    engine = LLMEngine()
    print("✅ Engine initialized")
    
    result = engine.correct_text("ths is a test")
    print(f"✅ Engine test result:")
    print(f"   Success: {result.get('success', False)}")
    print(f"   Method: {result.get('method', 'Unknown')}")
    print(f"   Time: {result.get('time', 0):.2f}s")
    if result.get('error'):
        print(f"   Error: {result['error']}")
    else:
        print(f"   Corrected: {result.get('text', 'None')}")
    
except Exception as e:
    print(f"❌ Engine test failed: {e}")
    import traceback
    traceback.print_exc()