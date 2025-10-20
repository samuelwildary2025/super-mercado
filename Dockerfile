# ============================
# 🧩 Build e Deploy Unificado (FastAPI + React)
# ============================
FROM node:18 AS build
WORKDIR /app

# Copiar tudo (front + back juntos)
COPY . .

# Instalar dependências e buildar o frontend (Vite)
RUN npm install && npm run build || true

# ============================
# ⚙️ Backend (FastAPI)
# ============================
FROM python:3.11-slim
WORKDIR /app

# Instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo o código (inclui build do frontend gerado em /app/dist)
COPY . .

# Variáveis de ambiente fixas para o EasyPanel (AZPanel)
ENV FRONTEND_PATH=/app/dist
ENV DATABASE_URL=postgres://postgres:85885885@wildhub_postgres:5432/wildhub?sslmode=disable
ENV TZ=America/Fortaleza

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
