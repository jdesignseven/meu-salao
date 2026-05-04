const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Banco em memória
let users = [
  { id:1, name: 'Admin', email: 'admin@secvc.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { id:2, name: 'Elzito Junior', email: 'elzitojunior@outlook.com', password: bcrypt.hashSync('725609993', 10), role: 'admin' }
];

let clients = [
  { id: 1, name: 'Maria Silva', gender: 'F', birth_date: '1985-05-10', cpf: '111.222.333-44', rg: '1234567', phone: '(71) 99999-1111', email: 'maria@email.com', how_found: 'Instagram', holder_type: 'Titular', plan: 'Premium', cep: '40000-000', street: 'Rua das Flores', number: '123', complement: '', neighborhood: 'Centro', city: 'Salvador', state: 'BA', photo: '', notes: 'Cliente VIP', profession: 'Empresa XYZ', foreigner: false, app_access_code: 'MARIA2024', anamnese_capilar: '', services: [], financial: [], documents: [], created_at: new Date().toISOString() },
  { id: 2, name: 'João Santos', gender: 'M', birth_date: '1990-12-25', cpf: '222.333.444-55', rg: '2345678', phone: '(71) 98888-2222', email: 'joao@email.com', how_found: 'Indicação', holder_type: 'Titular', plan: 'Básico', cep: '40000-001', street: 'Av. Central', number: '456', complement: '', neighborhood: 'Centro', city: 'Salvador', state: 'BA', photo: '', notes: '', profession: '', foreigner: false, app_access_code: '', anamnese_capilar: '', services: [], financial: [], documents: [], created_at: new Date().toISOString() },
  { id: 3, name: 'Ana Costa', gender: 'F', birth_date: '1995-05-04', cpf: '333.444.555-66', rg: '3456789', phone: '(71) 97777-3333', email: 'ana@email.com', how_found: 'Google', holder_type: 'Dependente', plan: 'Premium', cep: '40000-002', street: 'Rua da Paz', number: '789', complement: '', neighborhood: 'Centro', city: 'Salvador', state: 'BA', photo: '', notes: 'Prefere horários pela manhã', profession: '', foreigner: false, app_access_code: '', anamnese_capilar: '', services: [], financial: [], documents: [], created_at: new Date().toISOString() }
];

let employees = [
  { id: 1, name: 'Ana Paula', phone: '(71) 96666-1111', email: 'ana.paula@salao.com', specialty: 'Cabelo,Colorção', commission_rate: 40, active: 1, created_at: new Date().toISOString() },
  { id: 2, name: 'Maria Clara', phone: '(71) 95555-2222', email: 'maria.clara@salao.com', specialty: 'Unhas,Sobrancelhas', commission_rate: 35, active: 1, created_at: new Date().toISOString() },
  { id: 3, name: 'Juliana', phone: '(71) 94444-3333', email: 'juliana@salao.com', specialty: 'Maquiagem,Cabelo', commission_rate: 45, active: 1, created_at: new Date().toISOString() },
  { id: 4, name: 'Carla', phone: '(71) 93333-4444', email: 'carla@salao.com', specialty: 'Cabelo,Hidratação', commission_rate: 38, active: 1, created_at: new Date().toISOString() }
];

let services = [
  { id: 1, name: 'Corte Feminino', description: 'Corte com finalização', price: 80, duration_minutes: 60, active: 1, created_at: new Date().toISOString() },
  { id: 2, name: 'Corte Masculino', description: 'Corte tradicional', price: 50, duration_minutes: 30, active: 1, created_at: new Date().toISOString() },
  { id: 3, name: 'Escova Progressiva', description: 'Tratamento progressivo', price: 150, duration_minutes: 120, active: 1, created_at: new Date().toISOString() },
  { id: 4, name: 'Coloração', description: 'Coloração completa', price: 120, duration_minutes: 90, active: 1, created_at: new Date().toISOString() },
  { id: 5, name: 'Hidratação Capilar', description: 'Tratamento hidratante', price: 70, duration_minutes: 40, active: 1, created_at: new Date().toISOString() },
  { id: 6, name: 'Manicure', description: 'Cuidado das unhas', price: 25, duration_minutes: 30, active: 1, created_at: new Date().toISOString() },
  { id: 7, name: 'Pedicure', description: 'Cuidado dos pés', price: 25, duration_minutes: 30, active: 1, created_at: new Date().toISOString() },
  { id: 8, name: 'Maquiagem', description: 'Maquiagem social', price: 100, duration_minutes: 60, active: 1, created_at: new Date().toISOString() },
  { id: 9, name: 'Design de Sobrancelhas', description: 'Modelagem de sobrancelhas', price: 35, duration_minutes: 20, active: 1, created_at: new Date().toISOString() }
];

let appointments = [
  { id: 1, client_id: 1, employee_id: 1, service_id: 1, date: getToday(), time: '10:00', status: 'atendido', notes: '', total_price: 80, created_at: new Date().toISOString(), commission_processed: false },
  { id: 2, client_id: 2, employee_id: 3, service_id: 4, date: getToday(), time: '14:00', status: 'concluido', notes: 'Cor intensa', total_price: 120, created_at: new Date().toISOString(), commission_processed: false },
  { id: 3, client_id: 3, employee_id: 2, service_id: 6, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '09:00', status: 'agendado', notes: '', total_price: 25, created_at: new Date().toISOString(), commission_processed: false }
];

let salonServices = [
  { id: 1, name: 'Corte Feminino', price: 80, duration: '60 min', category: 'Cabelo' },
  { id: 2, name: 'Corte Masculino', price: 50, duration: '30 min', category: 'Cabelo' },
  { id: 3, name: 'Escova Progressiva', price: 150, duration: '120 min', category: 'Cabelo' },
  { id: 4, name: 'Coloração', price: 120, duration: '90 min', category: 'Cabelo' },
  { id: 5, name: 'Hidratação Capilar', price: 70, duration: '40 min', category: 'Cabelo' },
  { id: 6, name: 'Manicure', price: 25, duration: '30 min', category: 'Unhas' },
  { id: 7, name: 'Pedicure', price: 25, duration: '30 min', category: 'Unhas' },
  { id: 8, name: 'Maquiagem', price: 100, duration: '60 min', category: 'Maquiagem' },
  { id: 9, name: 'Design de Sobrancelhas', price: 35, duration: '20 min', category: 'Sobrancelhas' }
];

let salonProfessionals = [
  { id: 1, name: 'Ana Paula', specialties: 'Cabelo,Colorção' },
  { id: 2, name: 'Maria Clara', specialties: 'Unhas,Sobrancelhas' },
  { id: 3, name: 'Juliana', specialties: 'Maquiagem,Cabelo' },
  { id: 4, name: 'Carla', specialties: 'Cabelo,Hidratação' }
];

let salonBookings = [
  { id: 1, clientName: 'Maria Silva', clientPhone: '(71) 99999-1111', serviceId: 1, professionalId: 1, date: new Date().toISOString().split('T')[0], time: '10:00', price: 80, status: 'pending' },
  { id: 2, clientName: 'Ana Costa', clientPhone: '(71) 97777-3333', serviceId: 4, professionalId: 3, date: new Date().toISOString().split('T')[0], time: '14:00', price: 120, status: 'pending' }
];

let products = [
  { id: 1, code: 'PROD-001', name: 'Shampoo Hidratante 500ml', description: 'Shampoo profissional para cabelos secos e danificados, com ação hidratante profunda', group: 'Shampoo', type: 'garrafa', cost: 22.50, sale_price: 45.00, unit: 'ml', stock: 15, min_stock: 5, photo: '', active: 1, created_at: new Date().toISOString() },
  { id: 2, code: 'PROD-002', name: 'Máscara de Hidratação 300g', description: 'Tratamento profundo com queratina e óleos essenciais', group: 'Tratamento', type: 'pote', cost: 30.00, sale_price: 65.00, unit: 'g', stock: 8, min_stock: 3, photo: '', active: 1, created_at: new Date().toISOString() },
  { id: 3, code: 'PROD-003', name: 'Tinta Profissional Louro Médio 7.0', description: 'Coloração permanente de alta performance, cobertura total dos brancos', group: 'Coloração', type: 'tubo', cost: 18.00, sale_price: 35.00, unit: 'ml', stock: 20, min_stock: 10, photo: '', active: 1, created_at: new Date().toISOString() },
  { id: 4, code: 'PROD-004', name: 'Óleo de Argan 60ml', description: 'Finalizador e reparador de pontas com argan puro', group: 'Finalização', type: 'bisnaga', cost: 25.00, sale_price: 55.00, unit: 'ml', stock: 12, min_stock: 5, photo: '', active: 1, created_at: new Date().toISOString() },
  { id: 5, code: 'PROD-005', name: 'Kit Manicure Profissional', description: 'Kit com alicate, espátula e cortador de unha', group: 'Acessórios', type: 'caixa', cost: 35.00, sale_price: 89.00, unit: 'un', stock: 6, min_stock: 3, photo: '', active: 1, created_at: new Date().toISOString() }
];

let stockMovements = [
  { id: 1, product_id: 1, type: 'entrada', quantity: 20, date: '2024-01-15', reason: 'Compra fornecedor', user: 'Admin' },
  { id: 2, product_id: 1, type: 'saida', quantity: 5, date: '2024-02-20', reason: 'Venda no caixa', user: 'Admin' },
  { id: 3, product_id: 3, type: 'entrada', quantity: 25, date: '2024-02-01', reason: 'Compra fornecedor', user: 'Admin' },
  { id: 4, product_id: 3, type: 'saida', quantity: 5, date: '2024-03-10', reason: 'Uso em serviço', user: 'Admin' }
];

let financialCategories = [
  { id: 1, name: 'Serviços', type: 'receita', icon: '✂️', color: '#27ae60', active: 1 },
  { id: 2, name: 'Venda de Produtos', type: 'receita', icon: '📦', color: '#2ecc71', active: 1 },
  { id: 3, name: 'Aluguel', type: 'despesa', icon: '🏠', color: '#e74c3c', active: 1 },
  { id: 4, name: 'Produtos (Compra)', type: 'despesa', icon: '🛒', color: '#c0392b', active: 1 },
  { id: 5, name: 'Salários/Comissões', type: 'despesa', icon: '💵', color: '#e67e22', active: 1 },
  { id: 6, name: 'Conta de Luz', type: 'despesa', icon: '💡', color: '#f39c12', active: 1 },
  { id: 7, name: 'Conta de Água', type: 'despesa', icon: '💧', color: '#3498db', active: 1 },
  { id: 8, name: 'Internet/Telefone', type: 'despesa', icon: '📱', color: '#9b59b6', active: 1 },
  { id: 9, name: 'Material de Limpeza', type: 'despesa', icon: '🧹', color: '#1abc9c', active: 1 },
  { id: 10, name: 'Marketing', type: 'despesa', icon: '📢', color: '#2980b9', active: 1 },
  { id: 11, name: 'Outras Receitas', type: 'receita', icon: '💰', color: '#16a085', active: 1 },
  { id: 12, name: 'Outras Despesas', type: 'despesa', icon: '📝', color: '#d35400', active: 1 }
];

let financialAccounts = [
  { id: 1, name: 'Caixa', type: 'dinheiro', balance: 5000.00, active: 1 },
  { id: 2, name: 'Banco Itaú - CC 12345', type: 'banco', balance: 12500.00, active: 1 },
  { id: 3, name: 'PIX', type: 'digital', balance: 3200.00, active: 1 },
  { id: 4, name: 'Maquininha Cartão', type: 'cartao', balance: 8500.00, active: 1 }
];

let paymentMethods = [
  { id: 1, name: 'Dinheiro', type: 'dinheiro', icon: '💵', active: 1 },
  { id: 2, name: 'PIX', type: 'digital', icon: '📱', active: 1 },
  { id: 3, name: 'Cartão Débito', type: 'cartao', icon: '💳', active: 1 },
  { id: 4, name: 'Cartão Crédito', type: 'cartao', icon: '💳', active: 1 },
  { id: 5, name: 'Cartão Crédito (Parcelado)', type: 'parcelado', icon: '💳', active: 1, max_installments: 12 },
  { id: 6, name: 'Boleto', type: 'boleto', icon: '📄', active: 1 },
  { id: 7, name: 'Crédito do Cliente', type: 'credito', icon: '🔵', active: 1 },
  { id: 8, name: 'Transferência', type: 'digital', icon: '🏦', active: 1 }
];

let commissions = [];

let cashRegisters = [
  { id: 1, opened_at: `${getToday()} 08:00:00`, closed_at: null, initial_amount: 500.00, final_amount: null, status: 'aberto', notes: 'Turno manhã', user: 'Admin' },
  { id: 2, opened_at: `${new Date(Date.now() - 86400000).toISOString().split('T')[0]} 08:00:00`, closed_at: `${new Date(Date.now() - 86400000).toISOString().split('T')[0]} 18:00:00`, initial_amount: 500.00, final_amount: 1850.00, status: 'fechado', notes: 'Turno manhã', user: 'Admin' }
];

let cashTransactions = [
  { id: 1, register_id: 1, type: 'venda', description: 'Corte Feminino - Maria Silva', client_id: 1, items: [{type: 'servico', name: 'Corte Feminino', price: 80.00, qty: 1}], subtotal: 80.00, discount: 0.00, total: 80.00, payment_method_id: 1, payment_method_name: 'Dinheiro', status: 'finalizado', created_at: `${getToday()} 10:15:00`, user: 'Admin' },
  { id: 2, register_id: 1, type: 'suprimento', description: 'Reforço de troco', items: [], subtotal: 0.00, discount: 0.00, total: 200.00, payment_method_id: 1, payment_method_name: 'Dinheiro', status: 'finalizado', created_at: `${getToday()} 08:30:00`, user: 'Admin' },
  { id: 3, register_id: 1, type: 'sangria', description: 'Pagamento conta de luz', items: [], subtotal: 0.00, discount: 0.00, total: 150.00, payment_method_id: 1, payment_method_name: 'Dinheiro', status: 'finalizado', created_at: `${getToday()} 12:00:00`, user: 'Admin' },
  { id: 4, register_id: 1, type: 'venda', description: 'Shampoo + Corte - João Santos', client_id: 2, items: [{type: 'servico', name: 'Corte Masculino', price: 50.00, qty: 1}, {type: 'produto', name: 'Shampoo Hidratante', price: 45.00, qty: 1}], subtotal: 95.00, discount: 5.00, total: 90.00, payment_method_id: 2, payment_method_name: 'PIX', status: 'finalizado', created_at: `${getToday()} 11:30:00`, user: 'Admin' }
];

let financialTransactions = [
  { id: 1, code: 'FIN-001', type: 'receita', category_id: 1, account_id: 1, payment_method_id: 1, client_id: 1, appointment_id: 1, description: 'Corte Feminino - Maria Silva', amount: 80.00, installments: 1, due_date: new Date().toISOString().split('T')[0], paid_date: new Date().toISOString().split('T')[0], status: 'pago', notes: '', created_at: new Date().toISOString() },
  { id: 2, code: 'FIN-002', type: 'receita', category_id: 1, account_id: 3, payment_method_id: 2, client_id: 2, appointment_id: 2, description: 'Coloração - João Santos', amount: 120.00, installments: 1, due_date: new Date().toISOString().split('T')[0], paid_date: null, status: 'pendente', notes: '', created_at: new Date().toISOString() },
  { id: 3, code: 'FIN-003', type: 'despesa', category_id: 3, account_id: 2, payment_method_id: 6, client_id: null, appointment_id: null, description: 'Aluguel do salão - Maio', amount: 3500.00, installments: 1, due_date: '2024-05-10', paid_date: null, status: 'pendente', notes: 'Vencimento dia 10', created_at: new Date().toISOString() },
  { id: 4, code: 'FIN-004', type: 'despesa', category_id: 4, account_id: 2, payment_method_id: 3, client_id: null, appointment_id: null, description: 'Compra de produtos - Distribuidora XYZ', amount: 850.00, installments: 1, due_date: new Date().toISOString().split('T')[0], paid_date: new Date().toISOString().split('T')[0], status: 'pago', notes: '', created_at: new Date().toISOString() },
  { id: 5, code: 'FIN-005', type: 'despesa', category_id: 5, account_id: 1, payment_method_id: 1, client_id: null, appointment_id: null, description: 'Comissão Ana Paula - Semana', amount: 450.00, installments: 1, due_date: new Date().toISOString().split('T')[0], paid_date: new Date().toISOString().split('T')[0], status: 'pago', notes: '', created_at: new Date().toISOString() },
  { id: 6, code: 'FIN-006', type: 'despesa', category_id: 6, account_id: 2, payment_method_id: 8, client_id: null, appointment_id: null, description: 'Conta de Luz', amount: 280.00, installments: 1, due_date: '2024-05-15', paid_date: null, status: 'pendente', notes: '', created_at: new Date().toISOString() },
  { id: 7, code: 'FIN-007', type: 'receita', category_id: 2, account_id: 4, payment_method_id: 3, client_id: 1, appointment_id: null, description: 'Venda Shampoo Hidratante', amount: 45.00, installments: 1, due_date: new Date().toISOString().split('T')[0], paid_date: new Date().toISOString().split('T')[0], status: 'pago', notes: '', created_at: new Date().toISOString() },
  { id: 8, code: 'FIN-008', type: 'receita', category_id: 1, account_id: 4, payment_method_id: 5, client_id: 3, appointment_id: 3, description: 'Manicure - Ana Costa (2x)', amount: 25.00, installments: 2, due_date: new Date().toISOString().split('T')[0], paid_date: null, status: 'parcial', notes: 'Parcela 1/2', created_at: new Date().toISOString() },
  { id: 9, code: 'FIN-009', type: 'despesa', category_id: 10, account_id: 2, payment_method_id: 2, client_id: null, appointment_id: null, description: 'Anúncio Instagram', amount: 150.00, installments: 1, due_date: '2024-05-20', paid_date: null, status: 'pendente', notes: '', created_at: new Date().toISOString() },
  { id: 10, code: 'FIN-010', type: 'despesa', category_id: 7, account_id: 2, payment_method_id: 8, client_id: null, appointment_id: null, description: 'Conta de Água', amount: 120.00, installments: 1, due_date: '2024-05-18', paid_date: null, status: 'pendente', notes: '', created_at: new Date().toISOString() }
];

// Helpers
function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }
function getToday() { return new Date().toISOString().split('T')[0]; }
function getMonth() { return new Date().toISOString().substring(0, 7); }

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ==================== AUTH ====================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email já cadastrado' });
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = { id: nextId(users), name, email, password: hashedPassword, role: 'user' };
  users.push(user);
  const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name, email, role: 'user' }, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

