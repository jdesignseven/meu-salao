const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDB, getDB, closeDB } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

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

function getToday() { return new Date().toISOString().split('T')[0]; }
function getMonth() { return new Date().toISOString().substring(0, 7); }

// ==================== AUTH ====================
app.post('/api/auth/register', (req, res) => {
  const db = getDB();
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, 'user');
  const token = jwt.sign({ userId: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: result.lastInsertRowid, name, email, role: 'user' }, token });
});

app.post('/api/auth/login', (req, res) => {
  const db = getDB();
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

// ==================== PUBLIC ====================
app.get('/api/public/employees', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY name').all());
});

app.get('/api/public/services', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY name').all());
});

app.post('/api/pre-register', (req, res) => {
  const db = getDB();
  const { name, gender, cpf, phone, profession, holder_type, cep, number } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' });

  const result = db.prepare(`INSERT INTO clients (name, gender, cpf, phone, profession, holder_type, cep, number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    name, gender || '', cpf || '', phone, profession || '', holder_type || 'Titular', cep || '', number || ''
  );

  res.json({ success: true, id: result.lastInsertRowid });
});

// ==================== CLIENTS ====================
app.get('/api/clients', authMiddleware, (req, res) => {
  const db = getDB();
  const { search } = req.query;
  let clients;

  if (search) {
    const s = `%${search}%`;
    clients = db.prepare(`
      SELECT * FROM clients WHERE
      LOWER(name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR phone LIKE ? OR cpf LIKE ?
      ORDER BY name
    `).all(s, s, s, s);
  } else {
    clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
  }

  const clientsWithDetails = clients.map(c => {
    c.services = db.prepare('SELECT * FROM client_services WHERE client_id = ?').all(c.id);
    c.financial = db.prepare('SELECT * FROM client_financial WHERE client_id = ?').all(c.id);
    c.documents = db.prepare('SELECT * FROM client_documents WHERE client_id = ?').all(c.id);
    return c;
  });

  res.json(clientsWithDetails);
});

app.post('/api/clients', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, gender, birth_date, cpf, rg, phone, landline, email, how_found, holder_type, plan, cep, street, number, complement, neighborhood, city, state, photo, notes, responsible_name, responsible_birth_date, responsible_cpf, responsible_phone, profession, foreigner, app_access_code, anamnese_capilar, services, financial, documents } = req.body;

  if (cpf && cpf.trim()) {
    const existing = db.prepare("SELECT id FROM clients WHERE cpf = ? AND cpf != ''").get(cpf.trim());
    if (existing) return res.status(409).json({ error: 'Já existe um cliente cadastrado com este CPF' });
  } else {
    const existing = db.prepare('SELECT id FROM clients WHERE name = ? AND phone = ?').get(name, phone || '');
    if (existing) return res.status(409).json({ error: 'Já existe um cliente cadastrado com este nome e telefone' });
  }

  const result = db.prepare(`INSERT INTO clients (name, gender, birth_date, cpf, rg, phone, landline, email, how_found, holder_type, plan, cep, street, number, complement, neighborhood, city, state, photo, notes, responsible_name, responsible_birth_date, responsible_cpf, responsible_phone, profession, foreigner, app_access_code, anamnese_capilar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    name, gender || '', birth_date || '', cpf || '', rg || '', phone || '', landline || '', email || '', how_found || '', holder_type || 'Titular', plan || '', cep || '', street || '', number || '', complement || '', neighborhood || '', city || '', state || '', photo || '', notes || '', responsible_name || '', responsible_birth_date || '', responsible_cpf || '', responsible_phone || '', profession || '', foreigner ? 1 : 0, app_access_code || '', anamnese_capilar || ''
  );

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  client.services = services || [];
  client.financial = financial || [];
  client.documents = documents || [];

  if (services && services.length) {
    const stmt = db.prepare('INSERT INTO client_services (client_id, service_name, service_date, notes) VALUES (?, ?, ?, ?)');
    services.forEach(s => stmt.run(client.id, s.service_name || '', s.service_date || '', s.notes || ''));
  }

  res.json(client);
});

app.put('/api/clients/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { name, gender, birth_date, cpf, rg, phone, landline, email, how_found, holder_type, plan, cep, street, number, complement, neighborhood, city, state, photo, notes, responsible_name, responsible_birth_date, responsible_cpf, responsible_phone, profession, foreigner, app_access_code, anamnese_capilar, services } = req.body;

  if (cpf && cpf.trim()) {
    const existing = db.prepare("SELECT id FROM clients WHERE cpf = ? AND cpf != '' AND id != ?").get(cpf.trim(), id);
    if (existing) return res.status(409).json({ error: 'Já existe outro cliente cadastrado com este CPF' });
  }

  db.prepare(`UPDATE clients SET name=?, gender=?, birth_date=?, cpf=?, rg=?, phone=?, landline=?, email=?, how_found=?, holder_type=?, plan=?, cep=?, street=?, number=?, complement=?, neighborhood=?, city=?, state=?, photo=?, notes=?, responsible_name=?, responsible_birth_date=?, responsible_cpf=?, responsible_phone=?, profession=?, foreigner=?, app_access_code=?, anamnese_capilar=? WHERE id=?`).run(
    name, gender || '', birth_date || '', cpf || '', rg || '', phone || '', landline || '', email || '', how_found || '', holder_type || 'Titular', plan || '', cep || '', street || '', number || '', complement || '', neighborhood || '', city || '', state || '', photo || '', notes || '', responsible_name || '', responsible_birth_date || '', responsible_cpf || '', responsible_phone || '', profession || '', foreigner ? 1 : 0, app_access_code || '', anamnese_capilar || '', id
  );

  if (services !== undefined) {
    db.prepare('DELETE FROM client_services WHERE client_id = ?').run(parseInt(req.params.id));
    if (services.length) {
      const stmt = db.prepare('INSERT INTO client_services (client_id, service_name, service_date, notes) VALUES (?, ?, ?, ?)');
      services.forEach(s => stmt.run(parseInt(req.params.id), s.service_name || '', s.service_date || '', s.notes || ''));
    }
  }

  res.json({ success: true });
});

app.delete('/api/clients/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM clients WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== PLANS ====================
app.get('/api/plans', authMiddleware, (req, res) => {
  const db = getDB();
  const { active } = req.query;
  if (active === '1') res.json(db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY name').all());
  else res.json(db.prepare('SELECT * FROM plans ORDER BY name').all());
});

app.post('/api/plans', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, price, benefits } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome do plano é obrigatório' });
  const result = db.prepare('INSERT INTO plans (name, description, price, benefits) VALUES (?, ?, ?, ?)').run(name, description || '', price || 0, benefits || '');
  const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(result.lastInsertRowid);
  res.json(plan);
});

app.put('/api/plans/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, price, benefits, active } = req.body;
  db.prepare('UPDATE plans SET name=?, description=?, price=?, benefits=?, active=? WHERE id=?').run(name, description || '', price || 0, benefits || '', active !== undefined ? active : 1, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/plans/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM plans WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== EMPLOYEES ====================
app.get('/api/employees', authMiddleware, (req, res) => {
  const db = getDB();
  const { active } = req.query;
  let employees;
  if (active === '1') {
    employees = db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY name').all();
  } else {
    employees = db.prepare('SELECT * FROM employees ORDER BY name').all();
  }
  res.json(employees);
});

app.post('/api/employees', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, phone, email, specialty, commission_rate, active } = req.body;
  const result = db.prepare('INSERT INTO employees (name, phone, email, specialty, commission_rate, active) VALUES (?, ?, ?, ?, ?, ?)').run(name, phone || '', email || '', specialty || '', commission_rate || 0, active !== undefined ? active : 1);
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.json(emp);
});

app.put('/api/employees/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, phone, email, specialty, commission_rate, active } = req.body;
  db.prepare('UPDATE employees SET name=?, phone=?, email=?, specialty=?, commission_rate=?, active=? WHERE id=?').run(name, phone || '', email || '', specialty || '', commission_rate || 0, active, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/employees/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM employees WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== SERVICES ====================
app.get('/api/services', authMiddleware, (req, res) => {
  const db = getDB();
  const { active } = req.query;
  let services;
  if (active === '1') {
    services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY name').all();
  } else {
    services = db.prepare('SELECT * FROM services ORDER BY name').all();
  }
  res.json(services);
});

app.post('/api/services', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, price, duration_minutes, active } = req.body;
  const result = db.prepare('INSERT INTO services (name, description, price, duration_minutes, active) VALUES (?, ?, ?, ?, ?)').run(name, description || '', parseFloat(price), parseInt(duration_minutes) || 30, active !== undefined ? active : 1);
  const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
  res.json(svc);
});

app.put('/api/services/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, price, duration_minutes, active } = req.body;
  db.prepare('UPDATE services SET name=?, description=?, price=?, duration_minutes=?, active=? WHERE id=?').run(name, description || '', parseFloat(price), parseInt(duration_minutes) || 30, active, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/services/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM services WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== PRODUCTS ====================
app.get('/api/products', authMiddleware, (req, res) => {
  const db = getDB();
  const { search, group, active, low_stock } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    const s = `%${search}%`;
    query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(code) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))';
    params.push(s, s, s);
  }
  if (group) {
    query += ' AND product_group = ?';
    params.push(group);
  }
  if (active === '1') {
    query += ' AND active = 1';
  }
  if (low_stock === '1') {
    query += ' AND stock <= min_stock';
  }

  query += ' ORDER BY name';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/products/groups', authMiddleware, (req, res) => {
  const db = getDB();
  const groups = db.prepare("SELECT DISTINCT product_group FROM products WHERE product_group != '' ORDER BY product_group").all().map(g => g.product_group);
  res.json(groups);
});

