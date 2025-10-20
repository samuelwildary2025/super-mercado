# =============================
# Etapa 1: Build do FRONTEND
# =============================
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copia apenas os arquivos necessários primeiro
COPY frontend/package*.json ./
RUN npm install

# Copia o restante do frontend e gera o build
COPY frontend ./
RUN npm run build

# =============================
# Etapa 2: Build do BACKEND
# =============================
FROM python:3.11-slim AS backend

WORKDIR /app

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=postgresql+asyncpg://postgres:85885885@wildhub_postgres:5432/wildhub?sslmode=disable

# Instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o backend inteiro (está na raiz)
COPY . .

# Copia o build do frontend para a pasta esperada
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Porta exposta
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
