import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# ----------------------------------------------------------------------
# Corrige a URL do banco automaticamente para usar o driver asyncpg
# ----------------------------------------------------------------------
raw_url = os.getenv("DATABASE_URL")

if not raw_url:
    raw_url = "postgresql+asyncpg://postgres:85885885@wildhub_postgres:5432/wildhub"

# se vier sem o driver correto, força a correção
if "asyncpg" not in raw_url:
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://")

DATABASE_URL = raw_url

# ----------------------------------------------------------------------
# Cria o engine e a sessão assíncrona
# ----------------------------------------------------------------------
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()

# ----------------------------------------------------------------------
# Inicializa as tabelas automaticamente
# ----------------------------------------------------------------------
async def init_models():
    async with engine.begin() as conn:
        from models.order_model import Order, OrderItem
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Banco conectado com sucesso usando asyncpg!")
