import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowDownLeft, ArrowUpRight, Search, Scissors, Package, X, Plus, Minus, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

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
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_URL}/cash/transactions`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sangria', description: reason, subtotal: 0, discount: 0, total: parseFloat(amount), payment_method_id: 1, payment_method_name: 'Dinheiro' })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())));

  if (loading) return <div className="loading">Carregando...</div>;

  if (!registerInfo?.register) {
    return (
      <div className="page" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h1 style={{fontSize: '48px', marginBottom: '20px'}}><ShoppingCart size={64} style={{margin: '0 auto', color: '#9ca3af'}} /></h1>
        <h2 style={{marginBottom: '10px', color: '#2c3e50'}}>Caixa Fechado</h2>
        <p style={{color: '#777', marginBottom: '30px'}}>Abra um caixa para iniciar as vendas.</p>
        <a href="/caixa" className="btn-primary" style={{padding: '15px 30px', fontSize: '16px', display: 'inline-block'}}>Abrir Caixa</a>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', height: 'calc(100vh - 60px)', background: '#f0f2f5'}}>
      {/* Left Side - Products/Services */}
      <div style={{flex: 1, padding: '20px', overflow: 'auto'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h1 style={{margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px'}}><ShoppingCart size={24} /> Ponto de Venda</h1>
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={handleSuprimento} className="btn-complete" style={{padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'}}><ArrowDownLeft size={14} /> Suprimento</button>
            <button onClick={handleSangria} className="btn-delete" style={{padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'}}><ArrowUpRight size={14} /> Sangria</button>
          </div>
        </div>

        {/* Register Status */}
        <div style={{background: '#e8f8f5', border: '1px solid #1abc9c', borderRadius: '8px', padding: '10px 15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '13px'}}>
          <span><strong>Caixa #{registerInfo.register.id}</strong> — Aberto em {registerInfo.register.opened_at}</span>
          <span>Previsto em caixa: <strong style={{color: '#2c3e50'}}>R$ {registerInfo.summary.expected.toFixed(2)}</strong></span>
        </div>

        {/* Search */}
        <div style={{position: 'relative', marginBottom: '15px'}}>
          <Search size={18} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af'}} />
          <input type="text" placeholder="Buscar serviço ou produto..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}} />
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
          <button onClick={() => setActiveTab('servicos')} style={{padding: '8px 20px', border: 'none', borderBottom: activeTab === 'servicos' ? '3px solid #3498db' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'servicos' ? 'bold' : 'normal', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'}}><Scissors size={16} /> Serviços</button>
          <button onClick={() => setActiveTab('produtos')} style={{padding: '8px 20px', border: 'none', borderBottom: activeTab === 'produtos' ? '3px solid #3498db' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'produtos' ? 'bold' : 'normal', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'}}><Package size={16} /> Produtos</button>
        </div>

        {/* Grid */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px'}}>
          {activeTab === 'servicos' ? filteredServices.map(s => (
            <div key={s.id} onClick={() => addToCart(s, 'servico')} style={{background: 'white', padding: '15px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', transition: 'transform 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{fontSize: '28px', marginBottom: '8px', color: '#6366f1'}}><Scissors size={28} /></div>
              <strong style={{fontSize: '13px', display: 'block', marginBottom: '4px'}}>{s.name}</strong>
              <div style={{color: '#27ae60', fontWeight: 'bold', fontSize: '16px'}}>R$ {s.price.toFixed(2)}</div>
              <div style={{color: '#999', fontSize: '11px'}}>{s.duration_minutes} min</div>
            </div>
          )) : filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p, 'produto')} style={{background: 'white', padding: '15px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee', transition: 'transform 0.2s', opacity: p.stock <= 0 ? 0.5 : 1}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{fontSize: '28px', marginBottom: '8px', color: p.stock > 0 ? '#3b82f6' : '#ef4444'}}>{p.stock > 0 ? <Package size={28} /> : <AlertCircle size={28} />}</div>
              <strong style={{fontSize: '13px', display: 'block', marginBottom: '4px'}}>{p.name}</strong>
              <div style={{color: '#27ae60', fontWeight: 'bold', fontSize: '16px'}}>R$ {p.sale_price.toFixed(2)}</div>
              <div style={{color: p.stock <= p.min_stock ? '#e74c3c' : '#999', fontSize: '11px'}}>Estoque: {p.stock} {p.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div style={{width: '380px', background: 'white', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '15px', borderBottom: '1px solid #eee'}}>
          <h2 style={{margin: '0 0 10px', fontSize: '18px', color: '#2c3e50'}}>Carrinho</h2>
          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px'}}>
            <option value="">Cliente (opcional)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Cart Items */}
        <div style={{flex: 1, overflow: 'auto', padding: '10px 15px'}}>
          {cart.length === 0 ? <p style={{color: '#999', textAlign: 'center', marginTop: '40px'}}>Carrinho vazio</p> :
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.type}-${idx}`} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee'}}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 'bold', fontSize: '13px'}}>{item.name}</div>
                  <div style={{fontSize: '12px', color: '#777'}}>R$ {item.price.toFixed(2)} × {item.qty}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <button onClick={() => updateQty(item.id, item.type, -1)} style={{width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Minus size={12} /></button>
                  <span style={{fontWeight: 'bold', minWidth: '20px', textAlign: 'center'}}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.type, 1)} style={{width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Plus size={12} /></button>
                  <button onClick={() => removeFromCart(item.id, item.type)} style={{marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '16px'}}><X size={16} /></button>
                </div>
                <div style={{fontWeight: 'bold', marginLeft: '10px', minWidth: '80px', textAlign: 'right'}}>R$ {(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
        </div>

        {/* Cart Summary */}
        <div style={{padding: '15px', borderTop: '1px solid #eee', background: '#f8f9fa'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px'}}>
            <span>Subtotal:</span><span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
            <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} min="0" step="0.01" placeholder="Desconto" style={{flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px'}} />
            <span style={{alignSelf: 'center', fontSize: '13px', color: '#777'}}>R$</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50'}}>
            <span>Total:</span><span>R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={openPayment} disabled={cart.length === 0} className="btn-primary" style={{width: '100%', padding: '15px', fontSize: '16px', background: cart.length === 0 ? '#bdc3c7' : '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><DollarSign size={20} /> Finalizar Venda</button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" style={{maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><DollarSign size={24} /> Pagamento</h2>
            <div style={{textAlign: 'center', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px'}}>
              <span style={{fontSize: '14px', color: '#777'}}>Total a Pagar</span>
              <p style={{fontSize: '32px', fontWeight: 'bold', color: '#2c3e50', margin: '5px 0'}}>R$ {total.toFixed(2)}</p>
            </div>

            <div className="form-group"><label>Forma de Pagamento *</label><select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}><option value="">Selecione</option>{paymentMethods.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}</select></div>

            {(parseInt(paymentForm.method) === 1 || parseInt(paymentForm.method) === 2) && (
              <div className="form-group">
                <label>Valor Recebido</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value, change: Math.max(0, parseFloat(e.target.value) - total)})} min={total} step="0.01" placeholder="0.00" style={{fontSize: '18px', padding: '10px', fontWeight: 'bold'}} />
                {paymentForm.change > 0 && <div style={{textAlign: 'center', marginTop: '10px', fontSize: '18px', color: '#27ae60', fontWeight: 'bold'}}>Troco: R$ {paymentForm.change.toFixed(2)}</div>}
              </div>
            )}

            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => setShowPayment(false)} className="btn-secondary" style={{flex: 1}}>Cancelar</button>
              <button onClick={handlePayment} className="btn-complete" style={{flex: 1, padding: '12px', fontSize: '16px'}}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {lastSale && (
        <div className="modal-overlay" onClick={() => setLastSale(null)}>
          <div className="modal" style={{maxWidth: '400px', textAlign: 'center'}} onClick={(e) => e.stopPropagation()}>
            <div style={{fontSize: '60px', marginBottom: '15px', color: '#27ae60'}}><CheckCircle size={60} /></div>
            <h2 style={{color: '#27ae60', marginBottom: '10px'}}>Venda Finalizada!</h2>
            <p style={{color: '#777', marginBottom: '5px'}}>Código: <strong>{lastSale.code}</strong></p>
            <p style={{fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px'}}>R$ {lastSale.total.toFixed(2)}</p>
            <button onClick={() => setLastSale(null)} className="btn-primary" style={{width: '100%'}}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
