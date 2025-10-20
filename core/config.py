import os

# DATABASE_URL deve ser no formato async do SQLAlchemy 2.x:
# postgresql+asyncpg://usuario:senha@host:5432/nome_db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/queiroz"
)

# ORIGENS CORS (se precisar restringir)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
