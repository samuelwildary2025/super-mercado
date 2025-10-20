from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from uuid import UUID
from typing import List
from core.database import AsyncSessionLocal
from models.order_model import Order, OrderItem
from schemas.order_schema import PedidoIn, PedidoOut, Cliente, Item
from datetime import datetime
from pydantic import BaseModel, Field
router = APIRouter(tags=["Pedidos"])



class Cliente(BaseModel):
    nome: str
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    pagamento: Optional[str] = None

class Item(BaseModel):
    nome: str
    quantidade: int = Field(ge=0, default=0)
    preco: float = Field(ge=0, default=0.0)

class PedidoIn(BaseModel):
    cliente: Cliente
    itens: List[Item] = []
    forma: Optional[str] = None
    endereco: Optional[str] = None
    total: Optional[float] = None
    observacao: Optional[str] = None
    created_at: Optional[datetime] = None

class PedidoOut(BaseModel):
    id: UUID
    cliente: Cliente
    itens: List[Item]
    forma: Optional[str] = None
    endereco: Optional[str] = None
    total: float
    observacao: Optional[str] = None
    status: str
    created_at: datetime
