from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from services.verification import run_4_rule_verification, run_renovated_building_verification

app = FastAPI(
    title="QuakeGuard AI - Repaired Building Verification Backend",
    description="Python Computer Vision AI service for 4-rule repaired building verification using PyTorch and OpenCV.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "QuakeGuard AI Repaired Building Verification Service",
        "status": "ONLINE",
        "framework": "FastAPI + PyTorch + torchvision + OpenCV",
        "endpoints": ["POST /verify-restoration", "POST /verify-renovated"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/verify-restoration")
async def verify_restoration(
    original_image: UploadFile = File(...),
    repaired_image: UploadFile = File(...)
):
    try:
        orig_bytes = await original_image.read()
        rep_bytes = await repaired_image.read()

        if not orig_bytes or len(orig_bytes) == 0:
            raise HTTPException(status_code=400, detail="Original image file is empty.")
        if not rep_bytes or len(rep_bytes) == 0:
            raise HTTPException(status_code=400, detail="Repaired image file is empty.")
        result = run_4_rule_verification(orig_bytes, rep_bytes)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"AI Verification Error: {str(e)}")

@app.post("/verify-renovated")
async def verify_renovated(
    renovated_image: UploadFile = File(...)
):
    try:
        ren_bytes = await renovated_image.read()
        if not ren_bytes or len(ren_bytes) == 0:
            raise HTTPException(status_code=400, detail="Renovated building image file is empty.")
        result = run_renovated_building_verification(ren_bytes, filename=renovated_image.filename or "")
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"AI Verification Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
