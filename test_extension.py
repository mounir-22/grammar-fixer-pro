#!/usr/bin/env python3
"""
Test the complete Chrome extension workflow
"""

import time
from backend.engine import LLMEngine

def test_extension_workflow():
    """Test the engine that powers the Chrome extension"""
    
    print("🎯 CHROME EXTENSION BACKEND TEST")
    print("=" * 50)
    
    try:
        engine = LLMEngine()
        
        # Simulate text from various form fields
        test_cases = [
            {
                'name': 'Comment Form',
                'text': 'this is my coment about the articel. i realy liked it and think its very informativ.',
                'field_type': 'textarea'
            },
            {
                'name': 'Contact Form',
                'text': 'plese contakt me about the job oppertunity. i am very intrested.',
                'field_type': 'input'
            },
            {
                'name': 'Review Form',  
                'text': 'the product is grate but the delivry was slow. overal i am satisfyed.',
                'field_type': 'contenteditable'
            }
        ]
        
        for i, case in enumerate(test_cases, 1):
            print(f"\nTest {i}: {case['name']} ({case['field_type']})")
            print(f"Original: {case['text']}")
            
            result = engine.correct_text(case['text'])
            
            if result['success']:
                print(f"✅ Corrected: {result['text']}")
                print(f"   Method: {result['method']}")
                print(f"   Time: {result['time']:.2f}s")
                print(f"   Changes: {len(result['suggestions'])}")
                
                if result['suggestions']:
                    for change in result['suggestions'][:3]:
                        print(f"     • {change}")
            else:
                print(f"❌ Failed: {result.get('error', 'Unknown error')}")
        
        print(f"\n✅ Backend ready for Chrome extension!")
        print(f"🚀 Start API server with: python backend/api_server.py")
        
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        print(f"💡 Make sure REPLICATE_API_TOKEN is set in backend/.env")

if __name__ == "__main__":
    test_extension_workflow()