import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Users, CreditCard, ClipboardList, FileText, MessageSquare, Shield, Save, ArrowLeft } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const sections = [
  { key: 'salao', label: 'Salão', icon: Store, desc: 'Dados do salão, endereço, horários' },
  { key: 'equipe', label: 'Equipe', icon: Users, desc: 'Gerenciar profissionais', link: '/employees' },
  { key: 'planos', label: 'Planos', icon: CreditCard, desc: 'Gerenciar planos', link: '/planos' },
  { key: 'anamnese', label: 'Anamnese', icon: ClipboardList, desc: 'Configurar perguntas da anamnese capilar' },
  { key: 'contrato', label: 'Contrato', icon: FileText, desc: 'Termo de consentimento e contratos' },
  { key: 'comunicacao', label: 'Comunicação', icon: MessageSquare, desc: 'WhatsApp, SMS, e-mail' },
  { key: 'permissoes', label: 'Permissões', icon: Shield, desc: 'Gerenciar usuários e funções', link: '/permissoes' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonData, setSalonData] = useState({
    salon_name: '', salon_address: '', salon_phone: '', salon_whatsapp: '',
    salon_instagram: '', salon_email: '', salon_hours: '', salon_about: ''
  });
  const [anamneseData, setAnamneseData] = useState({
    questions: ''
  });
  const [contractData, setContractData] = useState({
    contract_text: ''
  });
  const [commData, setCommData] = useState({
    whatsapp_api_key: '', sms_provider: '', sms_api_key: '', email_smtp: '', email_user: '', email_pass: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, { headers: getAuthHeader() });
      if (res.ok) {
        const s = await res.json();
        setSalonData({
          salon_name: s.salon_name || '', salon_address: s.salon_address || '', salon_phone: s.salon_phone || '',
          salon_whatsapp: s.salon_whatsapp || '', salon_instagram: s.salon_instagram || '',
          salon_email: s.salon_email || '', salon_hours: s.salon_hours || '', salon_about: s.salon_about || ''
        });
        setAnamneseData({ questions: s.anamnese_questions || '' });
        setContractData({ contract_text: s.contract_text || '' });
        setCommData({
          whatsapp_api_key: s.whatsapp_api_key || '', sms_provider: s.sms_provider || '',
          sms_api_key: s.sms_api_key || '', email_smtp: s.email_smtp || '',
          email_user: s.email_user || '', email_pass: s.email_pass || ''
        });
      }
    } catch (error) { console.error('Error loading settings:', error); }
    finally { setLoading(false); }
  };

  const saveSection = async (key, data) => {
    setSaving(true);
    setMsg('');
    try {
      const headers = getAuthHeader();
      headers['Content-Type'] = 'application/json';
      for (const [k, v] of Object.entries(data)) {
        await fetch(`${API_URL}/settings/${k}`, { method: 'PUT', headers, body: JSON.stringify({ value: v }) });
      }
      setMsg('Salvo com sucesso!');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) { console.error('Error saving:', error); setMsg('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  if (!activeSection) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Ajustes</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <div key={sec.key} onClick={() => sec.link ? navigate(sec.link) : setActiveSection(sec.key)}
                style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'box-shadow 0.2s', border: '1px solid #eee' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} style={{ color: '#002cd6' }} />
                </div>
                <div>
                  <strong style={{ fontSize: '15px', display: 'block', color: '#000' }}>{sec.label}</strong>
                  <span style={{ fontSize: '12px', color: '#999' }}>{sec.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const renderForm = () => {
    switch (activeSection) {
      case 'salao':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Nome do Salão</label><input type="text" value={salonData.salon_name} onChange={e => setSalonData({...salonData, salon_name: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Endereço</label><input type="text" value={salonData.salon_address} onChange={e => setSalonData({...salonData, salon_address: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>Telefone</label><input type="text" value={salonData.salon_phone} onChange={e => setSalonData({...salonData, salon_phone: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>WhatsApp</label><input type="text" value={salonData.salon_whatsapp} onChange={e => setSalonData({...salonData, salon_whatsapp: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>Instagram</label><input type="text" value={salonData.salon_instagram} onChange={e => setSalonData({...salonData, salon_instagram: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>E-mail</label><input type="email" value={salonData.salon_email} onChange={e => setSalonData({...salonData, salon_email: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Horário de Funcionamento</label><input type="text" value={salonData.salon_hours} onChange={e => setSalonData({...salonData, salon_hours: e.target.value})} placeholder="Ex: Seg-Sex 9h-19h, Sáb 9h-17h" style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Sobre o Salão</label><textarea value={salonData.salon_about} onChange={e => setSalonData({...salonData, salon_about: e.target.value})} rows="4" style={{fontSize:'13px',padding:'6px 10px',width:'100%',fontFamily:'inherit',resize:'vertical'}} /></div>
          </div>
        );
      case 'anamnese':
        return (
          <div>
            <div className="form-group">
              <label>Perguntas da Anamnese Capilar</label>
              <p style={{fontSize:'12px',color:'#999',margin:'0 0 8px'}}>Defina as perguntas que aparecerão no formulário de anamnese. Cada linha é uma pergunta.</p>
              <textarea value={anamneseData.questions} onChange={e => setAnamneseData({...anamneseData, questions: e.target.value})} rows="12" placeholder="1. Histórico de tratamentos químicos recentes&#10;2. Alergias conhecidas&#10;3. Tipo de cabelo&#10;4. Couro cabeludo&#10;5. Problemas capilares" style={{fontSize:'13px',padding:'6px 10px',width:'100%',fontFamily:'inherit',resize:'vertical'}} />
            </div>
          </div>
        );
      case 'contrato':
        return (
          <div>
            <div className="form-group">
              <label>Termo de Consentimento / Contrato</label>
              <p style={{fontSize:'12px',color:'#999',margin:'0 0 8px'}}>Texto do contrato de prestação de serviços que o cliente assina.</p>
              <textarea value={contractData.contract_text} onChange={e => setContractData({...contractData, contract_text: e.target.value})} rows="15" placeholder="Escreva aqui o termo de consentimento e contrato de serviços..." style={{fontSize:'13px',padding:'6px 10px',width:'100%',fontFamily:'inherit',resize:'vertical'}} />
            </div>
          </div>
        );
      case 'comunicacao':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <h3 style={{fontSize:'15px',margin:0,gridColumn:'span 2',color:'#2c3e50'}}>WhatsApp</h3>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>API Key / Token</label><input type="text" value={commData.whatsapp_api_key} onChange={e => setCommData({...commData, whatsapp_api_key: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <h3 style={{fontSize:'15px',margin:0,gridColumn:'span 2',color:'#2c3e50'}}>SMS</h3>
            <div className="form-group"><label>Provedor</label><input type="text" value={commData.sms_provider} onChange={e => setCommData({...commData, sms_provider: e.target.value})} placeholder="Ex: Twilio" style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>API Key</label><input type="text" value={commData.sms_api_key} onChange={e => setCommData({...commData, sms_api_key: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <h3 style={{fontSize:'15px',margin:0,gridColumn:'span 2',color:'#2c3e50'}}>E-mail</h3>
            <div className="form-group"><label>Servidor SMTP</label><input type="text" value={commData.email_smtp} onChange={e => setCommData({...commData, email_smtp: e.target.value})} placeholder="smtp.gmail.com" style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>Usuário</label><input type="text" value={commData.email_user} onChange={e => setCommData({...commData, email_user: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
            <div className="form-group"><label>Senha</label><input type="password" value={commData.email_pass} onChange={e => setCommData({...commData, email_pass: e.target.value})} style={{fontSize:'13px',padding:'6px 10px',width:'100%'}} /></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setActiveSection(null)} className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeft size={16} /> Voltar</button>
        <h1 style={{ margin: 0 }}>{sections.find(s => s.key === activeSection)?.label}</h1>
      </div>

      {msg && <div style={{ padding: '10px 16px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>}

      {renderForm()}

      <div style={{ marginTop: '24px' }}>
        <button onClick={() => saveSection(activeSection, activeSection === 'salao' ? salonData : activeSection === 'anamnese' ? anamneseData : activeSection === 'contrato' ? contractData : commData)} className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
