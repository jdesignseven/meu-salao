import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Package, ArrowUpDown } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const productTypes = [
  { key: 'pote', label: 'Pote', icon: '🫙' },
  { key: 'bisnaga', label: 'Bisnaga', icon: '🧴' },
  { key: 'tubo', label: 'Tubo', icon: '🪄' },
  { key: 'caixa', label: 'Caixa', icon: '📦' },
  { key: 'garrafa', label: 'Garrafa', icon: '🍾' },
  { key: 'outro', label: 'Outro', icon: '📋' }
];

const unitOptions = ['un', 'ml', 'g', 'kg', 'L', 'cm', 'm', 'par'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockMovements, setStockMovements] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', product_group: '', type: 'outro', cost: '', sale_price: '',
    unit: 'un', stock: '', min_stock: '', photo: '', active: 1
  });
  const [stockForm, setStockForm] = useState({ type: 'entrada', quantity: '', reason: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => { fetchData(); }, [search, filterGroup, filterLowStock]);

  const fetchData = async () => {
    try {
      let url = `${API_URL}/products?active=1`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterGroup) url += `&group=${filterGroup}`;
      if (filterLowStock) url += `&low_stock=1`;
      const [prodRes, groupRes] = await Promise.all([
        fetch(url, { headers: getAuthHeader() }),
        fetch(`${API_URL}/products/groups`, { headers: getAuthHeader() })
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (groupRes.ok) setGroups(await groupRes.json());
    } catch (error) { console.error('Error fetching data:', error); }
    finally { setLoading(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setCropImage(reader.result); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = () => {
    if (!imgRef.current || !completedCrop) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height);
    const croppedDataUrl = canvas.toDataURL('image/jpeg');
    setFormData({ ...formData, photo: croppedDataUrl });
    setPhotoPreview(croppedDataUrl);
    setShowCropper(false);
    setCropImage(null);
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, description: product.description || '', product_group: product.product_group || '',
        type: product.type || 'outro', cost: product.cost, sale_price: product.sale_price,
        unit: product.unit || 'un', stock: product.stock, min_stock: product.min_stock,
        photo: product.photo || '', active: product.active
      });
      setPhotoPreview(product.photo || '');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', description: '', product_group: '', type: 'outro', cost: '', sale_price: '',
        unit: 'un', stock: '', min_stock: '', photo: '', active: 1
      });
      setPhotoPreview('');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(url, {
        method, headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) { fetchData(); setShowModal(false); }
    } catch (error) { console.error('Error saving product:', error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error deleting product:', error); }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ type: 'entrada', quantity: '', reason: '' });
    setShowStockModal(true);
  };

  const handleStockAdjust = async () => {
    if (!stockForm.quantity || parseInt(stockForm.quantity) <=0) {
      alert('Informe uma quantidade válida');
      return;
    }
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/products/${selectedProduct.id}/stock`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...stockForm, user: 'Admin' })
      });
      if (res.ok) { fetchData(); setShowStockModal(false); }
      else { const err = await res.json(); alert(err.error || 'Erro ao ajustar estoque'); }
    } catch (error) { console.error('Error adjusting stock:', error); }
  };

  const openMovements = async (product) => {
    setSelectedProduct(product);
    try {
      const res = await fetch(`${API_URL}/products/${product.id}/stock-movements`, { headers: getAuthHeader() });
      if (res.ok) setStockMovements(await res.json());
    } catch (error) { console.error('Error fetching movements:', error); }
    setShowMovements(true);
  };

  const getTotalStockValue = () => products.reduce((sum, p) => sum + (p.stock * p.sale_price), 0);
  const getTotalCostValue = () => products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const getLowStockCount = () => products.filter(p => p.stock <= p.min_stock).length;
  const getTypeIcon = (type) => { const t = productTypes.find(pt => pt.key === type); return t ? t.icon : '📋'; };
  const getTypeLabel = (type) => { const t = productTypes.find(pt => pt.key === type); return t ? t.label : 'Outro'; };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Produtos</h1>
        <button onClick={() => openModal()} className="btn-primary">+ Novo Produto</button>
      </div>

      <div className="stats-grid" style={{marginBottom: '20px'}}>
        <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-info"><h3>{products.length}</h3><p>Total Produtos</p></div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-info"><h3>R$ {getTotalStockValue().toFixed(2)}</h3><p>Valor em Estoque (Venda)</p></div></div>
        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-info"><h3>R$ {getTotalCostValue().toFixed(2)}</h3><p>Valor em Estoque (Custo)</p></div></div>
        <div className="stat-card"><div className="stat-icon" style={{color: getLowStockCount() > 0 ? '#e74c3c' : '#27ae60'}}>⚠️</div><div className="stat-info"><h3 style={{color: getLowStockCount() > 0 ? '#e74c3c' : '#27ae60'}}>{getLowStockCount()}</h3><p>Estoque Baixo</p></div></div>
      </div>

      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '250px'}}>
          <input type="text" placeholder="Buscar por nome, código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}} />
        </div>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} style={{padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}}>
          <option value="">Todos os Grupos</option>
          {groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 14px', background: filterLowStock ? '#fdedec' : '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd'}}>
          <input type="checkbox" checked={filterLowStock} onChange={(e) => setFilterLowStock(e.target.checked)} />
          <span style={{fontSize: '14px', color: '#e74c3c', fontWeight: 'bold'}}>Estoque Baixo</span>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Foto</th><th>Código</th><th>Produto</th><th>Tipo</th><th>Grupo</th><th>Custo</th><th>Venda</th><th>Un.</th><th>Estoque</th><th>Mín.</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? <tr><td colSpan="11" className="empty-row">Nenhum produto encontrado</td></tr> :
              products.map(p => {
                const isLow = p.stock <= p.min_stock;
                return (
                  <tr key={p.id} style={isLow ? {background: '#fff5f5'} : {}}>
                    <td>
                      {p.photo ? <img src={p.photo} alt={p.name} style={{width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover'}} /> :
                        <div style={{width: '40px', height: '40px', borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>{getTypeIcon(p.type)}</div>}
                    </td>
                    <td style={{fontSize: '12px', fontWeight: 'bold', color: '#3498db', fontFamily: 'monospace'}}>{p.code}</td>
                    <td><strong>{p.name}</strong></td>
                    <td style={{fontSize: '16px'}} title={getTypeLabel(p.type)}>{getTypeIcon(p.type)}</td>
                    <td>{p.product_group || '-'}</td>
                    <td style={{color: '#777'}}>R$ {p.cost.toFixed(2)}</td>
                    <td style={{fontWeight: 'bold', color: '#27ae60'}}>R$ {p.sale_price.toFixed(2)}</td>
                    <td style={{fontSize: '12px', color: '#555'}}>{p.unit}</td>
                    <td>
                      <span style={{fontWeight: 'bold', color: isLow ? '#e74c3c' : '#2c3e50', fontSize: '18px'}}>{p.stock}</span>
                      {isLow && <span style={{fontSize: '10px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px'}}>BAIXO</span>}
                    </td>
                    <td>{p.min_stock}</td>
                    <td className="actions" style={{flexWrap: 'wrap'}}>
                      <button onClick={() => openStockModal(p)} className="btn-complete" style={{padding: '4px 8px', fontSize: '11px', marginBottom: '4px'}}>📦 Estoque</button>
                      <button onClick={() => openMovements(p)} className="btn-edit" style={{padding: '4px 8px', fontSize: '11px', marginBottom: '4px'}}>📋 Mov.</button>
                      <button onClick={() => openModal(p)} className="btn-edit" style={{padding: '4px 8px', fontSize: '11px', marginBottom: '4px'}}>Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="btn-delete" style={{padding: '4px 8px', fontSize: '11px', marginBottom: '4px'}}>Excluir</button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{maxWidth: '750px', width: '95%'}} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginBottom: '20px', color: '#2c3e50'}}>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '15px'}}>
                <div style={{width: '120px', flexShrink: 0, textAlign: 'center'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Foto</label>
                  {photoPreview ? <img src={photoPreview} alt="Preview" style={{width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #ddd'}} /> :
                    <div style={{width: '100px', height: '100px', borderRadius: '12px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', border: '2px solid #ddd', margin: '0 auto'}}>📦</div>}
                  <input id="product-photo-upload" type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileUpload} />
                  <div style={{marginTop: '8px'}}>
                    <button type="button" onClick={() => document.getElementById('product-photo-upload').click()} className="btn-secondary" style={{width: '100%', padding: '5px', fontSize: '11px'}}>Alterar foto</button>
                    {photoPreview && <button type="button" onClick={() => { setPhotoPreview(''); setFormData({...formData, photo: ''}); }} className="btn-delete" style={{width: '100%', padding: '5px', fontSize: '11px', marginTop: '4px'}}>Remover</button>}
                  </div>
                </div>

                <div style={{flex: 1}}>
                  {editingProduct && <div style={{marginBottom: '10px'}}><label style={{fontSize: '11px', color: '#999'}}>Código</label><p style={{fontWeight: 'bold', fontFamily: 'monospace', color: '#3498db', margin: '2px 0', fontSize: '14px'}}>{editingProduct.code}</p></div>}
                  <div className="form-group" style={{marginBottom: '10px'}}><label>Nome *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                  <div className="form-group" style={{marginBottom: '10px'}}><label>Descrição</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="2" style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} /></div>
                </div>
              </div>

              {/* Product Type Selector */}
              <div style={{marginBottom: '15px'}}>
                <label style={{fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Tipo de Embalagem</label>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  {productTypes.map(pt => (
                    <button key={pt.key} type="button" onClick={() => setFormData({...formData, type: pt.key})} style={{padding: '10px 14px', border: formData.type === pt.key ? '2px solid #3498db' : '1px solid #ddd', background: formData.type === pt.key ? '#ebf5fb' : 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px', transition: 'all 0.2s'}}>
                      <span style={{fontSize: '24px'}}>{pt.icon}</span>
                      <span style={{fontSize: '11px', fontWeight: formData.type === pt.key ? 'bold' : 'normal', color: formData.type === pt.key ? '#3498db' : '#555'}}>{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group"><label>Grupo *</label><input type="text" value={formData.product_group} onChange={(e) => setFormData({...formData, product_group: e.target.value})} placeholder="Ex: Shampoo, Coloração" required style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                <div className="form-group"><label>Unidade de Medida *</label><select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} style={{fontSize: '13px', padding: '6px 10px'}}>{unitOptions.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group"><label>Preço de Custo (R$) *</label><input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} min="0" step="0.01" required style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                <div className="form-group"><label>Preço de Venda (R$) *</label><input type="number" value={formData.sale_price} onChange={(e) => setFormData({...formData, sale_price: e.target.value})} min="0" step="0.01" required style={{fontSize: '13px', padding: '6px 10px'}} /></div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="form-group"><label>Estoque Atual *</label><input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} min="0" required disabled={!!editingProduct} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                <div className="form-group"><label>Estoque Mínimo *</label><input type="number" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} min="0" required style={{fontSize: '13px', padding: '6px 10px'}} /></div>
              </div>

              <div className="form-group" style={{marginBottom: '10px'}}>
                <label style={{display: 'flex', alignItems: 'center', fontSize: '13px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={formData.active === 1} onChange={(e) => setFormData({...formData, active: e.target.checked ? 1 : 0})} style={{marginRight: '8px'}} />
                  Produto Ativo
                </label>
              </div>

              <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">{editingProduct ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {showCropper && (
        <div className="modal-overlay" onClick={() => setShowCropper(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', maxWidth: '500px'}}>
            <h3>Arraste ou redimensione a caixa para escolher a área da imagem</h3>
            <div style={{margin: '20px 0'}}>
              {cropImage && (<ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop><img ref={imgRef} src={cropImage} style={{maxWidth: '100%', maxHeight: '400px'}} /></ReactCrop>)}
            </div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button type="button" onClick={getCroppedImg} className="btn-primary">Usar foto</button>
              <button type="button" onClick={() => { setShowCropper(false); setCropImage(null); }} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ajuste de Estoque</h2>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center', background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
              {selectedProduct.photo ? <img src={selectedProduct.photo} alt="" style={{width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover'}} /> :
                <div style={{width: '50px', height: '50px', borderRadius: '8px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>{getTypeIcon(selectedProduct.type)}</div>}
              <div>
                <strong>{selectedProduct.name}</strong>
                <p style={{margin: '4px 0 0', fontSize: '14px', color: '#777'}}>Código: {selectedProduct.code}</p>
              </div>
            </div>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <span style={{fontSize: '13px', color: '#777'}}>Estoque Atual</span>
              <p style={{fontSize: '32px', fontWeight: 'bold', color: selectedProduct.stock <= selectedProduct.min_stock ? '#e74c3c' : '#27ae60', margin: '4px 0'}}>{selectedProduct.stock} <span style={{fontSize: '16px'}}>{selectedProduct.unit}</span></p>
            </div>
            <div className="form-group"><label>Tipo de Movimento *</label><select value={stockForm.type} onChange={(e) => setStockForm({...stockForm, type: e.target.value})}><option value="entrada">📥 Entrada (Adicionar)</option><option value="saida">📤 Saída (Remover)</option></select></div>
            <div className="form-group"><label>Quantidade *</label><input type="number" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})} min="1" placeholder="0" /></div>
            <div className="form-group"><label>Motivo *</label><input type="text" value={stockForm.reason} onChange={(e) => setStockForm({...stockForm, reason: e.target.value})} placeholder="Ex: Compra fornecedor, Venda, Uso em serviço" /></div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={handleStockAdjust} className="btn-primary">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements Modal */}
      {showMovements && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowMovements(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px'}}>
              {selectedProduct.photo ? <img src={selectedProduct.photo} alt="" style={{width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover'}} /> :
                <div style={{width: '40px', height: '40px', borderRadius: '8px', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>{getTypeIcon(selectedProduct.type)}</div>}
              <div><h2 style={{margin: 0}}>Histórico de Estoque</h2><p style={{margin: '2px 0 0', fontSize: '13px', color: '#777'}}>{selectedProduct.name} ({selectedProduct.code}) — Estoque: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></p></div>
            </div>
            {stockMovements.length === 0 ? <p className="empty-state">Nenhum movimento registrado</p> :
              <div className="table-container">
                <table className="data-table" style={{fontSize: '13px'}}>
                  <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Motivo</th><th>Usuário</th></tr></thead>
                  <tbody>{stockMovements.map(m => (
                    <tr key={m.id} style={{background: m.type === 'entrada' ? '#eafaf1' : '#fdedec'}}>
                      <td>{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td><span style={{fontWeight: 'bold', color: m.type === 'entrada' ? '#27ae60' : '#e74c3c'}}>{m.type === 'entrada' ? '📥 Entrada' : '📤 Saída'}</span></td>
                      <td style={{fontWeight: 'bold'}}>{m.quantity}</td>
                      <td>{m.reason}</td>
                      <td>{m.user}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            }
            <div className="modal-actions" style={{justifyContent: 'flex-end'}}><button type="button" onClick={() => setShowMovements(false)} className="btn-primary">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
