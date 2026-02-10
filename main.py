
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI(title="CodeRefine AI Engine")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    provider: str = "gemini"
    mode: str = "strict"

@app.get("/")
async def root():
    return {
        "status": "online",
        "engine": "CodeRefine FastAPI",
        "version": "1.0.7",
        "capabilities": ["static-analysis", "security-audit", "performance-profiler", "deep-debugger"]
    }

@app.post("/analyze")
async def analyze_code(request: CodeAnalysisRequest):
    """
    Analyzes code using the selected provider.
    This simulates the specialized logic for Groq or Hugging Face.
    """
    # Fix: Use non-blocking sleep in async endpoint
    await asyncio.sleep(1.2)
    
    if not request.code:
        raise HTTPException(status_code=400, detail="No code provided")

    # Dynamic summary based on mode
    summary_header = f"🔍 Code Summary:\nAnalyzed via FastAPI using {request.mode} mode."
    
    if request.mode == "performance":
        perf_content = "⚡ Performance Improvements:\n- Original Complexity: O(n²) time due to nested loops.\n- Optimized Complexity: O(n) time using a Set for lookup.\n- Space Complexity: O(n) for the frequency map."
        summary_content = f"🐞 Bugs & Logical Issues:\nNo critical bugs found.\n\n{perf_content}"
    elif request.mode == "debugger":
        summary_content = "🐞 Bugs & Logical Issues:\nVerified edge case handling for empty arrays."
    else:
        summary_content = "🐞 Bugs & Logical Issues:\n- Found potential memory leak in recursion."

    # Returning a structured mock that matches the CodeReviewResult interface.
    return {
        "summary": f"{summary_header}\n\n{summary_content}\n\n🔐 Security Concerns:\nNo major threats detected.\n\n✨ Best Practices & Clean Code:\nUse more descriptive variable names.\n\n📚 Learning Tips:\nLook into Map/Set data structures for faster lookups.",
        "languageDetected": request.language if request.language != "Auto-detect" else "Python",
        "metrics": {
            "securityScore": 95,
            "performanceScore": 85 if request.mode == "performance" else 75,
            "maintainabilityScore": 90,
            "overallHealth": 88
        },
        "issues": [
            {
                "line": 4,
                "category": "Performance",
                "severity": "High",
                "description": "Detected nested loops leading to quadratic time complexity.",
                "suggestion": "Replace nested loop with a hash map to achieve linear time complexity."
            }
        ] if request.mode == "performance" else [],
        "optimizedCode": f"// Performance Optimized by CodeRefine ({request.mode.upper()})\n" + request.code
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
