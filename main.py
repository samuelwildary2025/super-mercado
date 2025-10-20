from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import order_routes
import os

app = FastAPI(title="Supermercado Queiroz - Painel de Pedidos")

# ✅ Middleware CORS (libera acesso do frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # você pode restringir depois
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Importa e registra as rotas do backend com prefixo /api
app.include_router(order_routes.router, prefix="/api")

# ✅ Caminho do frontend build
frontend_path = os.path.join(os.path.dirname(__file__), "frontend_build")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# ✅ Fallback — qualquer rota desconhecida vai pro index.html (React Router)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "Frontend não encontrado"}

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Backend rodando com sucesso"}