// ==================== CLIENTS ====================
app.get('/api/clients', authMiddleware, (req, res) => {
  const { search } = req.query;
  let result = clients;
  if (search) {
    const s = search.toLowerCase();
    result = clients.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.email && c.email.toLowerCase().includes(s)) ||
      (c.phone && c.phone.includes(s)) ||
      (c.cpf && c.cpf.includes(s))
    );
  }
  res.json(result.sort((a,b) => a.name.localeCompare(b.name)));
});

app.post('/api/clients', authMiddleware, (req, res) => {
  const { name, gender, birth_date, cpf, rg, phone, landline, email, how_found, holder_type, plan, cep, street, number, complement, neighborhood, city, state, photo, notes, responsible_name, responsible_birth_date, responsible_cpf, responsible_phone, profession, foreigner, app_access_code, anamnese_capilar, services, financial, documents } = req.body;
  const client = {
    id: nextId(clients),
    name, gender: gender || '', birth_date: birth_date || '', cpf: cpf || '', rg: rg || '',
    phone: phone || '', landline: landline || '', email: email || '', how_found: how_found || '',
    holder_type: holder_type || 'Titular', plan: plan || '', cep: cep || '', street: street || '',
    number: number || '', complement: complement || '', neighborhood: neighborhood || '',
    city: city || '', state: state || '', photo: photo || '', notes: notes || '',
    responsible_name: responsible_name || '', responsible_birth_date: responsible_birth_date || '',
    responsible_cpf: responsible_cpf || '', responsible_phone: responsible_phone || '',
    profession: profession || '', foreigner: foreigner || false, app_access_code: app_access_code || '',
    anamnese_capilar: anamnese_capilar || '', services: services || [], financial: financial || [], documents: documents || [],
    created_at: new Date().toISOString()
  };
  clients.push(client);
  res.json(client);
});

