import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowDownLeft, ArrowUpRight, Search, Scissors, Package, X, Plus, Minus, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function POS() {
  const [registerInfo, setRegisterInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('servicos');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: '', amount: '', change: 0 });
  const [discount, setDiscount] = useState(0);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [regRes, svcRes, prodRes, clRes, pmRes] = await Promise.all([
        fetch(`${API_URL}/cash/current`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/services?active=1`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/products?active=1`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/clients`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/financial/payment-methods`, { headers: getAuthHeader() })
      ]);
      if (regRes.ok) setRegisterInfo(await regRes.json());
      if (svcRes.ok) setServices(await svcRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (clRes.ok) setClients(await clRes.json());
      if (pmRes.ok) setPaymentMethods(await pmRes.json());
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const addToCart = (item, type) => {
    const existing = cart.find(c => c.id === item.id && c.type === type);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.type === type ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        id: item.id,
        type,
        name: type === 'servico' ? item.name : `${item.name} (${item.code})`,
        price: type === 'servico' ? item.price : item.sale_price,
        qty: 1,
        product_id: type === 'produto' ? item.id : null
      }]);
    }
  };

  const updateQty = (id, type, delta) => {
    setCart(cart.map(c => {
      if (c.id === id && c.type === type) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }
      return c;
    }).filter(c => c.qty > 0));
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(c => !(c.id === id && c.type === type)));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const openPayment = () => {
    if (cart.length === 0) return;
    setPaymentForm({ method: '', amount: '', change: 0 });
    setShowPayment(true);
  };

  const handlePayment = async () => {
    if (!paymentForm.method) { alert('Selecione a forma de pagamento'); return; }
    const pm = paymentMethods.find(p => p.id === parseInt(paymentForm.method));
    const transaction = {
      type: 'venda',
      description: `Venda PDV${selectedClient ? ' - ' + clients.find(c => c.id === parseInt(selectedClient))?.name : ''}`,
      client_id: selectedClient ? parseInt(selectedClient) : null,
      items: cart.map(c => ({ type: c.type, name: c.name, price: c.price, qty: c.qty, product_id: c.product_id })),
      subtotal,
      discount,
      total,
      payment_method_id: parseInt(paymentForm.method),
      payment_method_name: pm?.name || '',
      installments: pm?.max_installments ? 1 : 1
    };

    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transaction)
      });
      if (res.ok) {
        const result = await res.json();
        setLastSale(result);
        setCart([]);
        setDiscount(0);
        setSelectedClient('');
        setShowPayment(false);
        fetchData();
      }
    } catch (error) { console.error('Error:', error); }
  };

  const handleSuprimento = async () => {
    const amount = prompt('Valor do suprimento (R$):');
    if (!amount || isNaN(amount)) return;
    const reason = prompt('Motivo:') || 'Reforço de caixa';
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'suprimento', description: reason, subtotal: 0, discount: 0, total: parseFloat(amount), payment_method_id: 1, payment_method_name: 'Dinheiro' })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleSangria = async () => {
    const amount = prompt('Valor da sangria (R$):');
    if (!amount || isNaN(amount)) return;
    const reason = prompt('Motivo:') || 'Retirada de caixa';
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'sangria', description: reason, subtotal: 0, discount: 0, total: parseFloat(amount), payment_method_id: 1, payment_method_name: 'Dinheiro' })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())));

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;

  if (!registerInfo?.register) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ marginBottom: '20px' }}><ShoppingCart size={64} color="#9e9e9e" /></div>
        <h2 style={{ marginBottom: '10px', color: '#000', fontWeight: 300, fontSize: '32px' }}>Caixa Fechado</h2>
        <p style={{ color: '#606060', marginBottom: '30px' }}>Abra um caixa para iniciar as vendas.</p>
        <a href="/caixa" style={{
          display: 'inline-block', padding: '12px 24px', backgroundColor: '#002cd6', color: '#fff',
          border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, textDecoration: 'none'
        }}>Abrir Caixa</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#f5f5f5' }}>
      {/* Left Side - Products/Services */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 300, color: '#000', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={24} /> Ponto de Venda
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSuprimento} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f5f5f5',
              border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', color: '#606060'
            }}><ArrowDownLeft size={14} /> Suprimento</button>
            <button onClick={handleSangria} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#f5f5f5',
              border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', color: '#606060'
            }}><ArrowUpRight size={14} /> Sangria</button>
          </div>
        </div>

        {/* Register Status */}
        <div style={{ background: '#e3f2fd', border: '1px solid #002cd6', borderRadius: '4px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span><strong>Caixa #{registerInfo.register.id}</strong> — Aberto em {registerInfo.register.opened_at}</span>
          <span>Previsto em caixa: <strong style={{ color: '#002cd6' }}>R$ {registerInfo.summary.expected.toFixed(2)}</strong></span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e' }} />
          <input type="text" placeholder="Buscar serviço ou produto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #ddd', marginBottom: '16px' }}>
          {[
            { key: 'servicos', label: 'Serviços', icon: Scissors },
            { key: 'produtos', label: 'Produtos', icon: Package }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '12px 24px', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #002cd6' : '2px solid transparent',
                background: 'none', cursor: 'pointer', fontWeight: activeTab === tab.key ? 500 : 400,
                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: activeTab === tab.key ? '#002cd6' : '#606060'
              }}><Icon size={16} /> {tab.label}</button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {activeTab === 'servicos' ? filteredServices.map(s => (
            <div key={s.id} onClick={() => addToCart(s, 'servico')} style={{
              backgroundColor: '#fff', padding: '16px', borderRadius: '4px', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee', transition: 'box-shadow 0.2s'
            }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
              <div style={{ marginBottom: '8px', color: '#002cd6' }}><Scissors size={28} /></div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#000' }}>{s.name}</div>
              <div style={{ color: '#4caf50', fontWeight: 500, fontSize: '16px' }}>R$ {s.price.toFixed(2)}</div>
              <div style={{ color: '#606060', fontSize: '11px', marginTop: '4px' }}>{s.duration_minutes} min</div>
            </div>
          )) : filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p, 'produto')} style={{
              backgroundColor: '#fff', padding: '16px', borderRadius: '4px', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee', transition: 'box-shadow 0.2s',
              opacity: p.stock <= 0 ? 0.5 : 1
            }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
              <div style={{ marginBottom: '8px', color: p.stock > 0 ? '#002cd6' : '#f44336' }}>
                {p.stock > 0 ? <Package size={28} /> : <AlertCircle size={28} />}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#000' }}>{p.name}</div>
              <div style={{ color: '#4caf50', fontWeight: 500, fontSize: '16px' }}>R$ {p.sale_price.toFixed(2)}</div>
              <div style={{ color: p.stock <= p.min_stock ? '#f44336' : '#606060', fontSize: '11px', marginTop: '4px' }}>
                Estoque: {p.stock} {p.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div style={{ width: '380px', backgroundColor: '#fff', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 500, color: '#000' }}>Carrinho</h2>
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', background: '#fff' }}>
            <option value="">Cliente (opcional)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#606060', textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>Carrinho vazio</p>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.type}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '13px', color: '#000' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>R$ {item.price.toFixed(2)} × {item.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQty(item.id, item.type, -1)} style={{
                    width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}><Minus size={12} /></button>
                  <span style={{ fontWeight: 500, minWidth: '20px', textAlign: 'center', fontSize: '13px' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.type, 1)} style={{
                    width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', background: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}><Plus size={12} /></button>
                  <button onClick={() => removeFromCart(item.id, item.type)} style={{
                    marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#f44336'
                  }}><X size={16} /></button>
                </div>
                <div style={{ fontWeight: 500, marginLeft: '12px', minWidth: '80px', textAlign: 'right', fontSize: '13px' }}>
                  R$ {(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        <div style={{ padding: '16px', borderTop: '1px solid #eee', background: '#f5f5f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#606060' }}>
            <span>Subtotal:</span><span style={{ fontWeight: 500, color: '#000' }}>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              min="0" step="0.01" placeholder="Desconto" style={{
                flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', background: '#fff'
              }} />
            <span style={{ alignSelf: 'center', fontSize: '13px', color: '#606060' }}>R$</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '20px', fontWeight: 500, color: '#000' }}>
            <span>Total:</span><span>R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={openPayment} disabled={cart.length === 0} style={{
            width: '100%', padding: '12px', fontSize: '14px', fontWeight: 500, color: '#fff',
            background: cart.length === 0 ? '#bdbdbd' : '#4caf50', border: 'none', borderRadius: '4px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}><DollarSign size={20} /> Finalizar Venda</button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowPayment(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <DollarSign size={24} /> Pagamento
            </h2>
            <div style={{ textAlign: 'center', marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontSize: '13px', color: '#606060', marginBottom: '4px' }}>Total a Pagar</div>
              <div style={{ fontSize: '32px', fontWeight: 500, color: '#000', margin: '4px 0' }}>R$ {total.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Forma de Pagamento *</label>
              <select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: '#fff' }}>
                <option value="">Selecione</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>
            </div>

            {(parseInt(paymentForm.method) === 1 || parseInt(paymentForm.method) === 2) && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Valor Recebido</label>
                <input type="number" value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value, change: Math.max(0, parseFloat(e.target.value) - total)})}
                  min={total} step="0.01" placeholder="0.00"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', fontWeight: 500, background: '#fff' }} />
                {paymentForm.change > 0 && (
                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '16px', color: '#4caf50', fontWeight: 500 }}>
                    Troco: R$ {paymentForm.change.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowPayment(false)} style={{
                flex: 1, padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={handlePayment} style={{
                flex: 1, padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {lastSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setLastSale(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '400px', width: '90%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '16px', color: '#4caf50' }}><CheckCircle size={60} /></div>
            <h2 style={{ color: '#4caf50', marginBottom: '12px', fontSize: '20px', fontWeight: 500 }}>Venda Finalizada!</h2>
            <p style={{ color: '#606060', marginBottom: '4px', fontSize: '14px' }}>Código: <strong style={{ color: '#000' }}>{lastSale.code}</strong></p>
            <p style={{ fontSize: '24px', fontWeight: 500, color: '#000', marginBottom: '24px' }}>R$ {lastSale.total.toFixed(2)}</p>
            <button onClick={() => setLastSale(null)} style={{
              width: '100%', padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
            }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