app.get('/api/products/low-stock', authMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM products WHERE stock <= min_stock AND active = 1').all());
});

app.post('/api/products', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, group, type, cost, sale_price, unit, stock, min_stock, photo, active } = req.body;
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  const nextCode = `PROD-${String(count.count + 1).padStart(3, '0')}`;

  const result = db.prepare('INSERT INTO products (code, name, description, product_group, type, cost, sale_price, unit, stock, min_stock, photo, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    nextCode, name, description || '', group || '', type || 'outro', parseFloat(cost) || 0, parseFloat(sale_price) || 0, unit || 'un', parseInt(stock) || 0, parseInt(min_stock) || 0, photo || '', active !== undefined ? active : 1
  );
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, description, group, type, cost, sale_price, unit, min_stock, photo, active } = req.body;
  db.prepare('UPDATE products SET name=?, description=?, product_group=?, type=?, cost=?, sale_price=?, unit=?, min_stock=?, photo=?, active=? WHERE id=?').run(
    name, description || '', group || '', type || 'outro', parseFloat(cost), parseFloat(sale_price), unit || 'un', parseInt(min_stock), photo || '', active, parseInt(req.params.id)
  );
  res.json({ success: true });
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM products WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.patch('/api/products/:id/stock', authMiddleware, (req, res) => {
  const db = getDB();
  const { type, quantity, reason, user } = req.body;
  const productId = parseInt(req.params.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const qty = parseInt(quantity);
  let newStock = product.stock;

  if (type === 'entrada') {
    newStock += qty;
  } else if (type === 'saida') {
    if (product.stock < qty) return res.status(400).json({ error: 'Estoque insuficiente' });
    newStock -= qty;
  }

  db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(newStock, productId);
  db.prepare('INSERT INTO stock_movements (product_id, type, quantity, date, reason, user) VALUES (?, ?, ?, ?, ?, ?)').run(
    productId, type, qty, getToday(), reason || '', user || 'Admin'
  );
  res.json({ success: true, newStock });
});

app.get('/api/products/:id/stock-movements', authMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY date DESC').all(parseInt(req.params.id)));
});