app.put('/api/clients/:id', authMiddleware, (req, res) => {
  const { name, gender, birth_date, cpf, rg, phone, landline, email, how_found, holder_type, plan, cep, street, number, complement, neighborhood, city, state, photo, notes, responsible_name, responsible_birth_date, responsible_cpf, responsible_phone, profession, foreigner, app_access_code, anamnese_capilar, services, financial, documents } = req.body;
  const idx = clients.findIndex(c => c.id === parseInt(req.params.id));
  if (idx >= 0) {
    clients[idx] = {
      ...clients[idx],
      name, gender: gender || '', birth_date: birth_date || '', cpf: cpf || '', rg: rg || '',
      phone: phone || '', landline: landline || '', email: email || '', how_found: how_found || '',
      holder_type: holder_type || 'Titular', plan: plan || '', cep: cep || '', street: street || '',
      number: number || '', complement: complement || '', neighborhood: neighborhood || '',
      city: city || '', state: state || '', photo: photo || '', notes: notes || '',
      responsible_name: responsible_name || '', responsible_birth_date: responsible_birth_date || '',
      responsible_cpf: responsible_cpf || '', responsible_phone: responsible_phone || '',
      profession: profession || '', foreigner: foreigner || false, app_access_code: app_access_code || '',
      anamnese_capilar: anamnese_capilar || '', services: services || [], financial: financial || [], documents: documents || []
    };
  }
  res.json({ success: true });
});

