import { useState, useEffect } from 'react';
import { Plus, Shield, Pencil, Trash2 } from 'lucide-react';

const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const roleOptions = [
  { value: 'admin', label: 'Administrador', desc: 'Acesso total ao sistema' },
  { value: 'manager', label: 'Gerente', desc: 'Gerencia clientes, agenda e financeiro' },
  { value: 'operator', label: 'Operador', desc: 'Opera agenda, PDV e clientes' },
  { value: 'viewer', label: 'Visualizador', desc: 'Apenas visualiza dados' },
];

export default function Permissions() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'operator' });
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getAuthHeader() });
      if (res.ok) setUsers(await res.json());
      else if (res.status === 403) setError('Acesso restrito a administradores');
    } catch (error) { console.error('Error fetching users:', error); }
    finally { setLoading(false); }
  };

  const openModal = (user = null) => {
    setError('');
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'operator' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingUser(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? { name: formData.name, email: formData.email, role: formData.role }
        : { name: formData.name, email: formData.email, password: formData.password, role: formData.role };
      if (editingUser && formData.password) body.password = formData.password;
      const res = await fetch(url, {
        method, headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) { fetchUsers(); closeModal(); }
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch (error) { setError('Erro ao conectar'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) fetchUsers();
      else { const data = await res.json(); alert(data.error || 'Erro ao excluir'); }
    } catch (error) { console.error('Error deleting user:', error); }
  };

  const getRoleBadge = (role) => {
    const colors = { admin: '#e3f2fd', manager: '#e8f5e9', operator: '#fff3e0', viewer: '#f5f5f5' };
    const textColors = { admin: '#1565c0', manager: '#2e7d32', operator: '#e65100', viewer: '#616161' };
    return { background: colors[role] || '#f5f5f5', color: textColors[role] || '#616161' };
  };

  if (loading) return <div style={{ padding: '24px', color: '#606060' }}>Carregando...</div>;
  if (error && users.length === 0) return <div style={{ padding: '24px', color: '#c62828' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 300, color: '#000', margin: 0 }}>Permissões</h1>
        <button onClick={() => openModal()} style={{
          display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#002cd6', color: '#fff',
          padding: '10px 20px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
        }}>
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase' }}>Nome</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase' }}>Função</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase' }}>Criado em</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', color: '#606060', fontWeight: 600, textTransform: 'uppercase' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const badge = getRoleBadge(user.role);
              const roleLabel = roleOptions.find(r => r.value === user.role)?.label || user.role;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={16} style={{ color: '#1565c0' }} />
                    </div>
                    {user.name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#606060' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...badge }}>{roleLabel}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#606060' }}>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => openModal(user)} style={{
                        padding: '6px 12px', background: '#e0e7ff', color: '#3730a3', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}><Pencil size={14} /> Editar</button>
                      <button onClick={() => handleDelete(user.id, user.name)} style={{
                        padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}><Trash2 size={14} /> Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '14px' }}>Nenhum usuário encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={closeModal}>
          <div style={{ backgroundColor: '#fff', borderRadius: '4px', padding: '24px', maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#000', margin: '0 0 24px' }}>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>
                  {editingUser ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
                </label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#606060', marginBottom: '8px' }}>Função *</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}>
                  {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label} - {r.desc}</option>)}
                </select>
              </div>
              {error && <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{
                  padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', cursor: 'pointer'
                }}>Cancelar</button>
                <button type="submit" style={{
                  padding: '10px 20px', background: '#002cd6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}>{editingUser ? 'Salvar' : 'Criar Usuário'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