// ==================== APPOINTMENTS ====================
app.get('/api/appointments', authMiddleware, (req, res) => {
  const db = getDB();
  const { date, status } = req.query;

  let query = `SELECT a.*, c.name as client_name, e.name as employee_name, s.name as service_name, s.price as service_price
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN services s ON a.service_id = s.id`;

  const conditions = [];
  const params = [];
  if (date) { conditions.push('a.date = ?'); params.push(date); }
  if (status) { conditions.push('a.status = ?'); params.push(status); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY a.date DESC, a.time DESC';

  res.json(db.prepare(query).all(...params));
});

app.post('/api/appointments', authMiddleware, (req, res) => {
  const db = getDB();
  const { client_id, employee_id, service_id, date, time, notes } = req.body;
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(parseInt(service_id));
  const total_price = service ? service.price : 0;

  const result = db.prepare('INSERT INTO appointments (client_id, employee_id, service_id, date, time, status, notes, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    parseInt(client_id), parseInt(employee_id), parseInt(service_id), date, time, 'scheduled', notes || '', total_price
  );
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
  res.json(apt);
});

app.get('/api/public/settings', (req, res) => {
  const db = getDB();
  const keys = ['salon_name','salon_address','salon_phone','salon_whatsapp','salon_instagram','salon_email','salon_hours','salon_about'];
  const settings = db.prepare(`SELECT * FROM settings WHERE key IN (${keys.map(k => '?').join(',')})`).all(...keys);
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.post('/api/public/appointments', (req, res) => {
  const db = getDB();
  const { name, phone, email, employee_id, service_id, date, time, notes } = req.body;
  
  // Check if client exists by phone or email
  let client = db.prepare('SELECT id FROM clients WHERE phone = ? OR email = ?').get(phone, email || '');
  let clientId;
  
  if (!client) {
    const result = db.prepare('INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)').run(name, phone, email || '');
    clientId = result.lastInsertRowid;
  } else {
    clientId = client.id;
  }
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(parseInt(service_id));
  const total_price = service ? service.price : 0;
  
  const aptResult = db.prepare('INSERT INTO appointments (client_id, employee_id, service_id, date, time, status, notes, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    clientId, parseInt(employee_id), parseInt(service_id), date, time, 'scheduled', notes || '', total_price
  );
  
  res.json({ success: true, id: aptResult.lastInsertRowid });
});

app.put('/api/appointments/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(parseInt(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Agendamento não encontrado' });

  const { client_id, employee_id, service_id, date, time, status, notes, before_photo, after_photo } = req.body;
  db.prepare('UPDATE appointments SET client_id=?, employee_id=?, service_id=?, date=?, time=?, status=?, notes=?, before_photo=?, after_photo=? WHERE id=?').run(
    client_id !== undefined ? parseInt(client_id) : existing.client_id,
    employee_id !== undefined ? parseInt(employee_id) : existing.employee_id,
    service_id !== undefined ? parseInt(service_id) : existing.service_id,
    date || existing.date,
    time || existing.time,
    status || existing.status,
    notes !== undefined ? notes : existing.notes,
    before_photo !== undefined ? before_photo : existing.before_photo,
    after_photo !== undefined ? after_photo : existing.after_photo,
    parseInt(req.params.id)
  );
  res.json({ success: true });
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM appointments WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== DASHBOARD ====================
app.get('/api/dashboard/overview', authMiddleware, (req, res) => {
  const db = getDB();
  const today = getToday();
  const month = getMonth();
  const todayFormatted = new Date().toLocaleDateString('pt-BR').substring(0, 5);

  const todayAppointments = db.prepare(`
    SELECT a.*, c.name as client_name, e.name as employee_name, s.name as service_name
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.date = ?
    ORDER BY a.time ASC
  `).all(today);

  const monthRevenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM appointments WHERE date LIKE ? AND (status = 'atendido' OR status = 'concluido')").get(`${month}%`).total;
  const pendingAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'agendado' OR status = 'confirmado'").get().count;
  const todayBirthdays = db.prepare("SELECT * FROM clients WHERE SUBSTR(birth_date, 6, 5) = ?").all(todayFormatted);
  const openBalance = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM appointments WHERE status = 'agendado' OR status = 'confirmado' OR status = 'espera'").get().total;
  const monthSales = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM appointments WHERE date LIKE ?").get(`${month}%`).total;
  const partialPaid = db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM appointments WHERE status = 'atendendo'").get().total;
  const monthAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE date LIKE ?").get(`${month}%`).count;
  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').get().count;
  const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE active = 1').get().count;
  const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;

  res.json({
    totalClients, totalEmployees, totalServices,
    todayAppointments, monthRevenue, pendingAppointments,
    todayBirthdays, openBalance, monthSales, partialPaid,
    monthAppointments, totalAppointments
  });
});

// ==================== FINANCIAL ====================
app.get('/api/financial/transactions', authMiddleware, (req, res) => {
  const db = getDB();
  const { type, category_id, account_id, status, payment_method_id, date_from, date_to, search } = req.query;

  let query = `SELECT ft.*, fc.name as category_name, fa.name as account_name, pm.name as payment_method_name, c.name as client_name
    FROM financial_transactions ft
    LEFT JOIN financial_categories fc ON ft.category_id = fc.id
    LEFT JOIN financial_accounts fa ON ft.account_id = fa.id
    LEFT JOIN payment_methods pm ON ft.payment_method_id = pm.id
    LEFT JOIN clients c ON ft.client_id = c.id WHERE 1=1`;

  const params = [];
  if (type) { query += ' AND ft.type = ?'; params.push(type); }
  if (category_id) { query += ' AND ft.category_id = ?'; params.push(parseInt(category_id)); }
  if (account_id) { query += ' AND ft.account_id = ?'; params.push(parseInt(account_id)); }
  if (status) { query += ' AND ft.status = ?'; params.push(status); }
  if (payment_method_id) { query += ' AND ft.payment_method_id = ?'; params.push(parseInt(payment_method_id)); }
  if (date_from) { query += ' AND ft.due_date >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND ft.due_date <= ?'; params.push(date_to); }
  if (search) {
    const s = `%${search}%`;
    query += ' AND (LOWER(ft.description) LIKE LOWER(?) OR LOWER(ft.code) LIKE LOWER(?))';
    params.push(s, s);
  }
  query += ' ORDER BY ft.due_date DESC';

  res.json(db.prepare(query).all(...params));
});

app.get('/api/financial/transactions/overdue', authMiddleware, (req, res) => {
  const db = getDB();
  const today = getToday();
  res.json(db.prepare(`SELECT ft.*, fc.name as category_name FROM financial_transactions ft LEFT JOIN financial_categories fc ON ft.category_id = fc.id WHERE ft.due_date < ? AND ft.status = 'pendente'`).all(today));
});

app.get('/api/financial/transactions/upcoming', authMiddleware, (req, res) => {
  const db = getDB();
  const today = getToday();
  const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  res.json(db.prepare(`SELECT ft.*, fc.name as category_name FROM financial_transactions ft LEFT JOIN financial_categories fc ON ft.category_id = fc.id WHERE ft.due_date >= ? AND ft.due_date <= ? AND ft.status = 'pendente'`).all(today, future));
});

app.post('/api/financial/transactions', authMiddleware, (req, res) => {
  const db = getDB();
  const { type, category_id, account_id, payment_method_id, client_id, appointment_id, description, amount, installments, due_date, status, notes } = req.body;
  const count = db.prepare('SELECT COUNT(*) as count FROM financial_transactions').get();
  const code = `FIN-${String(count.count + 1).padStart(3, '0')}`;

  const result = db.prepare('INSERT INTO financial_transactions (code, type, category_id, account_id, payment_method_id, client_id, appointment_id, description, amount, installments, due_date, paid_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    code, type || 'receita', parseInt(category_id), parseInt(account_id), parseInt(payment_method_id), client_id ? parseInt(client_id) : null, appointment_id ? parseInt(appointment_id) : null, description || '', parseFloat(amount), installments ? parseInt(installments) : 1, due_date || getToday(), status === 'pago' ? getToday() : null, status || 'pendente', notes || ''
  );
  const transaction = db.prepare('SELECT * FROM financial_transactions WHERE id = ?').get(result.lastInsertRowid);
  res.json(transaction);
});

app.put('/api/financial/transactions/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM financial_transactions WHERE id = ?').get(parseInt(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Transação não encontrada' });

  const { type, category_id, account_id, payment_method_id, client_id, appointment_id, description, amount, installments, due_date, status, paid_date, notes } = req.body;
  db.prepare('UPDATE financial_transactions SET type=?, category_id=?, account_id=?, payment_method_id=?, client_id=?, appointment_id=?, description=?, amount=?, installments=?, due_date=?, status=?, paid_date=?, notes=? WHERE id=?').run(
    type || existing.type,
    category_id !== undefined ? parseInt(category_id) : existing.category_id,
    account_id !== undefined ? parseInt(account_id) : existing.account_id,
    payment_method_id !== undefined ? parseInt(payment_method_id) : existing.payment_method_id,
    client_id !== undefined ? (client_id ? parseInt(client_id) : null) : existing.client_id,
    appointment_id !== undefined ? (appointment_id ? parseInt(appointment_id) : null) : existing.appointment_id,
    description !== undefined ? description : existing.description,
    amount !== undefined ? parseFloat(amount) : existing.amount,
    installments !== undefined ? parseInt(installments) : existing.installments,
    due_date || existing.due_date,
    status !== undefined ? status : existing.status,
    status === 'pago' ? getToday() : (paid_date !== undefined ? paid_date : existing.paid_date),
    notes !== undefined ? notes : existing.notes,
    parseInt(req.params.id)
  );
  res.json({ success: true });
});

app.delete('/api/financial/transactions/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM financial_transactions WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.patch('/api/financial/transactions/:id/status', authMiddleware, (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare('UPDATE financial_transactions SET status = ?, paid_date = ? WHERE id = ?').run(status, status === 'pago' ? getToday() : null, parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/categories', authMiddleware, (req, res) => {
  const db = getDB();
  const { type } = req.query;
  let categories;
  if (type) {
    categories = db.prepare('SELECT * FROM financial_categories WHERE active = 1 AND type = ? ORDER BY name').all(type);
  } else {
    categories = db.prepare('SELECT * FROM financial_categories WHERE active = 1 ORDER BY name').all();
  }
  res.json(categories);
});

app.post('/api/financial/categories', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, icon, color, active } = req.body;
  const result = db.prepare('INSERT INTO financial_categories (name, type, icon, color, active) VALUES (?, ?, ?, ?, ?)').run(name, type || 'despesa', icon || '', color || '#999', active !== undefined ? active : 1);
  const category = db.prepare('SELECT * FROM financial_categories WHERE id = ?').get(result.lastInsertRowid);
  res.json(category);
});

