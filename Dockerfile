# =============================
# Etapa 1: Build do FRONTEND
# =============================
FROM node:20-alpine AS frontend

WORKDIR /app

# Copia apenas os arquivos de dependência do frontend
COPY package*.json ./
RUN npm install

# Copia o restante e faz o build
COPY . .
RUN npm run build

# =============================
# Etapa 2: BACKEND com FastAPI
# =============================
FROM python:3.11-slim AS backend

WORKDIR /app

# Evita cache e buffers
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define a URL do banco
ENV DATABASE_URL=postgresql+asyncpg://postgres:85885885@wildhub_postgres:5432/wildhub?sslmode=disable

# Copia dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o backend (raiz)
COPY . .

# Copia o build do React (feito na etapa anterior)
COPY --from=frontend /app/dist ./frontend/dist

# Expõe a porta do FastAPI
EXPOSE 8000

# Inicializa o servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
