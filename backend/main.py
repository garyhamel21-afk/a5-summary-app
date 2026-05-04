from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import generate

app = FastAPI(title="Infographic Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 Vercel 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api", tags=["generate"])


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