app.put('/api/financial/categories/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, icon, color, active } = req.body;
  db.prepare('UPDATE financial_categories SET name=?, type=?, icon=?, color=?, active=? WHERE id=?').run(name, type, icon, color, active, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/financial/categories/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM financial_categories WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/accounts', authMiddleware, (req, res) => {
  const db = getDB();
  const { active } = req.query;
  let accounts;
  if (active === '1') {
    accounts = db.prepare('SELECT * FROM financial_accounts WHERE active = 1 ORDER BY name').all();
  } else {
    accounts = db.prepare('SELECT * FROM financial_accounts ORDER BY name').all();
  }
  res.json(accounts);
});

app.post('/api/financial/accounts', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, balance, active } = req.body;
  const result = db.prepare('INSERT INTO financial_accounts (name, type, balance, active) VALUES (?, ?, ?, ?)').run(name, type || 'dinheiro', parseFloat(balance) || 0, active !== undefined ? active : 1);
  const account = db.prepare('SELECT * FROM financial_accounts WHERE id = ?').get(result.lastInsertRowid);
  res.json(account);
});

app.put('/api/financial/accounts/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, balance, active } = req.body;
  db.prepare('UPDATE financial_accounts SET name=?, type=?, balance=?, active=? WHERE id=?').run(name, type, parseFloat(balance), active, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/financial/accounts/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM financial_accounts WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/payment-methods', authMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM payment_methods WHERE active = 1 ORDER BY name').all());
});

