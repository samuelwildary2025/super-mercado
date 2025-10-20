import { useEffect, useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './index.css'

const formatCurrency = (v) => {
  const n = Number.isFinite(v) ? v : Number(v ?? 0);
  return n.toFixed(2);
};

const formatDateTime = (iso) => {
  try {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  } catch {
    return String(iso ?? '-');
  }
};

export default function PainelPedidos() {
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [concluidos, setConcluidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [novoPedido, setNovoPedido] = useState(false);
  const audioRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const normalizeOrder = (p) => ({
    id: p?.id ?? Math.random().toString(36).slice(2),
    cliente: {
      nome: p?.cliente?.nome ?? 'Cliente',
      telefone: p?.cliente?.telefone ?? '-',
      endereco: p?.cliente?.endereco ?? '-',
      pagamento: p?.cliente?.pagamento ?? '-',
    },
    itens: Array.isArray(p?.itens) ? p.itens.map((i) => ({
      nome: i?.nome ?? 'Item',
      quantidade: Number(i?.quantidade ?? 0),
      preco: Number(i?.preco ?? 0),
    })) : [],
    forma: p?.forma ?? p?.formaEntrega ?? undefined,
    endereco: p?.endereco ?? p?.cliente?.endereco ?? undefined,
    total: Number(p?.total ?? (Array.isArray(p?.itens) ? p.itens.reduce((acc, i) => acc + Number(i?.preco ?? 0) * Number(i?.quantidade ?? 0), 0) : 0)),
    status: p?.status ?? 'Em Separação',
    observacao: p?.observacao ?? p?.obs ?? '',
    created_at: p?.created_at ?? p?.criadoEm ?? new Date().toISOString(),
  });

  const fetchPedidos = async () => {
    try {
      const resAndamento = await fetch(`${API_URL}/orders`);
      if (!resAndamento.ok) throw new Error(`GET /orders -> ${resAndamento.status}`);
      const andamento = await resAndamento.json();

      const resConcluidos = await fetch(`${API_URL}/orders/concluded`);
      if (!resConcluidos.ok) throw new Error(`GET /orders/concluded -> ${resConcluidos.status}`);
      const concluidosData = await resConcluidos.json();

      const novaLista = Array.isArray(andamento?.orders) ? andamento.orders.map(normalizeOrder) : [];
      const listaConcluidos = Array.isArray(concluidosData?.orders) ? concluidosData.orders.map(normalizeOrder) : [];

      if (pedidos.length && novaLista.length > pedidos.length) {
        setNovoPedido(true);
        try { await audioRef.current?.play(); } catch {}
        setTimeout(() => setNovoPedido(false), 5000);
      }

      setPedidos(novaLista);
      setConcluidos(listaConcluidos);
      setCarregando(false);
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e?.message ?? e);
      setCarregando(false);
      setMensagem('⚠️ Não foi possível carregar os pedidos. Verifique o backend.');
      setTimeout(() => setMensagem(''), 5000);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const intervalo = setInterval(fetchPedidos, 8000);
    return () => clearInterval(intervalo);
  }, []);

  const handleFaturar = async (pedido) => {
    if (!pedido?.id) return;
    try {
      const response = await fetch(`${API_URL}/orders/${pedido.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setMensagem(`✅ Pedido de ${pedido?.cliente?.nome ?? 'Cliente'} enviado para faturamento!`);
        await fetchPedidos();
        setPedidoSelecionado(null);
        setTimeout(() => setMensagem(''), 3000);
      } else {
        throw new Error('Falha ao enviar para faturamento');
      }
    } catch (error) {
      console.error(error);
      setMensagem('❌ Erro ao enviar para faturamento');
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">🛒</div>
        </div>
        <p className="mt-4 text-gray-400">Carregando painel de pedidos...</p>
      </div>
    );
  }

  const totalPedidosDia = (pedidos?.length ?? 0) + (concluidos?.length ?? 0);
  const vendasHoje = (concluidos ?? []).reduce((acc, p) => acc + Number(p?.total ?? 0), 0);
  const chartDataSemanal = [
    { name: 'Seg', vendas: 230 },
    { name: 'Ter', vendas: 180 },
    { name: 'Qua', vendas: 320 },
    { name: 'Qui', vendas: 270 },
    { name: 'Sex', vendas: 400 },
    { name: 'Sáb', vendas: 250 },
    { name: 'Dom', vendas: 380 },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen flex relative">
      <audio ref={audioRef} src="/notificacao.mp3" preload="auto" />
      {novoPedido && (
        <div className="absolute top-4 right-6 bg-yellow-500 text-black px-4 py-2 rounded-xl font-semibold shadow-lg animate-pulse">
          🔔 Novo pedido recebido!
        </div>
      )}

      <aside className="w-64 bg-gray-800 p-6 border-r border-gray-700 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">🛒</div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Supermercado Queiroz</h2>
              <p className="text-xs text-gray-400 -mt-1">Gestão de Pedidos</p>
            </div>
          </div>
          <button onClick={() => setAbaAtiva('pedidos')} className={`w-full text-left px-4 py-2 rounded-lg ${abaAtiva === 'pedidos' ? 'bg-emerald-600' : 'hover:bg-gray-700'}`}>🧾 Painel de Pedidos</button>
          <button onClick={() => setAbaAtiva('analytics')} className={`w-full text-left px-4 py-2 rounded-lg mt-3 ${abaAtiva === 'analytics' ? 'bg-emerald-600' : 'hover:bg-gray-700'}`}>📈 Analytics</button>
        </div>
        <div className="border-t border-gray-700 pt-4 text-sm text-gray-400">👤 Atendente Online</div>
      </aside>

      <main className="flex-1 p-8">
        {mensagem && (
          <div className="mb-4 p-3 bg-emerald-600/90 text-center rounded-xl shadow">{mensagem}</div>
        )}

        {abaAtiva === 'pedidos' && (
          <>
            <h1 className="text-3xl font-bold mb-6">📦 Painel de Pedidos</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">📦 Pedidos em Andamento</h2>
                <div className="space-y-3">
                  {(pedidos ?? []).map((p, i) => (
                    <div
                      key={p?.id ?? i}
                      onClick={() => setPedidoSelecionado(p)}
                      className={`border rounded-xl p-4 flex justify-between items-center cursor-pointer transition ${i === 0 ? 'bg-yellow-500/30 border-yellow-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700/80'}`}
                    >
                      <div>
                        <div className="font-semibold">{p?.cliente?.nome ?? 'Cliente'}</div>
                        <div className="text-sm text-gray-400">{formatDateTime(p?.created_at)}</div>
                      </div>
                      <div className="text-emerald-400 font-bold">R$ {formatCurrency(p?.total)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">✅ Pedidos Concluídos</h2>
                <div className="space-y-3">
                  {(concluidos ?? []).length ? (
                    concluidos.map((p, i) => (
                      <div key={p?.id ?? i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-indigo-300">{p?.cliente?.nome ?? 'Cliente'}</div>
                          <div className="text-sm text-gray-400">Status: {p?.status ?? 'Faturado'}</div>
                        </div>
                        <div className="text-indigo-400 font-bold">R$ {formatCurrency(p?.total)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">Nenhum pedido concluído</p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {abaAtiva === 'analytics' && (
          <>
            <h1 className="text-3xl font-extrabold mb-6">📊 Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-2xl p-6 shadow bg-gradient-to-br from-emerald-600 to-teal-700">
                <div className="text-3xl font-bold">{totalPedidosDia}</div>
                <div className="opacity-90">Total de Pedidos (dia)</div>
              </div>
              <div className="rounded-2xl p-6 shadow bg-gradient-to-br from-indigo-600 to-blue-700">
                <div className="text-3xl font-bold">R$ {formatCurrency(vendasHoje)}</div>
                <div className="opacity-90">Vendas Concluídas Hoje</div>
              </div>
              <div className="rounded-2xl p-6 shadow bg-gradient-to-br from-fuchsia-600 to-pink-700">
                <div className="text-3xl font-bold">{pedidos?.length ?? 0}</div>
                <div className="opacity-90">Pedidos em Andamento</div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl shadow border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">📈 Vendas Semanais</h3>
                <select className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-1">
                  <option>Semanal</option>
                  <option>Mensal</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartDataSemanal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {pedidoSelecionado ? (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl w-[900px] max-w-[95vw] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
                <h2 className="text-2xl font-extrabold text-emerald-400">
                  Pedido de {pedidoSelecionado?.cliente?.nome ?? 'Cliente'}
                </h2>
                <button onClick={() => setPedidoSelecionado(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-2xl">
                    <h3 className="font-semibold mb-2">📇 Informações do Cliente</h3>
                    <p>📞 {pedidoSelecionado?.cliente?.telefone ?? '-'}</p>
                    <p>📍 {pedidoSelecionado?.cliente?.endereco ?? '-'}</p>
                    <p>💳 {pedidoSelecionado?.cliente?.pagamento ?? '-'}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-2xl">
                    <h3 className="font-semibold mb-2">📦 Itens do Pedido</h3>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {(pedidoSelecionado?.itens ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item?.nome ?? 'Item'} ({Number(item?.quantidade ?? 0)}x R$ {formatCurrency(item?.preco)})</span>
                          <span>R$ {formatCurrency(Number(item?.quantidade ?? 0) * Number(item?.preco ?? 0))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-emerald-400 font-extrabold text-xl mt-3">R$ {formatCurrency(pedidoSelecionado?.total)}</div>
                  </div>
                  {pedidoSelecionado?.observacao ? (
                    <div className="bg-yellow-800/90 p-4 rounded-2xl border border-yellow-600">
                      <h3 className="font-semibold mb-1">📝 Observações</h3>
                      <p>{pedidoSelecionado?.observacao}</p>
                    </div>
                  ) : null}
                  <button onClick={() => handleFaturar(pedidoSelecionado)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl mt-1">
                    💸 Enviar para Faturamento
                  </button>
                </div>

                <div className="bg-gray-700 p-4 rounded-2xl flex flex-col">
                  <h3 className="font-semibold mb-2">💬 Chat com Cliente</h3>
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <span>✅ Nenhuma mensagem ainda</span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input className="flex-1 border border-gray-600 bg-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-500" placeholder="Digite sua mensagem..." />
                    <button className="bg-emerald-600 px-4 py-2 rounded-xl text-white">➤</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
