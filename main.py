from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from routes.order_routes import router as order_router
import os

app = FastAPI(title="Sistema Queiroz API")

# CORS liberado para o frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas da API (prefixo /api)
app.include_router(order_router, prefix="/api")

# Caminho do build do frontend (React)
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")

# Servir o index.html do React
@app.get("/")
def serve_root():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "Frontend não encontrado"}

# Servir arquivos estáticos (JS, CSS, etc.)
from fastapi.staticfiles import StaticFiles
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.get("/health")
def health_check():
    return {"status": "ok"}
