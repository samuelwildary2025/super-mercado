from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from sqlalchemy.orm import selectinload
from uuid import UUID
from core.database import AsyncSessionLocal
from models.order_model import Order, OrderItem
from schemas.order_schema import PedidoIn, PedidoOut, Cliente, Item
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Pedidos"])

async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

def _to_schema(order: Order) -> PedidoOut:
    return PedidoOut(
        id=order.id,
        cliente=Cliente(
            nome=order.cliente_nome,
            telefone=order.cliente_telefone,
            endereco=order.cliente_endereco,
            pagamento=order.cliente_pagamento,
        ),
        itens=[
            Item(nome=i.nome, quantidade=i.quantidade, preco=i.preco)
            for i in getattr(order, "itens", [])
        ],
        forma=order.forma,
        endereco=order.endereco,
        total=float(order.total or 0),
        observacao=order.observacao,
        status=order.status,
        created_at=order.created_at,
    )

@router.get("/orders")
async def get_orders(session: AsyncSession = Depends(get_session)):
    stmt = (
        select(Order)
        .options(selectinload(Order.itens))
        .where(Order.status != "Faturado")
        .order_by(asc(Order.created_at))
    )
    result = await session.execute(stmt)
    orders = result.scalars().unique().all()
    return {"orders": [_to_schema(o) for o in orders]}

@router.get("/orders/concluded")
async def get_concluded(session: AsyncSession = Depends(get_session)):
    stmt = (
        select(Order)
        .options(selectinload(Order.itens))
        .where(Order.status == "Faturado")
        .order_by(asc(Order.created_at))
    )
    result = await session.execute(stmt)
    orders = result.scalars().unique().all()
    return {"orders": [_to_schema(o) for o in orders]}

@router.get("/orders/{order_id}")
async def get_order(order_id: UUID, session: AsyncSession = Depends(get_session)):
    stmt = select(Order).options(selectinload(Order.itens)).where(Order.id == order_id)
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return _to_schema(order)

@router.post("/orders", status_code=201)
async def create_order(pedido: PedidoIn, session: AsyncSession = Depends(get_session)):
    total = pedido.total if pedido.total is not None else sum(
        (i.preco or 0) * (i.quantidade or 0) for i in pedido.itens
    )
    created_at = pedido.created_at or datetime.utcnow()

    order = Order(
        cliente_nome=pedido.cliente.nome,
        cliente_telefone=pedido.cliente.telefone,
        cliente_endereco=pedido.cliente.endereco or pedido.endereco,
        cliente_pagamento=pedido.cliente.pagamento,
        forma=pedido.forma,
        endereco=pedido.endereco or pedido.cliente.endereco,
        total=float(total or 0),
        status="Em Separação",
        observacao=pedido.observacao,
        created_at=created_at,
    )
    session.add(order)
    await session.flush()

    for it in pedido.itens:
        session.add(OrderItem(order_id=order.id, nome=it.nome, quantidade=it.quantidade, preco=it.preco))

    await session.commit()
    await session.refresh(order)
    return {"ok": True, "order": _to_schema(order)}

@router.post("/orders/{order_id}/invoice")
async def invoice(order_id: UUID, session: AsyncSession = Depends(get_session)):
    stmt = select(Order).options(selectinload(Order.itens)).where(Order.id == order_id)
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    order.status = "Faturado"
    await session.commit()
    return {"message": "Pedido enviado para faturamento", "order": _to_schema(order)}
