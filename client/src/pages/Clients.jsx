import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, User, Camera, MessageCircle } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', gender: '', birth_date: '', phone: '', email: '', cpf: ''
  });
  const [services, setServices] = useState([]);
  const [financial, setFinancial] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newService, setNewService] = useState({ date: '', service: '', value: '', status: 'Concluído' });
  const [newFinancial, setNewFinancial] = useState({ date: '', description: '', type: 'Débito', value: '', status: 'Pendente' });
  const [showNewService, setShowNewService] = useState(false);
  const [showNewFinancial, setShowNewFinancial] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingFinancial, setEditingFinancial] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [photoPreview, setPhotoPreview] = useState('');
  const [plans, setPlans] = useState([]);
  const [cameraStream, setCameraStream] = useState(null);
  const defaultAnamnese = {
    tipo_cabelo: '', couro_cabeludo: '', problemas: [], frequencia_lavagem: '',
    finalizadores: false, finalizadores_quais: '', produtos: '',
    quimicos: '', alergias: '', transplante: false,
    doencas: '', medicamentos: '', gestante: false,
    objetivos: '', observacoes: ''
  };
  const [anamneseData, setAnamneseData] = useState({ ...defaultAnamnese });
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({ name: '', type: 'Termo', date: '' });
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const ufOptions = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  const getWhatsAppLink = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '').replace(/^0+/, '');
    return `https://wa.me/${cleaned.startsWith('55') ? cleaned : `55${cleaned}`}`;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhotoPreview(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error:', err);
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPhotoPreview(canvas.toDataURL('image/jpeg', 0.8));
    closeCamera();
  };

  const fetchCEP = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData({ ...formData, street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', complement: data.complemento || '', state: data.uf || '' });
      }
    } catch (error) { console.error('Erro ao buscar CEP:', error); }
  };

  useEffect(() => { return () => { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); }; }, []);

  useEffect(() => { fetchClients(); }, [search]);
  useEffect(() => { (async () => { try { const res = await fetch(`${API_URL}/plans?active=1`, { headers: getAuthHeader() }); if (res.ok) setPlans(await res.json()); } catch(e) {} })(); }, []);

  const fetchClients = async () => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_URL}/clients${query}`, { headers: getAuthHeader() });
      if (res.ok) setClients(await res.json());
    } catch (error) { console.error('Error fetching clients:', error); }
    finally { setLoading(false); }
  };

  const openModal = (client = null) => {
    setActiveTab('info');
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '', gender: client.gender || '', birth_date: client.birth_date || '',
        cpf: client.cpf || '', rg: client.rg || '', phone: client.phone || '', landline: client.landline || '',
        email: client.email || '', how_found: client.how_found || '', holder_type: client.holder_type || 'Titular',
        plan: client.plan || '', cep: client.cep || '', street: client.street || '', number: client.number || '',
        complement: client.complement || '', neighborhood: client.neighborhood || '', city: client.city || '',
        state: client.state || '', notes: client.notes || '', responsible_name: client.responsible_name || '',
        responsible_birth_date: client.responsible_birth_date || '', responsible_cpf: client.responsible_cpf || '',
        responsible_phone: client.responsible_phone || '', profession: client.profession || '',
        foreigner: client.foreigner || false, app_access_code: client.app_access_code || '',
        anamnese_capilar: ''
      });
      setPhotoPreview(client.photo || '');
      setServices(client.services || []);
      setFinancial(client.financial || []);
      setDocuments(client.documents || []);
      let parsed = { ...defaultAnamnese };
      try { const p = JSON.parse(client.anamnese_capilar || '{}'); parsed = { ...parsed, ...p }; } catch(e) {}
      setAnamneseData(parsed);
    } else {
      setEditingClient(null);
      setFormData({
        name: '', gender: '', birth_date: '', cpf: '', rg: '',
        phone: '', landline: '', email: '', how_found: '', holder_type: 'Titular',
        plan: '', cep: '', street: '', number: '', complement: '',
        neighborhood: '', city: '', state: '', notes: '',
        responsible_name: '', responsible_birth_date: '', responsible_cpf: '',
        responsible_phone: '', profession: '', foreigner: false,
        app_access_code: '', anamnese_capilar: ''
      });
      setPhotoPreview('');
      setServices([]);
      setFinancial([]);
      setDocuments([]);
      setAnamneseData({ ...defaultAnamnese });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingClient(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingClient ? `${API_URL}/clients/${editingClient.id}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      formData.anamnese_capilar = JSON.stringify(anamneseData);
      formData.photo = photoPreview;
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ ...formData, services, financial, documents })
      });
      if (res.ok) { fetchClients(); closeModal(); } else { const err = await res.text(); alert('Erro ao salvar: ' + err); }
    } catch (error) { console.error('Error saving client:', error); alert('Erro ao salvar: ' + error.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try { const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE', headers: getAuthHeader() }); if (res.ok) fetchClients(); }
    catch (error) { console.error('Error deleting client:', error); }
  };

  const addService = () => {
    if (!newService.date || !newService.service) return;
    setServices([...services, { id: Date.now(), ...newService }]);
    setNewService({ date: '', service: '', value: '', status: 'Concluído' });
    setShowNewService(false);
  };

  const removeService = (id) => setServices(services.filter(s => s.id !== id));

  const addFinancial = () => {
    if (!newFinancial.date || !newFinancial.description || !newFinancial.value) return;
    setFinancial([...financial, { id: Date.now(), ...newFinancial }]);
    setNewFinancial({ date: '', description: '', type: 'Débito', value: '', status: 'Pendente' });
    setShowNewFinancial(false);
  };

  const editFinancial = (item) => {
    setEditingFinancial(item);
    setNewFinancial({ ...item });
    setShowNewFinancial(true);
  };

  const updateFinancial = () => {
    setFinancial(financial.map(f => f.id === editingFinancial.id ? { ...newFinancial, id: editingFinancial.id } : f));
    setEditingFinancial(null);
    setNewFinancial({ date: '', description: '', type: 'Débito', value: '', status: 'Pendente' });
    setShowNewFinancial(false);
  };

  const removeFinancial = (id) => setFinancial(financial.filter(f => f.id !== id));

  const addDocument = () => {
    if (!newDocument.name) return;
    setDocuments([...documents, { id: Date.now(), ...newDocument }]);
    setNewDocument({ name: '', type: 'Termo', date: '' });
    setShowNewDocument(false);
  };

  const removeDocument = (id) => setDocuments(documents.filter(d => d.id !== id));

  const getTotalDebits = () => financial.filter(f => f.status === 'Pendente').reduce((sum, f) => sum + parseFloat(f.value || 0), 0);
  const getTotalCredits = () => financial.filter(f => f.type === 'Crédito' && f.status === 'Pago').reduce((sum, f) => sum + parseFloat(f.value || 0), 0);
  const getBalance = () => getTotalCredits() - getTotalDebits();

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={() => openModal()} className="btn-primary">+ Novo Cliente</button>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="Buscar por nome, email, telefone ou CPF..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Foto</th><th>Nome</th><th>Celular</th><th>CPF</th><th>Plano</th><th>Cidade</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? <tr><td colSpan="7" className="empty-row">Nenhum cliente encontrado</td></tr> :
              clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    {client.photo ? <img src={client.photo} alt={client.name} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} /> :
                      <div style={{width: '40px', height: '40px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{client.name.charAt(0).toUpperCase()}</div>}
                  </td>
                  <td>{client.name}</td>
                  <td>{client.phone}</td>
                  <td>{client.cpf || '-'}</td>
                  <td>{client.plan || '-'}</td>
                  <td>{client.city || '-'}</td>
                  <td className="actions">
                    {client.phone && <a href={getWhatsAppLink(client.phone)} target="_blank" rel="noopener noreferrer" className="btn-whatsapp" title="Enviar WhatsApp"><MessageCircle size={16} /></a>}
                    <button onClick={() => openModal(client)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(client.id)} className="btn-delete">Excluir</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{width: '98vw', height: '95vh', maxWidth: '1600px', maxHeight: '1000px', overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <h1 style={{marginBottom: '15px', fontSize: '22px', flexShrink: 0, color: '#2c3e50'}}>Dados do cliente</h1>
            <form onSubmit={handleSubmit} style={{display: 'flex', gap: '20px', alignItems: 'flex-start', flex: 1}}>
              {/* Left Sidebar */}
              <div style={{width: '160px', flexShrink: 0}}>
                <label style={{fontSize: '13px', fontWeight: 'bold'}}>Foto</label>
                <div style={{marginTop: '10px', display: 'flex', justifyContent: 'center'}}>
                  {photoPreview ? <img src={photoPreview} alt="Preview" style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd'}} /> :
                    <div style={{width: '120px', height: '120px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ddd'}}><Camera size={45} style={{color: '#9ca3af'}} /></div>}
                  <input id="photo-upload" type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileUpload} />
                </div>
                <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  <button type="button" onClick={() => document.getElementById('photo-upload').click()} className="btn-secondary" style={{width: '100%', padding: '5px', fontSize: '11px'}}>Alterar foto</button>
                  <button type="button" onClick={openCamera} className="btn-secondary" style={{width: '100%', padding: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}><Camera size={12} /> Tirar Foto</button>
                </div>
                <div style={{marginTop: '10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={formData.foreigner} onChange={(e) => setFormData({...formData, foreigner: e.target.checked})} style={{marginRight: '5px'}} />
                    Cliente estrangeiro
                  </label>
                </div>
              </div>

              {/* Camera */}
              {showCamera && (
                <div className="modal-overlay" onClick={closeCamera}>
                  <div className="modal" onClick={(e) => e.stopPropagation()} style={{textAlign: 'center'}}>
                    <h3>Câmera</h3>
                    <video ref={videoRef} autoPlay style={{width: '100%', maxWidth: '400px', borderRadius: '8px'}} />
                    <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                      <button type="button" onClick={capturePhoto} className="btn-primary" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}><Camera size={16} /> Capturar</button>
                      <button type="button" onClick={closeCamera} className="btn-secondary">Cancelar</button>
                    </div>
                  </div>
                </div>
              )}



              {/* Right Column */}
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
                <div style={{flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 5px'}}>
                  <h1 style={{fontSize: '18px', margin: 0, color: '#2c3e50'}}>Dados do cliente</h1>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', flexShrink: 0}}>
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>Sexo</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}>
                        <option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>CPF</label>
                      <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>RG</label>
                      <input type="text" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>Celular *</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input type="text" value={formData.landline} onChange={(e) => setFormData({ ...formData, landline: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                    <div className="form-group">
                      <label>Como chegou ao salão</label>
                      <select value={formData.how_found} onChange={(e) => setFormData({ ...formData, how_found: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}>
                        <option value="">Selecione</option><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="Google">Google</option><option value="Indicação">Indicação</option><option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Titular ou Dependente</label>
                      <select value={formData.holder_type} onChange={(e) => setFormData({ ...formData, holder_type: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}>
                        <option value="Titular">Titular</option><option value="Dependente">Dependente</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Empresa onde trabalha</label>
                      <input type="text" value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} placeholder="Nome da empresa" style={{fontSize: '13px', padding: '6px 10px'}} />
                    </div>
                  </div>

                  {/* Responsável */}
                  {formData.holder_type === 'Dependente' && (
                    <div style={{flexShrink: 0}}>
                      <h2 style={{fontSize: '16px', margin: '10px 0 5px', color: '#2c3e50'}}>Dados do responsável</h2>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                        <div className="form-group"><label>Nome do responsável</label><input type="text" value={formData.responsible_name} onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Data de Nascimento</label><input type="date" value={formData.responsible_birth_date} onChange={(e) => setFormData({ ...formData, responsible_birth_date: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>CPF do responsável</label><input type="text" value={formData.responsible_cpf} onChange={(e) => setFormData({ ...formData, responsible_cpf: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Celular do responsável</label><input type="text" value={formData.responsible_phone} onChange={(e) => setFormData({ ...formData, responsible_phone: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div style={{display: 'flex', gap: '5px', borderBottom: '2px solid #ddd', margin: '10px 0 5px', flexShrink: 0, flexWrap: 'wrap'}}>
                    {[{key:'info', label:'Informações'}, {key:'plano', label:'Plano'}, {key:'endereco', label:'Endereço'}, {key:'anamnese', label:'Anamnese Capilar'}, {key:'servicos', label:'Serviços'}, {key:'financeiro', label:'Financeiro'}, {key:'documentos', label:'Documentos'}].map(tab => (
                      <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{padding: '8px 12px', border: 'none', borderBottom: activeTab === tab.key ? '3px solid #007bff' : '3px solid transparent', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: activeTab === tab.key ? 'bold' : 'normal', whiteSpace: 'nowrap'}}>{tab.label}</button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div style={{flex: 1, overflow: 'auto'}}>
                    {activeTab === 'info' && (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                        <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Código de Acesso App</label><input type="text" value={formData.app_access_code} onChange={(e) => setFormData({ ...formData, app_access_code: e.target.value })} placeholder="Gerado automaticamente" style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                      </div>
                    )}

                    {activeTab === 'plano' && (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                        <div className="form-group"><label>Plano</label><select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}><option value="">Selecione</option>{plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                      </div>
                    )}

                    {activeTab === 'endereco' && (
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                        <div className="form-group"><label>CEP</label><input type="text" value={formData.cep} onChange={(e) => { const v = e.target.value; setFormData({ ...formData, cep: v }); if (v.replace(/\D/g, '').length === 8) fetchCEP(v); }} placeholder="00000-000" style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Rua</label><input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Nº</label><input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Complemento</label><input type="text" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Bairro</label><input type="text" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group"><label>Cidade</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}} /></div>
                        <div className="form-group">
                          <label>Estado (UF)</label>
                          <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}>
                            <option value="">Selecione</option>
                            {ufOptions.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {activeTab === 'anamnese' && (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        <h3 style={{fontSize: '15px', margin: 0, color: '#2c3e50'}}>I. Dados Capilares</h3>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                          <div className="form-group">
                            <label>Tipo de Cabelo</label>
                            <select value={anamneseData.tipo_cabelo} onChange={(e) => setAnamneseData({...anamneseData, tipo_cabelo: e.target.value})} style={{fontSize: '13px', padding: '6px 10px'}}>
                              <option value="">Selecione</option>
                              <option value="liso">Liso</option>
                              <option value="ondulado">Ondulado</option>
                              <option value="cacheado">Cacheado</option>
                              <option value="crespo">Crespo</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Couro Cabeludo</label>
                            <select value={anamneseData.couro_cabeludo} onChange={(e) => setAnamneseData({...anamneseData, couro_cabeludo: e.target.value})} style={{fontSize: '13px', padding: '6px 10px'}}>
                              <option value="">Selecione</option>
                              <option value="oleoso">Oleoso</option>
                              <option value="seco">Seco</option>
                              <option value="normal">Normal</option>
                              <option value="misto">Misto</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Frequência de Lavagem</label>
                            <select value={anamneseData.frequencia_lavagem} onChange={(e) => setAnamneseData({...anamneseData, frequencia_lavagem: e.target.value})} style={{fontSize: '13px', padding: '6px 10px'}}>
                              <option value="">Selecione</option>
                              <option value="diaria">Diária</option>
                              <option value="dia_sim_nao">Dia sim, dia não</option>
                              <option value="2x_semana">2x por semana</option>
                              <option value="1x_semana">1x por semana</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Problemas Capilares</label>
                          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px'}}>
                            {['Queda', 'Quebra', 'Caspa', 'Oleosidade excessiva', 'Ressecamento', 'Coceira', 'Dermatite', 'Outro'].map(p => (
                              <label key={p} style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                                <input type="checkbox" checked={anamneseData.problemas.includes(p)} onChange={(e) => {
                                  const probs = e.target.checked ? [...anamneseData.problemas, p] : anamneseData.problemas.filter(x => x !== p);
                                  setAnamneseData({...anamneseData, problemas: probs});
                                }} />
                                {p}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Usa Finalizadores?</label>
                          <div style={{display: 'flex', gap: '16px', marginTop: '4px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                              <input type="radio" name="finalizadores" checked={anamneseData.finalizadores === true} onChange={() => setAnamneseData({...anamneseData, finalizadores: true})} /> Sim
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                              <input type="radio" name="finalizadores" checked={anamneseData.finalizadores === false} onChange={() => setAnamneseData({...anamneseData, finalizadores: false, finalizadores_quais: ''})} /> Não
                            </label>
                          </div>
                          {anamneseData.finalizadores && (
                            <input type="text" value={anamneseData.finalizadores_quais} onChange={(e) => setAnamneseData({...anamneseData, finalizadores_quais: e.target.value})} placeholder="Quais?" style={{fontSize: '13px', padding: '6px 10px', marginTop: '4px', width: '100%'}} />
                          )}
                        </div>
                        <div className="form-group">
                          <label>Produtos que Costuma Usar</label>
                          <textarea value={anamneseData.produtos} onChange={(e) => setAnamneseData({...anamneseData, produtos: e.target.value})} rows="2" placeholder="Shampoo, condicionador, máscara, etc." style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>

                        <h3 style={{fontSize: '15px', margin: '8px 0 0', color: '#2c3e50'}}>II. Histórico e Saúde</h3>
                        <div className="form-group">
                          <label>Histórico de Tratamentos Químicos</label>
                          <textarea value={anamneseData.quimicos} onChange={(e) => setAnamneseData({...anamneseData, quimicos: e.target.value})} rows="2" placeholder="Progressiva, coloração, alisamento, etc." style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>
                        <div className="form-group">
                          <label>Alergias Conhecidas</label>
                          <textarea value={anamneseData.alergias} onChange={(e) => setAnamneseData({...anamneseData, alergias: e.target.value})} rows="2" placeholder="Alergias a produtos, químicos, etc." style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px'}}>
                          <div className="form-group">
                            <label>Já Realizou Transplante Capilar?</label>
                            <div style={{display: 'flex', gap: '16px', marginTop: '4px'}}>
                              <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                                <input type="radio" name="transplante" checked={anamneseData.transplante === true} onChange={() => setAnamneseData({...anamneseData, transplante: true})} /> Sim
                              </label>
                              <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                                <input type="radio" name="transplante" checked={anamneseData.transplante === false} onChange={() => setAnamneseData({...anamneseData, transplante: false})} /> Não
                              </label>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Gestante / Lactante?</label>
                            <div style={{display: 'flex', gap: '16px', marginTop: '4px'}}>
                              <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                                <input type="radio" name="gestante" checked={anamneseData.gestante === true} onChange={() => setAnamneseData({...anamneseData, gestante: true})} /> Sim
                              </label>
                              <label style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer'}}>
                                <input type="radio" name="gestante" checked={anamneseData.gestante === false} onChange={() => setAnamneseData({...anamneseData, gestante: false})} /> Não
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Histórico de Doenças</label>
                          <textarea value={anamneseData.doencas} onChange={(e) => setAnamneseData({...anamneseData, doencas: e.target.value})} rows="2" placeholder="Doenças relevantes para o tratamento capilar" style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>
                        <div className="form-group">
                          <label>Uso de Medicamentos</label>
                          <textarea value={anamneseData.medicamentos} onChange={(e) => setAnamneseData({...anamneseData, medicamentos: e.target.value})} rows="2" placeholder="Medicamentos em uso contínuo" style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>

                        <h3 style={{fontSize: '15px', margin: '8px 0 0', color: '#2c3e50'}}>III. Objetivos</h3>
                        <div className="form-group">
                          <label>Objetivos com o Tratamento</label>
                          <textarea value={anamneseData.objetivos} onChange={(e) => setAnamneseData({...anamneseData, objetivos: e.target.value})} rows="2" placeholder="O que espera alcançar com os tratamentos" style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>
                        <div className="form-group">
                          <label>Observações</label>
                          <textarea value={anamneseData.observacoes} onChange={(e) => setAnamneseData({...anamneseData, observacoes: e.target.value})} rows="2" placeholder="Informações adicionais relevantes" style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
                        </div>
                      </div>
                    )}

                    {activeTab === 'servicos' && (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{fontWeight: 'bold', fontSize: '14px', color: '#2c3e50'}}>Histórico de Serviços</span>
                          <button type="button" onClick={() => { setEditingFinancial(null); setNewService({ date: '', service: '', value: '', status: 'Concluído' }); setShowNewService(!showNewService); }} className="btn-primary" style={{padding: '5px 12px', fontSize: '12px'}}>+ Novo Serviço</button>
                        </div>
                        {showNewService && (
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '8px', alignItems: 'end', padding: '10px', background: '#f5f5f5', borderRadius: '6px'}}>
                            <div className="form-group"><label>Data</label><input type="date" value={newService.date} onChange={(e) => setNewService({...newService, date: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Serviço</label><input type="text" value={newService.service} onChange={(e) => setNewService({...newService, service: e.target.value})} placeholder="Ex: Corte Feminino" style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Valor (R$)</label><input type="number" value={newService.value} onChange={(e) => setNewService({...newService, value: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Status</label><select value={newService.status} onChange={(e) => setNewService({...newService, status: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}}><option>Concluído</option><option>Agendado</option><option>Cancelado</option></select></div>
                            <div style={{display: 'flex', gap: '4px', paddingTop: '20px'}}>
                              <button type="button" onClick={addService} className="btn-primary" style={{padding: '5px 10px', fontSize: '12px'}}>Salvar</button>
                              <button type="button" onClick={() => setShowNewService(false)} className="btn-secondary" style={{padding: '5px 10px', fontSize: '12px'}}>Cancelar</button>
                            </div>
                          </div>
                        )}
                        {services.length > 0 && (
                          <div style={{overflow: 'auto'}}>
                            <table className="data-table" style={{fontSize: '12px'}}>
                              <thead><tr><th>Data</th><th>Serviço</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                              <tbody>{services.map(s => (<tr key={s.id}><td>{s.date}</td><td>{s.service}</td><td>R$ {parseFloat(s.value || 0).toFixed(2)}</td><td>{s.status}</td><td><button type="button" onClick={() => removeService(s.id)} className="btn-delete" style={{padding: '3px 8px', fontSize: '11px'}}>Remover</button></td></tr>))}</tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'financeiro' && (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                          <span style={{fontWeight: 'bold', fontSize: '14px', color: '#2c3e50'}}>Financeiro / Débitos</span>
                          <div style={{display: 'flex', gap: '15px', fontSize: '13px'}}>
                            <span style={{color: '#e74c3c'}}>Débitos: R$ {getTotalDebits().toFixed(2)}</span>
                            <span style={{color: '#27ae60'}}>Créditos: R$ {getTotalCredits().toFixed(2)}</span>
                            <span style={{color: getBalance() >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 'bold'}}>Saldo: R$ {getBalance().toFixed(2)}</span>
                          </div>
                          <button type="button" onClick={() => { setEditingFinancial(null); setNewFinancial({ date: '', description: '', type: 'Débito', value: '', status: 'Pendente' }); setShowNewFinancial(!showNewFinancial); }} className="btn-primary" style={{padding: '5px 12px', fontSize: '12px'}}>+ Novo Lançamento</button>
                        </div>
                        {showNewFinancial && (
                          <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', padding: '10px', background: '#f5f5f5', borderRadius: '6px'}}>
                            <div className="form-group"><label>Data</label><input type="date" value={newFinancial.date} onChange={(e) => setNewFinancial({...newFinancial, date: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Descrição</label><input type="text" value={newFinancial.description} onChange={(e) => setNewFinancial({...newFinancial, description: e.target.value})} placeholder="Ex: Corte Feminino - Pix" style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Tipo</label><select value={newFinancial.type} onChange={(e) => setNewFinancial({...newFinancial, type: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}}><option>Débito</option><option>Crédito</option></select></div>
                            <div className="form-group"><label>Valor (R$)</label><input type="number" value={newFinancial.value} onChange={(e) => setNewFinancial({...newFinancial, value: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Status</label><select value={newFinancial.status} onChange={(e) => setNewFinancial({...newFinancial, status: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}}><option>Pendente</option><option>Pago</option></select></div>
                            <div style={{display: 'flex', gap: '4px', paddingTop: '20px'}}>
                              <button type="button" onClick={editingFinancial ? updateFinancial : addFinancial} className="btn-primary" style={{padding: '5px 10px', fontSize: '12px'}}>{editingFinancial ? 'Atualizar' : 'Salvar'}</button>
                              <button type="button" onClick={() => { setShowNewFinancial(false); setEditingFinancial(null); }} className="btn-secondary" style={{padding: '5px 10px', fontSize: '12px'}}>Cancelar</button>
                            </div>
                          </div>
                        )}
                        {financial.length > 0 && (
                          <div style={{overflow: 'auto'}}>
                            <table className="data-table" style={{fontSize: '12px'}}>
                              <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
                              <tbody>{financial.map(f => (
                                <tr key={f.id} style={{background: f.type === 'Crédito' ? '#e8f5e9' : '#ffebee'}}>
                                  <td>{f.date}</td><td>{f.description}</td>
                                  <td><span style={{fontWeight: 'bold', color: f.type === 'Crédito' ? '#27ae60' : '#e74c3c'}}>{f.type}</span></td>
                                  <td>R$ {parseFloat(f.value || 0).toFixed(2)}</td>
                                  <td><span className={`status-badge ${f.status === 'Pago' ? 'status-active' : 'status-scheduled'}`}>{f.status}</span></td>
                                  <td style={{display: 'flex', gap: '4px'}}>
                                    <button type="button" onClick={() => editFinancial(f)} className="btn-edit" style={{padding: '3px 8px', fontSize: '11px'}}>Editar</button>
                                    <button type="button" onClick={() => removeFinancial(f.id)} className="btn-delete" style={{padding: '3px 8px', fontSize: '11px'}}>Remover</button>
                                  </td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'documentos' && (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{fontWeight: 'bold', fontSize: '14px', color: '#2c3e50'}}>Documentos</span>
                          <button type="button" onClick={() => { setNewDocument({ name: '', type: 'Termo', date: '' }); setShowNewDocument(!showNewDocument); }} className="btn-primary" style={{padding: '5px 12px', fontSize: '12px'}}>+ Novo Documento</button>
                        </div>
                        {showNewDocument && (
                          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'end', padding: '10px', background: '#f5f5f5', borderRadius: '6px'}}>
                            <div className="form-group"><label>Nome</label><input type="text" value={newDocument.name} onChange={(e) => setNewDocument({...newDocument, name: e.target.value})} placeholder="Ex: Termo de Consentimento" style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div className="form-group"><label>Tipo</label><select value={newDocument.type} onChange={(e) => setNewDocument({...newDocument, type: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}}><option>Termo</option><option>Contrato</option><option>Ficha</option><option>Outro</option></select></div>
                            <div className="form-group"><label>Data</label><input type="date" value={newDocument.date} onChange={(e) => setNewDocument({...newDocument, date: e.target.value})} style={{fontSize: '12px', padding: '5px 8px'}} /></div>
                            <div style={{display: 'flex', gap: '4px', paddingTop: '20px'}}>
                              <button type="button" onClick={addDocument} className="btn-primary" style={{padding: '5px 10px', fontSize: '12px'}}>Salvar</button>
                              <button type="button" onClick={() => setShowNewDocument(false)} className="btn-secondary" style={{padding: '5px 10px', fontSize: '12px'}}>Cancelar</button>
                            </div>
                          </div>
                        )}
                        {documents.length > 0 && (
                          <div style={{overflow: 'auto'}}>
                            <table className="data-table" style={{fontSize: '12px'}}>
                              <thead><tr><th>Nome</th><th>Tipo</th><th>Data</th><th>Ações</th></tr></thead>
                              <tbody>{documents.map(d => (<tr key={d.id}><td>{d.name}</td><td>{d.type}</td><td>{d.date || '-'}</td><td><button type="button" onClick={() => removeDocument(d.id)} className="btn-delete" style={{padding: '3px 8px', fontSize: '11px'}}>Remover</button></td></tr>))}</tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  <div className="form-group" style={{flexShrink: 0}}>
                    <label>Observações</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" style={{fontSize: '13px', padding: '6px 10px'}} />
                  </div>
                </div>

                {/* Botões */}
                <div className="modal-actions" style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0, marginTop: '10px'}}>
                  <button type="button" onClick={closeModal} className="btn-secondary" style={{padding: '6px 15px', fontSize: '12px'}}>Cancelar</button>
                  {editingClient && (<button type="button" onClick={() => { if (confirm('Tem certeza que deseja excluir este cliente?')) { handleDelete(editingClient.id); closeModal(); } }} className="btn-delete" style={{padding: '6px 15px', fontSize: '12px'}}>Excluir</button>)}
                  <button type="submit" className="btn-primary" style={{padding: '6px 15px', fontSize: '12px'}}>Salvar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}