app.post('/api/financial/payment-methods', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, icon, max_installments, active } = req.body;
  const result = db.prepare('INSERT INTO payment_methods (name, type, icon, max_installments, active) VALUES (?, ?, ?, ?, ?)').run(name, type, icon || '', max_installments || 1, active !== undefined ? active : 1);
  const pm = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(result.lastInsertRowid);
  res.json(pm);
});

app.put('/api/financial/payment-methods/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { name, type, icon, max_installments, active } = req.body;
  db.prepare('UPDATE payment_methods SET name=?, type=?, icon=?, max_installments=?, active=? WHERE id=?').run(name, type, icon, max_installments || 1, active, parseInt(req.params.id));
  res.json({ success: true });
});

app.delete('/api/financial/payment-methods/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

app.get('/api/financial/summary', authMiddleware, (req, res) => {
  const db = getDB();
  const { month } = req.query;
  const targetMonth = month || getMonth();

  const monthTransactions = db.prepare('SELECT * FROM financial_transactions WHERE due_date LIKE ?').all(`${targetMonth}%`);
  const totalReceitas = monthTransactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const totalDespesas = monthTransactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const receitasPagas = monthTransactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const despesasPagas = monthTransactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.amount, 0);
  const receitasPendentes = monthTransactions.filter(t => t.type === 'receita' && t.status === 'pendente').reduce((s, t) => s + t.amount, 0);
  const despesasPendentes = monthTransactions.filter(t => t.type === 'despesa' && t.status === 'pendente').reduce((s, t) => s + t.amount, 0);
  const saldo = receitasPagas - despesasPagas;

  const totalAccounts = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM financial_accounts WHERE active = 1').get().total;
  const overdueCount = db.prepare("SELECT COUNT(*) as count FROM financial_transactions WHERE due_date < ? AND status = 'pendente'").get(getToday()).count;

  const categories = db.prepare('SELECT * FROM financial_categories').all();
  const byCategory = categories.map(cat => {
    const catTransactions = monthTransactions.filter(t => t.category_id === cat.id && t.status === 'pago');
    return { id: cat.id, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color, total: catTransactions.reduce((s, t) => s + t.amount, 0), count: catTransactions.length };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const daysInMonth = new Date(parseInt(targetMonth.split('-')[0]), parseInt(targetMonth.split('-')[1]), 0).getDate();
  const dailyFlow = [];
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
  const db = getDB();
  const accounts = db.prepare('SELECT id, name, type, balance FROM financial_accounts WHERE active = 1').all();
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  res.json({ accounts, total });
});

// ==================== COMMISSIONS ====================
app.post('/api/commissions/sync', authMiddleware, (req, res) => {
  const db = getDB();
  let created = 0;

  const appointments = db.prepare("SELECT * FROM appointments WHERE (status = 'atendido' OR status = 'concluido') AND commission_processed = 0").all();

  const insertCommission = db.prepare('INSERT INTO commissions (employee_id, employee_name, appointment_id, service_name, client_name, service_price, commission_rate, commission_value, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const updateAppointment = db.prepare('UPDATE appointments SET commission_processed = 1 WHERE id = ?');

  appointments.forEach(apt => {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(apt.employee_id);
    const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(apt.service_id);
    if (emp && svc) {
      const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(apt.client_id);
      const rate = emp.commission_rate || 0;
      const commissionValue = (svc.price * rate) / 100;
      insertCommission.run(emp.id, emp.name, apt.id, svc.name, client ? client.name : 'N/A', svc.price, rate, commissionValue, apt.date, 'pendente');
      updateAppointment.run(apt.id);
      created++;
    }
  });

  res.json({ success: true, created });
});

app.get('/api/commissions', authMiddleware, (req, res) => {
  const db = getDB();
  const { employee_id, month, status } = req.query;
  let query = 'SELECT * FROM commissions WHERE 1=1';
  const params = [];
  if (employee_id) { query += ' AND employee_id = ?'; params.push(parseInt(employee_id)); }
  if (month) { query += ' AND date LIKE ?'; params.push(`${month}%`); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY date DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/commissions/summary', authMiddleware, (req, res) => {
  const db = getDB();
  const { month } = req.query;
  const targetMonth = month || getMonth();

  const employees = db.prepare('SELECT * FROM employees WHERE active = 1').all();
  const summary = employees.map(emp => {
    const empsCommissions = db.prepare('SELECT * FROM commissions WHERE employee_id = ? AND date LIKE ?').all(emp.id, `${targetMonth}%`);
    const totalServices = empsCommissions.length;
    const totalSales = empsCommissions.reduce((s, c) => s + c.service_price, 0);
    const pendingValue = empsCommissions.filter(c => c.status === 'pendente').reduce((s, c) => s + c.commission_value, 0);
    const paidValue = empsCommissions.filter(c => c.status === 'pago').reduce((s, c) => s + c.commission_value, 0);
    return { id: emp.id, name: emp.name, commission_rate: emp.commission_rate, photo: emp.photo || '', totalServices, totalSales, pendingValue, paidValue, totalValue: pendingValue + paidValue };
  }).filter(e => e.totalServices > 0);

  res.json(summary);
});

app.post('/api/commissions/:employee_id/pay', authMiddleware, (req, res) => {
  const db = getDB();
  const { employee_id } = req.params;
  const { month } = req.body;
  const targetMonth = month || getMonth();

  db.prepare("UPDATE commissions SET status = 'pago' WHERE employee_id = ? AND date LIKE ? AND status = 'pendente'").run(parseInt(employee_id), `${targetMonth}%`);
  res.json({ success: true });
});

app.post('/api/commissions/:id/status', authMiddleware, (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare('UPDATE commissions SET status = ? WHERE id = ?').run(status, parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== CASH / POS ====================
app.get('/api/cash/current', authMiddleware, (req, res) => {
  const db = getDB();
  const openRegister = db.prepare("SELECT * FROM cash_registers WHERE status = 'aberto'").get();
  if (openRegister) {
    const transactions = db.prepare('SELECT * FROM cash_transactions WHERE register_id = ?').all(openRegister.id);
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
  const db = getDB();
  const openRegister = db.prepare("SELECT * FROM cash_registers WHERE status = 'aberto'").get();
  if (openRegister) return res.status(400).json({ error: 'Já existe um caixa aberto' });

  const { initial_amount, notes } = req.body;
  const result = db.prepare('INSERT INTO cash_registers (opened_at, initial_amount, status, notes, user) VALUES (?, ?, ?, ?, ?)').run(
    new Date().toISOString().replace('T', ' ').substring(0, 19), parseFloat(initial_amount) || 0, 'aberto', notes || '', 'Admin'
  );
  const register = db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, register });
});

app.post('/api/cash/close', authMiddleware, (req, res) => {
  const db = getDB();
  const openRegister = db.prepare("SELECT * FROM cash_registers WHERE status = 'aberto'").get();
  if (!openRegister) return res.status(400).json({ error: 'Nenhum caixa aberto' });

  const { final_amount, notes } = req.body;
  db.prepare('UPDATE cash_registers SET closed_at = ?, final_amount = ?, status = ?, close_notes = ? WHERE id = ?').run(
    new Date().toISOString().replace('T', ' ').substring(0, 19), parseFloat(final_amount) || 0, 'fechado', notes || '', openRegister.id
  );

  const transactions = db.prepare('SELECT * FROM cash_transactions WHERE register_id = ?').all(openRegister.id);
  const vendas = transactions.filter(t => t.type === 'venda').reduce((s, t) => s + t.total, 0);
  const suprimentos = transactions.filter(t => t.type === 'suprimento').reduce((s, t) => s + t.total, 0);
  const sangrias = transactions.filter(t => t.type === 'sangria').reduce((s, t) => s + t.total, 0);
  const expected = openRegister.initial_amount + vendas + suprimentos - sangrias;

  const register = db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(openRegister.id);
  res.json({ success: true, register, expected, difference: register.final_amount - expected });
});

app.post('/api/cash/transactions', authMiddleware, (req, res) => {
  const db = getDB();
  const openRegister = db.prepare("SELECT * FROM cash_registers WHERE status = 'aberto'").get();
  if (!openRegister) return res.status(400).json({ error: 'Nenhum caixa aberto. Abra um caixa primeiro.' });

  const { type, description, client_id, items, subtotal, discount, total, payment_method_id, payment_method_name, installments } = req.body;
  const result = db.prepare('INSERT INTO cash_transactions (register_id, type, description, client_id, items, subtotal, discount, total, payment_method_id, payment_method_name, installments, status, created_at, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    openRegister.id, type || 'venda', description || '', client_id || null, JSON.stringify(items || []), parseFloat(subtotal) || 0, parseFloat(discount) || 0, parseFloat(total) || 0, payment_method_id ? parseInt(payment_method_id) : null, payment_method_name || '', installments ? parseInt(installments) : 1, 'finalizado', new Date().toISOString().replace('T', ' ').substring(0, 19), 'Admin'
  );
  const transaction = db.prepare('SELECT * FROM cash_transactions WHERE id = ?').get(result.lastInsertRowid);

  if (type === 'venda' && items) {
    items.forEach(item => {
      if (item.type === 'produto' && item.product_id) {
        const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (prod && prod.stock >= (item.qty || 1)) {
          db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty || 1, item.product_id);
        }
      }
    });
  }

  if (type === 'suprimento') {
    const acc = db.prepare("SELECT * FROM financial_accounts WHERE id = ? OR type = 'dinheiro'").all(parseInt(req.body.account_id) || 0);
    if (acc.length) db.prepare('UPDATE financial_accounts SET balance = balance + ? WHERE id = ?').run(transaction.total, acc[0].id);
  } else if (type === 'sangria') {
    const acc = db.prepare("SELECT * FROM financial_accounts WHERE id = ? OR type = 'dinheiro'").all(parseInt(req.body.account_id) || 0);
    if (acc.length) {
      const account = db.prepare('SELECT * FROM financial_accounts WHERE id = ?').get(acc[0].id);
      if (account && account.balance >= transaction.total) {
        db.prepare('UPDATE financial_accounts SET balance = balance - ? WHERE id = ?').run(transaction.total, acc[0].id);
      }
    }
  }

  res.json(transaction);
});

app.get('/api/cash/history', authMiddleware, (req, res) => {
  const db = getDB();
  const { date, register_id, status } = req.query;
  let query = 'SELECT * FROM cash_registers WHERE 1=1';
  const params = [];
  if (date) { query += ' AND opened_at LIKE ?'; params.push(`${date}%`); }
  if (register_id) { query += ' AND id = ?'; params.push(parseInt(register_id)); }
  query += ' ORDER BY id DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/cash/registers/:id/summary', authMiddleware, (req, res) => {
  const db = getDB();
  const register = db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(parseInt(req.params.id));
  if (!register) return res.status(404).json({ error: 'Caixa não encontrado' });

  const transactions = db.prepare('SELECT * FROM cash_transactions WHERE register_id = ?').all(register.id);
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

  res.json({ register, transactions, totalVendas, totalSuprimentos, totalSangrias, expected: register.initial_amount + totalVendas + totalSuprimentos - totalSangrias, byPayment });
});

// ==================== SALON (Público) ====================
app.get('/api/salon/services', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM salon_services').all());
});

app.get('/api/salon/professionals', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM salon_professionals').all());
});

app.get('/api/salon/bookings', authMiddleware, (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM salon_bookings ORDER BY date DESC, time DESC').all());
});

app.post('/api/salon/bookings', (req, res) => {
  const db = getDB();
  const { clientName, clientPhone, serviceId, professionalId, date, time, price, status } = req.body;
  const result = db.prepare('INSERT INTO salon_bookings (clientName, clientPhone, serviceId, professionalId, date, time, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(clientName, clientPhone || '', parseInt(serviceId), parseInt(professionalId), date, time, parseFloat(price) || 0, status || 'pending');
  const booking = db.prepare('SELECT * FROM salon_bookings WHERE id = ?').get(result.lastInsertRowid);
  res.json(booking);
});

app.patch('/api/salon/bookings/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare('UPDATE salon_bookings SET status = ? WHERE id = ?').run(status, parseInt(req.params.id));
  const booking = db.prepare('SELECT * FROM salon_bookings WHERE id = ?').get(parseInt(req.params.id));
  res.json(booking || null);
});

app.delete('/api/salon/bookings/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM salon_bookings WHERE id = ?').run(parseInt(req.params.id));
  res.json({ success: true });
});

// ==================== USERS / PERMISSIONS ====================
function adminMiddleware(req, res, next) {
  const db = getDB();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDB();
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY name').all();
  res.json(users);
});

app.post('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDB();
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email já cadastrado' });
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role || 'operator');
  res.json({ id: result.lastInsertRowid, name, email, role: role || 'operator' });
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDB();
  const { name, email, password, role } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?').run(name || user.name, email || user.email, hashedPassword, role || 'operator', req.params.id);
  } else {
    db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(name, email, role, req.params.id);
  }
  res.json({ success: true });
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDB();
  if (parseInt(req.params.id) === req.user.userId) return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==================== SETTINGS ====================
app.get('/api/settings', authMiddleware, (req, res) => {
  const db = getDB();
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.put('/api/settings/:key', authMiddleware, (req, res) => {
  const db = getDB();
  const { value } = req.body;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(req.params.key, value);
  res.json({ success: true });
});

// Servir frontend buildado em produção
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Iniciar servidor
initDB();
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  closeDB();
  process.exit(0);
});
