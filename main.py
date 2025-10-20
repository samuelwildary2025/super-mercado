from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import order_routes
import os

# =====================================
# 🚀 Configuração principal do FastAPI
# =====================================

app = FastAPI(title="Supermercado Queiroz - Painel de Pedidos")

# =====================================
# 🌐 Middleware CORS
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # você pode restringir depois se quiser
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================
# 📦 Rotas da API
# =====================================
# Todas as rotas do backend vão começar com /api
app.include_router(order_routes.router, prefix="/api")

# =====================================
# 🧱 Caminho do build do frontend
# =====================================

# O build do React é gerado em /app/frontend/dist dentro do container
frontend_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"⚠️ Pasta do frontend não encontrada: {frontend_path}")

# =====================================
# 🧭 Rota fallback — React Router
# =====================================

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Serve o index.html para qualquer rota desconhecida
    (necessário para o React Router funcionar em rotas internas).
    """
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "Frontend não encontrado"}

# =====================================
# ❤️ Health Check (teste rápido)
# =====================================

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Backend rodando com sucesso"}
