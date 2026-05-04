import { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Plus } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const ufOptions = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', gender: '', birth_date: '', cpf: '', rg: '',
    phone: '', landline: '', email: '', how_found: '', holder_type: 'Titular',
    plan: '', cep: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', notes: '',
    responsible_name: '', responsible_birth_date: '', responsible_cpf: '',
    responsible_phone: '', profession: '', foreigner: false,
    app_access_code: '', anamnese_capilar: ''
  });
  const [activeTab, setActiveTab] = useState('info');
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [services, setServices] = useState([]);
  const [financial, setFinancial] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showNewService, setShowNewService] = useState(false);
  const [showNewFinancial, setShowNewFinancial] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);
  const [newService, setNewService] = useState({ date: '', service: '', value: '', status: 'Concluído' });
  const [newFinancial, setNewFinancial] = useState({ date: '', description: '', type: 'Débito', value: '', status: 'Pendente' });
  const [newDocument, setNewDocument] = useState({ name: '', type: 'Termo', date: '' });
  const [editingFinancial, setEditingFinancial] = useState(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); setCameraStream(null); }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      setCropImage(canvas.toDataURL('image/jpeg'));
      setShowCropper(true);
      closeCamera();
    }
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
    setFormData({...formData, photo: croppedDataUrl});
    setPhotoPreview(croppedDataUrl);
    setShowCropper(false);
    setCropImage(null);
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
        anamnese_capilar: client.anamnese_capilar || ''
      });
      setPhotoPreview(client.photo || '');
      setServices(client.services || []);
      setFinancial(client.financial || []);
      setDocuments(client.documents || []);
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
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingClient(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingClient ? `${API_URL}/clients/${editingClient.id}` : `${API_URL}/clients`;
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, services, financial, documents })
      });
      if (res.ok) { fetchClients(); closeModal(); }
    } catch (error) { console.error('Error saving client:', error); }
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

              {/* Cropper */}
              {showCropper && (
                <div className="modal-overlay" onClick={() => setShowCropper(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()} style={{textAlign: 'center', maxWidth: '500px'}}>
                    <h3>Arraste ou redimensione a caixa para escolher a área da imagem</h3>
                    <div style={{margin: '20px 0'}}>
                      {cropImage && (<ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop><img ref={imgRef} src={cropImage} style={{maxWidth: '100%', maxHeight: '400px'}} /></ReactCrop>)}
                    </div>
                    <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                      <button type="button" onClick={getCroppedImg} className="btn-primary">Alterar foto</button>
                      <button type="button" onClick={() => { setShowCropper(false); setCropImage(null); }} className="btn-secondary">Cancelar</button>
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
                        <div className="form-group"><label>Plano</label><select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} style={{fontSize: '13px', padding: '6px 10px'}}><option value="">Selecione</option><option value="Básico">Básico</option><option value="Premium">Premium</option><option value="VIP">VIP</option></select></div>
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
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div className="form-group">
                          <label>Anamnese Capilar</label>
                          <textarea value={formData.anamnese_capilar} onChange={(e) => setFormData({ ...formData, anamnese_capilar: e.target.value })} rows="8" placeholder={`1. Histórico de tratamentos químicos recentes\n2. Alergias conhecidas\n3. Tipo de cabelo (liso, ondulado, cacheado, crespo)\n4. Couro cabeludo (oleoso, seco, normal)\n5. Problemas capilares (queda, quebra, caspa)\n6. Produtos que costuma usar\n7. Objetivos com o tratamento`} style={{fontSize: '13px', padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical'}} />
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