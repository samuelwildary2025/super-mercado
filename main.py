from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Sistema Queiroz")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenta carregar rotas de API se existirem (mantém compatibilidade com seu código)
try:
    from routes.order_routes import router as order_router  # type: ignore
    app.include_router(order_router, prefix="/api/orders")
except Exception:
    pass

# Healthcheck simples
@app.get("/api/health")
def health():
    return {"status": "ok"}

# Servir o frontend (Vite build em /app/dist)
FRONTEND_PATH = os.getenv("FRONTEND_PATH", "dist")
if os.path.isdir(FRONTEND_PATH):
    assets_dir = os.path.join(FRONTEND_PATH, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index_root():
        return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_index(full_path: str):
        index_file = os.path.join(FRONTEND_PATH, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend não encontrado"}
