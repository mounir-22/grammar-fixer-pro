"""
Grammar Fixer Pro - API Server
FastAPI server for Chrome extension integration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine import LLMEngine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Grammar Fixer Pro API",
    description="AI-powered grammar and spell checking API",
    version="1.0.0"
)

# Configure CORS for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Chrome extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic models
class TextRequest(BaseModel):
    text: str
    api_key: str

class EnhanceRequest(BaseModel):
    text: str
    enhancement_type: str
    api_key: str

logger.info("API server ready - engine will be initialized per request with user API key")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Grammar Fixer Pro API",
        "status": "running",
        "message": "Ready to accept API keys"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test engine initialization with dummy key
        test_engine = LLMEngine(api_key="test")
        return {
            "status": "healthy",
            "engine": "ready",
            "features": [
                "spell_checking",
                "grammar_correction",
                "text_enhancement"
            ],
            "message": "Provide your Replicate API key in requests"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Engine test failed: {str(e)}")

@app.get("/test")
async def test_engine():
    """Test the grammar engine"""
    return {
        "message": "Test endpoint requires API key in POST request body",
        "example": {
            "text": "ths is a test",
            "api_key": "your_replicate_api_key_here"
        }
    }

@app.post("/correct")
async def correct_text(request: TextRequest):
    """Correct grammar and spelling in the provided text"""
    try:
        logger.info(f"Correcting text: {request.text[:50]}...")
        
        # Initialize engine with user's API key
        engine = LLMEngine(api_key=request.api_key)
        result = await engine.correct_text_async(request.text)
        
        logger.info(f"Correction completed. Success: {result['success']}")
        return result
    except Exception as e:
        logger.error(f"Error correcting text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error correcting text: {str(e)}")

@app.post("/enhance")
async def enhance_text(request: EnhanceRequest):
    """Enhance text for naturalness or formality"""
    try:
        logger.info(f"Enhancing text for {request.enhancement_type}: {request.text[:50]}...")
        
        # Initialize engine with user's API key
        engine = LLMEngine(api_key=request.api_key)
        
        if request.enhancement_type == "naturalness":
            result = await engine.enhance_naturalness(request.text)
        elif request.enhancement_type == "formality":
            result = await engine.enhance_formality(request.text)
        else:
            raise HTTPException(status_code=400, detail="Invalid enhancement type. Use 'naturalness' or 'formality'")
        
        enhanced_result = {
            "success": True,
            "enhanced_text": result["text"],
            "enhancement_type": result["enhancement_type"],
            "changes": result.get("changes", [])
        }
        
        logger.info(f"Enhancement completed for {request.enhancement_type}")
        return enhanced_result
        
    except Exception as e:
        logger.error(f"Error enhancing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error enhancing text: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Grammar Fixer Pro API Server...")
    print("📋 Endpoints available:")
    print("   GET  /         - Health check")
    print("   POST /correct  - Correct text with suggestions")
    print("   POST /enhance  - Enhance text (naturalness/formality)")
    print("   GET  /health   - Detailed health status")
    print("   GET  /test     - Test endpoint info")
    print("")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("")
    print("💡 Users must provide their own Replicate API key in requests")
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        print("💡 Try: taskkill /F /IM python.exe")
        print("   Then run the server again")