app.delete('/api/clients/:id', authMiddleware, (req, res) => {
  clients = clients.filter(c => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== EMPLOYEES ====================
app.get('/api/employees', authMiddleware, (req, res) => {
  const { active } = req.query;
  let result = employees;
  if (active === '1') result = employees.filter(e => e.active === 1);
  res.json(result.sort((a,b) => a.name.localeCompare(b.name)));
});

app.post('/api/employees', authMiddleware, (req, res) => {
  const { name, phone, email, specialty, commission_rate, active } = req.body;
  const emp = { id: nextId(employees), name, phone: phone || '', email: email || '', specialty: specialty || '', commission_rate: commission_rate || 0, active: active !== undefined ? active : 1, created_at: new Date().toISOString() };
  employees.push(emp);
  res.json(emp);
});

app.put('/api/employees/:id', authMiddleware, (req, res) => {
  const { name, phone, email, specialty, commission_rate, active } = req.body;
  const idx = employees.findIndex(e => e.id === parseInt(req.params.id));
  if (idx >= 0) {
    employees[idx] = { ...employees[idx], name, phone: phone || '', email: email || '', specialty: specialty || '', commission_rate: commission_rate || 0, active };
  }
  res.json({ success: true });
});

app.delete('/api/employees/:id', authMiddleware, (req, res) => {
  employees = employees.filter(e => e.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== SERVICES ====================
app.get('/api/services', authMiddleware, (req, res) => {
  const { active } = req.query;
  let result = services;
  if (active === '1') result = services.filter(s => s.active === 1);
  res.json(result.sort((a,b) => a.name.localeCompare(b.name)));
});

app.post('/api/services', authMiddleware, (req, res) => {
  const { name, description, price, duration_minutes, active } = req.body;
  const svc = { id: nextId(services), name, description: description || '', price: parseFloat(price), duration_minutes: parseInt(duration_minutes) || 30, active: active !== undefined ? active : 1, created_at: new Date().toISOString() };
  services.push(svc);
  res.json(svc);
});

app.put('/api/services/:id', authMiddleware, (req, res) => {
  const { name, description, price, duration_minutes, active } = req.body;
  const idx = services.findIndex(s => s.id === parseInt(req.params.id));
  if (idx >= 0) {
    services[idx] = { ...services[idx], name, description: description || '', price: parseFloat(price), duration_minutes: parseInt(duration_minutes) || 30, active };
  }
  res.json({ success: true });
});

app.delete('/api/services/:id', authMiddleware, (req, res) => {
  services = services.filter(s => s.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== PRODUCTS ====================
app.get('/api/products', authMiddleware, (req, res) => {
  const { search, group, active, low_stock } = req.query;
  let result = products;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(s) || (p.code && p.code.toLowerCase().includes(s)) || (p.description && p.description.toLowerCase().includes(s)));
  }
  if (group) result = result.filter(p => p.group === group);
  if (active === '1') result = result.filter(p => p.active === 1);
  if (low_stock === '1') result = result.filter(p => p.stock <= p.min_stock);
  res.json(result.sort((a,b) => a.name.localeCompare(b.name)));
});

app.get('/api/products/groups', authMiddleware, (req, res) => {
  const groups = [...new Set(products.map(p => p.group).filter(Boolean))].sort();
  res.json(groups);
});

app.get('/api/products/low-stock', authMiddleware, (req, res) => {
  const lowStock = products.filter(p => p.stock <= p.min_stock && p.active === 1);
  res.json(lowStock);
});

app.post('/api/products', authMiddleware, (req, res) => {
  const { name, description, group, type, cost, sale_price, unit, stock, min_stock, photo, active } = req.body;
  const nextCode = `PROD-${String(nextId(products)).padStart(3, '0')}`;
  const product = {
    id: nextId(products),
    code: nextCode,
    name, description: description || '', group: group || '', type: type || 'outro',
    cost: parseFloat(cost) || 0, sale_price: parseFloat(sale_price) || 0,
    unit: unit || 'un', stock: parseInt(stock) || 0, min_stock: parseInt(min_stock) || 0,
    photo: photo || '', active: active !== undefined ? active : 1,
    created_at: new Date().toISOString()
  };
  products.push(product);
  res.json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const { name, description, group, type, cost, sale_price, unit, min_stock, photo, active } = req.body;
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx >= 0) {
    products[idx] = {
      ...products[idx],
      name, description: description || '', group: group || '', type: type || 'outro',
      cost: parseFloat(cost), sale_price: parseFloat(sale_price),
      unit: unit || 'un', min_stock: parseInt(min_stock),
      photo: photo || '', active
    };
  }
  res.json({ success: true });
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  products = products.filter(p => p.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.patch('/api/products/:id/stock', authMiddleware, (req, res) => {
  const { type, quantity, reason, user } = req.body;
  const idx = products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ error: 'Produto não encontrado' });
  const qty = parseInt(quantity);
  if (type === 'entrada') {
    products[idx].stock += qty;
  } else if (type === 'saida') {
    if (products[idx].stock < qty) return res.status(400).json({ error: 'Estoque insuficiente' });
    products[idx].stock -= qty;
  }
  stockMovements.push({ id: nextId(stockMovements), product_id: parseInt(req.params.id), type, quantity: qty, date: new Date().toISOString().split('T')[0], reason: reason || '', user: user || 'Admin' });
  res.json({ success: true, newStock: products[idx].stock });
});

app.get('/api/products/:id/stock-movements', authMiddleware, (req, res) => {
  const movements = stockMovements.filter(m => m.product_id === parseInt(req.params.id)).sort((a,b) => new Date(b.date) - new Date(a.date));
  res.json(movements);
});

// ==================== APPOINTMENTS ====================
app.get('/api/appointments', authMiddleware, (req, res) => {
  const { date, status } = req.query;
  let result = appointments.map(a => {
    const client = clients.find(c => c.id === a.client_id);
    const employee = employees.find(e => e.id === a.employee_id);
    const service = services.find(s => s.id === a.service_id);
    return {
      ...a,
      client_name: client ? client.name : 'N/A',
      employee_name: employee ? employee.name : 'N/A',
      service_name: service ? service.name : 'N/A',
      service_price: service ? service.price : 0
    };
  });
  
  if (date) result = result.filter(a => a.date === date);
  if (status) result = result.filter(a => a.status === status);
  
  result.sort((a,b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
  res.json(result);
});

app.post('/api/appointments', authMiddleware, (req, res) => {
  const { client_id, employee_id, service_id, date, time, notes } = req.body;
  const service = services.find(s => s.id === parseInt(service_id));
  const total_price = service ? service.price : 0;
  const apt = { id: nextId(appointments), client_id: parseInt(client_id), employee_id: parseInt(employee_id), service_id: parseInt(service_id), date, time, status: 'scheduled', notes: notes || '', total_price, created_at: new Date().toISOString() };
  appointments.push(apt);
  res.json(apt);
});

app.put('/api/appointments/:id', authMiddleware, (req, res) => {
  const idx = appointments.findIndex(a => a.id === parseInt(req.params.id));
  if (idx >= 0) {
    const existing = appointments[idx];
    appointments[idx] = {
      ...existing,
      client_id: req.body.client_id !== undefined ? parseInt(req.body.client_id) : existing.client_id,
      employee_id: req.body.employee_id !== undefined ? parseInt(req.body.employee_id) : existing.employee_id,
      service_id: req.body.service_id !== undefined ? parseInt(req.body.service_id) : existing.service_id,
      date: req.body.date || existing.date,
      time: req.body.time || existing.time,
      notes: req.body.notes !== undefined ? req.body.notes : existing.notes,
      status: req.body.status || existing.status
    };
  }
  res.json({ success: true });
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  appointments = appointments.filter(a => a.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard/overview', authMiddleware, (req, res) => {
  const today = getToday();
  const month = getMonth();
  const todayFormatted = new Date().toLocaleDateString('pt-BR').substring(0, 5);
  
  const todayAppointments = appointments.filter(a => a.date === today).map(a => {
    const client = clients.find(c => c.id === a.client_id);
    const employee = employees.find(e => e.id === a.employee_id);
    const service = services.find(s => s.id === a.service_id);
    return {
      ...a,
      client_name: client ? client.name : 'N/A',
      employee_name: employee ? employee.name : 'N/A',
      service_name: service ? service.name : 'N/A'
    };
  }).sort((a,b) => a.time.localeCompare(b.time));
  
  const monthRevenue = appointments
    .filter(a => a.date.startsWith(month) && (a.status === 'atendido' || a.status === 'concluido'))
    .reduce((sum, a) => sum + (a.total_price || 0), 0);
  
  const pendingAppointments = appointments.filter(a => a.status === 'agendado' || a.status === 'confirmado').length;
  
  const todayBirthdays = clients.filter(c => c.birthday === todayFormatted);
  
  const openBalance = appointments
    .filter(a => a.status === 'agendado' || a.status === 'confirmado' || a.status === 'espera')
    .reduce((sum, a) => sum + (a.total_price || 0), 0);
  
  const monthSales = appointments
    .filter(a => a.date.startsWith(month))
    .reduce((sum, a) => sum + (a.total_price || 0), 0);
  
  const partialPaid = appointments
    .filter(a => a.status === 'atendendo')
    .reduce((sum, a) => sum + (a.total_price || 0), 0);
  
  const monthAppointments = appointments.filter(a => a.date.startsWith(month)).length;
  
  res.json({
    totalClients: clients.length,
    totalEmployees: employees.filter(e => e.active === 1).length,
    totalServices: services.filter(s => s.active === 1).length,
    todayAppointments,
    monthRevenue,
    pendingAppointments,
    todayBirthdays,
    openBalance,
    monthSales,
    partialPaid,
    monthAppointments,
    totalAppointments: appointments.length
  });
});

// ==================== FINANCIAL ====================
app.get('/api/financial/transactions', authMiddleware, (req, res) => {
  const { type, category_id, account_id, status, payment_method_id, date_from, date_to, search } = req.query;
  let result = financialTransactions.map(t => {
    const category = financialCategories.find(c => c.id === t.category_id);
    const account = financialAccounts.find(a => a.id === t.account_id);
    const pm = paymentMethods.find(p => p.id === t.payment_method_id);
    const client = clients.find(c => c.id === t.client_id);
    return { ...t, category_name: category ? category.name : '', account_name: account ? account.name : '', payment_method_name: pm ? pm.name : '', client_name: client ? client.name : '' };
  });
  if (type) result = result.filter(t => t.type === type);
  if (category_id) result = result.filter(t => t.category_id === parseInt(category_id));
  if (account_id) result = result.filter(t => t.account_id === parseInt(account_id));
  if (status) result = result.filter(t => t.status === status);
  if (payment_method_id) result = result.filter(t => t.payment_method_id === parseInt(payment_method_id));
  if (date_from) result = result.filter(t => t.due_date >= date_from);
  if (date_to) result = result.filter(t => t.due_date <= date_to);
  if (search) { const s = search.toLowerCase(); result = result.filter(t => (t.description && t.description.toLowerCase().includes(s)) || (t.code && t.code.toLowerCase().includes(s))); }
  res.json(result.sort((a, b) => new Date(b.due_date) - new Date(a.due_date)));
});

app.get('/api/financial/transactions/overdue', authMiddleware, (req, res) => {
  const today = getToday();
  const overdue = financialTransactions.filter(t => t.due_date < today && t.status === 'pendente').map(t => {
    const category = financialCategories.find(c => c.id === t.category_id);
    return { ...t, category_name: category ? category.name : '' };
  });
  res.json(overdue);
});

app.get('/api/financial/transactions/upcoming', authMiddleware, (req, res) => {
  const today = getToday();
  const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const upcoming = financialTransactions.filter(t => t.due_date >= today && t.due_date <= future && t.status === 'pendente').map(t => {
    const category = financialCategories.find(c => c.id === t.category_id);
    return { ...t, category_name: category ? category.name : '' };
  });
  res.json(upcoming);
});

app.post('/api/financial/transactions', authMiddleware, (req, res) => {
  const { type, category_id, account_id, payment_method_id, client_id, appointment_id, description, amount, installments, due_date, status, notes } = req.body;
  const code = `FIN-${String(nextId(financialTransactions)).padStart(3, '0')}`;
  const transaction = {
    id: nextId(financialTransactions), code,
    type: type || 'receita', category_id: parseInt(category_id), account_id: parseInt(account_id),
    payment_method_id: parseInt(payment_method_id), client_id: client_id ? parseInt(client_id) : null,
    appointment_id: appointment_id ? parseInt(appointment_id) : null,
    description: description || '', amount: parseFloat(amount), installments: installments ? parseInt(installments) : 1,
    due_date: due_date || getToday(), paid_date: status === 'pago' ? getToday() : null,
    status: status || 'pendente', notes: notes || '', created_at: new Date().toISOString()
  };
  financialTransactions.push(transaction);
  res.json(transaction);
});

app.put('/api/financial/transactions/:id', authMiddleware, (req, res) => {
  const idx = financialTransactions.findIndex(t => t.id === parseInt(req.params.id));
  if (idx >= 0) {
    const existing = financialTransactions[idx];
    financialTransactions[idx] = {
      ...existing,
      type: req.body.type || existing.type,
      category_id: req.body.category_id !== undefined ? parseInt(req.body.category_id) : existing.category_id,
      account_id: req.body.account_id !== undefined ? parseInt(req.body.account_id) : existing.account_id,
      payment_method_id: req.body.payment_method_id !== undefined ? parseInt(req.body.payment_method_id) : existing.payment_method_id,
      client_id: req.body.client_id !== undefined ? (req.body.client_id ? parseInt(req.body.client_id) : null) : existing.client_id,
      appointment_id: req.body.appointment_id !== undefined ? (req.body.appointment_id ? parseInt(req.body.appointment_id) : null) : existing.appointment_id,
      description: req.body.description !== undefined ? req.body.description : existing.description,
      amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : existing.amount,
      installments: req.body.installments !== undefined ? parseInt(req.body.installments) : existing.installments,
      due_date: req.body.due_date || existing.due_date,
      status: req.body.status !== undefined ? req.body.status : existing.status,
      paid_date: req.body.status === 'pago' ? getToday() : (req.body.paid_date !== undefined ? req.body.paid_date : existing.paid_date),
      notes: req.body.notes !== undefined ? req.body.notes : existing.notes
    };
  }
  res.json({ success: true });
});

app.delete('/api/financial/transactions/:id', authMiddleware, (req, res) => {
  financialTransactions = financialTransactions.filter(t => t.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.patch('/api/financial/transactions/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const idx = financialTransactions.findIndex(t => t.id === parseInt(req.params.id));
  if (idx >= 0) {
    financialTransactions[idx].status = status;
    if (status === 'pago') financialTransactions[idx].paid_date = getToday();
    else if (status === 'pendente') financialTransactions[idx].paid_date = null;
  }
  res.json({ success: true });
});

app.get('/api/financial/categories', authMiddleware, (req, res) => {
  const { type } = req.query;
  let result = financialCategories.filter(c => c.active === 1);
  if (type) result = result.filter(c => c.type === type);
  res.json(result.sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/financial/categories', authMiddleware, (req, res) => {
  const { name, type, icon, color, active } = req.body;
  const category = { id: nextId(financialCategories), name, type: type || 'despesa', icon: icon || '📝', color: color || '#999', active: active !== undefined ? active : 1 };
  financialCategories.push(category);
  res.json(category);
});

app.put('/api/financial/categories/:id', authMiddleware, (req, res) => {
  const { name, type, icon, color, active } = req.body;
  const idx = financialCategories.findIndex(c => c.id === parseInt(req.params.id));
  if (idx >= 0) financialCategories[idx] = { ...financialCategories[idx], name, type, icon, color, active };
  res.json({ success: true });
});

app.delete('/api/financial/categories/:id', authMiddleware, (req, res) => {
  financialCategories = financialCategories.filter(c => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/accounts', authMiddleware, (req, res) => {
  const { active } = req.query;
  let result = financialAccounts;
  if (active === '1') result = result.filter(a => a.active === 1);
  res.json(result.sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/financial/accounts', authMiddleware, (req, res) => {
  const { name, type, balance, active } = req.body;
  const account = { id: nextId(financialAccounts), name, type: type || 'dinheiro', balance: parseFloat(balance) || 0, active: active !== undefined ? active : 1 };
  financialAccounts.push(account);
  res.json(account);
});

app.put('/api/financial/accounts/:id', authMiddleware, (req, res) => {
  const { name, type, balance, active } = req.body;
  const idx = financialAccounts.findIndex(a => a.id === parseInt(req.params.id));
  if (idx >= 0) financialAccounts[idx] = { ...financialAccounts[idx], name, type, balance: parseFloat(balance), active };
  res.json({ success: true });
});

app.delete('/api/financial/accounts/:id', authMiddleware, (req, res) => {
  financialAccounts = financialAccounts.filter(a => a.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/payment-methods', authMiddleware, (req, res) => {
  res.json(paymentMethods.filter(p => p.active === 1).sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/financial/payment-methods', authMiddleware, (req, res) => {
  const { name, type, icon, max_installments, active } = req.body;
  const pm = { id: nextId(paymentMethods), name, type, icon: icon || '💰', max_installments: max_installments || 1, active: active !== undefined ? active : 1 };
  paymentMethods.push(pm);
  res.json(pm);
});

app.put('/api/financial/payment-methods/:id', authMiddleware, (req, res) => {
  const { name, type, icon, max_installments, active } = req.body;
  const idx = paymentMethods.findIndex(p => p.id === parseInt(req.params.id));
  if (idx >= 0) paymentMethods[idx] = { ...paymentMethods[idx], name, type, icon, max_installments: max_installments || 1, active };
  res.json({ success: true });
});

app.delete('/api/financial/payment-methods/:id', authMiddleware, (req, res) => {
  paymentMethods = paymentMethods.filter(p => p.id !== parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/summary', authMiddleware, (req, res) => {
  const { month } = req.query;
  const targetMonth = month || getMonth();
  const monthTransactions = financialTransactions.filter(t => t.due_date.startsWith(targetMonth));
  const totalReceitas = monthTransactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const totalDespesas = monthTransactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const receitasPagas = monthTransactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const despesasPagas = monthTransactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const receitasPendentes = monthTransactions.filter(t => t.type === 'receita' && t.status === 'pendente').reduce((s, t) => s + t.amount, 0);
  const despesasPendentes = monthTransactions.filter(t => t.type === 'despesa' && t.status === 'pendente').reduce((s, t) => s + t.amount, 0);
  const saldo = receitasPagas - despesasPagas;
  const totalAccounts = financialAccounts.filter(a => a.active === 1).reduce((s, a) => s + a.balance, 0);
  const overdueCount = financialTransactions.filter(t => t.due_date < getToday() && t.status === 'pendente').length;
  const byCategory = financialCategories.map(cat => {
    const catTransactions = monthTransactions.filter(t => t.category_id === cat.id && t.status === 'pago');
    return { id: cat.id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, total: catTransactions.reduce((s, t) => s + t.amount, 0), count: catTransactions.length };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const dailyFlow = [];
  const daysInMonth = new Date(parseInt(targetMonth.split('-')[0]), parseInt(targetMonth.split('-')[1]), 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${targetMonth}-${String(d).padStart(2, '0')}`;
    const dayTx = monthTransactions.filter(t => t.due_date === dayStr && t.status === 'pago');
    const entrada = dayTx.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
    const saida = dayTx.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
    dailyFlow.push({ date: dayStr, entrada, saida, saldo: entrada - saida });
  }
  res.json({ totalReceitas, totalDespesas, receitasPagas, despesasPagas, receitasPendentes, despesasPendentes, saldo, totalAccounts, overdueCount, byCategory, dailyFlow, month: targetMonth });
});

app.get('/api/financial/accounts-summary', authMiddleware, (req, res) => {
  const accounts = financialAccounts.filter(a => a.active === 1).map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance }));
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  res.json({ accounts, total });
});

// ==================== COMMISSIONS ====================
function syncCommissions() {
  let created = 0;
  appointments.forEach(apt => {
    if ((apt.status === 'atendido' || apt.status === 'concluido') && !apt.commission_processed) {
      const emp = employees.find(e => e.id === apt.employee_id);
      const svc = services.find(s => s.id === apt.service_id);
      if (emp && svc) {
        const rate = emp.commission_rate || 0;
        const commissionValue = (svc.price * rate) / 100;
        commissions.push({
          id: nextId(commissions),
          employee_id: emp.id,
          employee_name: emp.name,
          appointment_id: apt.id,
          service_name: svc.name,
          client_name: clients.find(c => c.id === apt.client_id)?.name || 'N/A',
          service_price: svc.price,
          commission_rate: rate,
          commission_value: commissionValue,
          date: apt.date,
          status: 'pendente',
          created_at: new Date().toISOString()
        });
        apt.commission_processed = true;
        created++;
      }
    }
  });
  return created;
}

app.post('/api/commissions/sync', authMiddleware, (req, res) => {
  const created = syncCommissions();
  res.json({ success: true, created });
});

app.get('/api/commissions', authMiddleware, (req, res) => {
  const { employee_id, month, status } = req.query;
  let result = commissions;
  if (employee_id) result = result.filter(c => c.employee_id === parseInt(employee_id));
  if (month) result = result.filter(c => c.date.startsWith(month));
  if (status) result = result.filter(c => c.status === status);
  res.json(result.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/commissions/summary', authMiddleware, (req, res) => {
  const { month } = req.query;
  const targetMonth = month || getMonth();
  
  const summary = employees.filter(e => e.active === 1).map(emp => {
    const empsCommissions = commissions.filter(c => c.employee_id === emp.id && c.date.startsWith(targetMonth));
    const totalServices = empsCommissions.length;
    const totalSales = empsCommissions.reduce((s, c) => s + c.service_price, 0);
    const pendingValue = empsCommissions.filter(c => c.status === 'pendente').reduce((s, c) => s + c.commission_value, 0);
    const paidValue = empsCommissions.filter(c => c.status === 'pago').reduce((s, c) => s + c.commission_value, 0);
    return {
      id: emp.id,
      name: emp.name,
      commission_rate: emp.commission_rate,
      photo: emp.photo || '',
      totalServices,
      totalSales,
      pendingValue,
      paidValue,
      totalValue: pendingValue + paidValue
    };
  }).filter(e => e.totalServices > 0);
  
  res.json(summary);
});

app.post('/api/commissions/:employee_id/pay', authMiddleware, (req, res) => {
  const { employee_id, month } = req.params;
  const { month: bodyMonth } = req.body;
  const targetMonth = bodyMonth || month || getMonth();
  
  commissions.forEach(c => {
    if (c.employee_id === parseInt(employee_id) && c.date.startsWith(targetMonth) && c.status === 'pendente') {
      c.status = 'pago';
    }
  });
  
  res.json({ success: true });
});

app.post('/api/commissions/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const idx = commissions.findIndex(c => c.id === parseInt(req.params.id));
  if (idx >= 0) {
    commissions[idx].status = status;
  }
  res.json({ success: true });
});

// ==================== CASH / POS ====================
app.get('/api/cash/current', authMiddleware, (req, res) => {
  const openRegister = cashRegisters.find(r => r.status === 'aberto');
  if (openRegister) {
    const transactions = cashTransactions.filter(t => t.register_id === openRegister.id);
    const vendas = transactions.filter(t => t.type === 'venda').reduce((s, t) => s + t.total, 0);
    const suprimentos = transactions.filter(t => t.type === 'suprimento').reduce((s, t) => s + t.total, 0);
    const sangrias = transactions.filter(t => t.type === 'sangria').reduce((s, t) => s + t.total, 0);
    const expected = openRegister.initial_amount + vendas + suprimentos - sangrias;
    res.json({ register: openRegister, summary: { vendas, suprimentos, sangrias, expected }, transactions });
  } else {
    res.json({ register: null, summary: null, transactions: [] });
  }
});

app.post('/api/cash/open', authMiddleware, (req, res) => {
  const openRegister = cashRegisters.find(r => r.status === 'aberto');
  if (openRegister) return res.status(400).json({ error: 'Já existe um caixa aberto' });
  const { initial_amount, notes } = req.body;
  const register = {
    id: nextId(cashRegisters),
    opened_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    closed_at: null,
    initial_amount: parseFloat(initial_amount) || 0,
    final_amount: null,
    status: 'aberto',
    notes: notes || '',
    user: 'Admin'
  };
  cashRegisters.push(register);
  res.json({ success: true, register });
});

app.post('/api/cash/close', authMiddleware, (req, res) => {
  const openRegister = cashRegisters.find(r => r.status === 'aberto');
  if (!openRegister) return res.status(400).json({ error: 'Nenhum caixa aberto' });
  const { final_amount, notes } = req.body;
  openRegister.closed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
  openRegister.final_amount = parseFloat(final_amount) || 0;
  openRegister.status = 'fechado';
  openRegister.close_notes = notes || '';
  
  const transactions = cashTransactions.filter(t => t.register_id === openRegister.id);
  const vendas = transactions.filter(t => t.type === 'venda').reduce((s, t) => s + t.total, 0);
  const suprimentos = transactions.filter(t => t.type === 'suprimento').reduce((s, t) => s + t.total, 0);
  const sangrias = transactions.filter(t => t.type === 'sangria').reduce((s, t) => s + t.total, 0);
  const expected = openRegister.initial_amount + vendas + suprimentos - sangrias;
  
  res.json({ success: true, register: openRegister, expected, difference: openRegister.final_amount - expected });
});

app.post('/api/cash/transactions', authMiddleware, (req, res) => {
  const openRegister = cashRegisters.find(r => r.status === 'aberto');
  if (!openRegister) return res.status(400).json({ error: 'Nenhum caixa aberto. Abra um caixa primeiro.' });
  
  const { type, description, client_id, items, subtotal, discount, total, payment_method_id, payment_method_name, installments } = req.body;
  const transaction = {
    id: nextId(cashTransactions),
    register_id: openRegister.id,
    type: type || 'venda',
    description: description || '',
    client_id: client_id || null,
    items: items || [],
    subtotal: parseFloat(subtotal) || 0,
    discount: parseFloat(discount) || 0,
    total: parseFloat(total) || 0,
    payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
    payment_method_name: payment_method_name || '',
    installments: installments ? parseInt(installments) : 1,
    status: 'finalizado',
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: 'Admin'
  };
  cashTransactions.push(transaction);
  
  if (type === 'venda' && items) {
    items.forEach(item => {
      if (item.type === 'produto' && item.product_id) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod && prod.stock >= (item.qty || 1)) {
          prod.stock -= (item.qty || 1);
        }
      }
    });
  }
  
  if (type === 'suprimento') {
    const acc = financialAccounts.find(a => a.id === parseInt(req.body.account_id) || a.type === 'dinheiro');
    if (acc) acc.balance += transaction.total;
  } else if (type === 'sangria') {
    const acc = financialAccounts.find(a => a.id === parseInt(req.body.account_id) || a.type === 'dinheiro');
    if (acc && acc.balance >= transaction.total) acc.balance -= transaction.total;
  }
  
  res.json(transaction);
});

app.get('/api/cash/history', authMiddleware, (req, res) => {
  const { date, register_id, status } = req.query;
  let result = cashRegisters;
  if (date) result = result.filter(r => r.opened_at.startsWith(date));
  if (register_id) result = result.filter(r => r.id === parseInt(register_id));
  res.json(result.sort((a, b) => b.id - a.id));
});

app.get('/api/cash/registers/:id/summary', authMiddleware, (req, res) => {
  const register = cashRegisters.find(r => r.id === parseInt(req.params.id));
  if (!register) return res.status(404).json({ error: 'Caixa não encontrado' });
  const transactions = cashTransactions.filter(t => t.register_id === register.id);
  const vendas = transactions.filter(t => t.type === 'venda');
  const totalVendas = vendas.reduce((s, t) => s + t.total, 0);
  const totalSuprimentos = transactions.filter(t => t.type === 'suprimento').reduce((s, t) => s + t.total, 0);
  const totalSangrias = transactions.filter(t => t.type === 'sangria').reduce((s, t) => s + t.total, 0);
  
  const byPayment = {};
  vendas.forEach(t => {
    const name = t.payment_method_name || 'N/A';
    if (!byPayment[name]) byPayment[name] = { count: 0, total: 0 };
    byPayment[name].count++;
    byPayment[name].total += t.total;
  });
  
  res.json({
    register,
    transactions,
    totalVendas,
    totalSuprimentos,
    totalSangrias,
    expected: register.initial_amount + totalVendas + totalSuprimentos - totalSangrias,
    byPayment
  });
});

// ==================== SALON (Público) ====================
app.get('/api/salon/services', (req, res) => {
  res.json(salonServices);
});

app.get('/api/salon/professionals', (req, res) => {
  res.json(salonProfessionals);
});

app.get('/api/salon/bookings', authMiddleware, (req, res) => {
  res.json(salonBookings.sort((a,b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time)));
});

app.post('/api/salon/bookings', (req, res) => {
  const { clientName, clientPhone, serviceId, professionalId, date, time, price, status } = req.body;
  const booking = { id: nextId(salonBookings), clientName, clientPhone: clientPhone || '', serviceId: parseInt(serviceId), professionalId: parseInt(professionalId), date, time, price: parseFloat(price) || 0, status: status || 'pending' };
  salonBookings.push(booking);
  res.json(booking);
});

app.patch('/api/salon/bookings/:id', authMiddleware, (req, res) => {
  const { status } = req.body;
  const idx = salonBookings.findIndex(b => b.id === parseInt(req.params.id));
  if (idx >= 0) {
    salonBookings[idx] = { ...salonBookings[idx], status };
  }
  res.json(salonBookings[idx] || null);
});

app.delete('/api/salon/bookings/:id', authMiddleware, (req, res) => {
  salonBookings = salonBookings.filter(b => b.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
