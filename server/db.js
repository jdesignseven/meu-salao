const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'beautysis.db');

let db;

function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT DEFAULT '',
      birth_date TEXT DEFAULT '',
      cpf TEXT DEFAULT '',
      rg TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      landline TEXT DEFAULT '',
      email TEXT DEFAULT '',
      how_found TEXT DEFAULT '',
      holder_type TEXT DEFAULT 'Titular',
      plan TEXT DEFAULT '',
      cep TEXT DEFAULT '',
      street TEXT DEFAULT '',
      number TEXT DEFAULT '',
      complement TEXT DEFAULT '',
      neighborhood TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      responsible_name TEXT DEFAULT '',
      responsible_birth_date TEXT DEFAULT '',
      responsible_cpf TEXT DEFAULT '',
      responsible_phone TEXT DEFAULT '',
      profession TEXT DEFAULT '',
      foreigner INTEGER DEFAULT 0,
      app_access_code TEXT DEFAULT '',
      anamnese_capilar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      service_name TEXT,
      service_date TEXT,
      notes TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_financial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      description TEXT,
      amount REAL,
      due_date TEXT,
      status TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS client_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      document_name TEXT,
      document_url TEXT,
      upload_date TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      specialty TEXT DEFAULT '',
      commission_rate REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      photo TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      product_group TEXT DEFAULT '',
      type TEXT DEFAULT 'outro',
      cost REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'un',
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      photo TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT DEFAULT '',
      user TEXT DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      employee_id INTEGER,
      service_id INTEGER,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT DEFAULT '',
      total_price REAL DEFAULT 0,
      commission_processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS financial_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '#999',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS financial_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'dinheiro',
      balance REAL DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      max_installments INTEGER DEFAULT 1,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS financial_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      type TEXT DEFAULT 'receita',
      category_id INTEGER,
      account_id INTEGER,
      payment_method_id INTEGER,
      client_id INTEGER,
      appointment_id INTEGER,
      description TEXT DEFAULT '',
      amount REAL NOT NULL,
      installments INTEGER DEFAULT 1,
      due_date TEXT NOT NULL,
      paid_date TEXT,
      status TEXT DEFAULT 'pendente',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES financial_categories(id),
      FOREIGN KEY (account_id) REFERENCES financial_accounts(id),
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      employee_name TEXT,
      appointment_id INTEGER,
      service_name TEXT,
      client_name TEXT,
      service_price REAL,
      commission_rate REAL,
      commission_value REAL,
      date TEXT,
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opened_at TEXT,
      closed_at TEXT,
      initial_amount REAL DEFAULT 0,
      final_amount REAL,
      status TEXT DEFAULT 'aberto',
      notes TEXT DEFAULT '',
      close_notes TEXT DEFAULT '',
      user TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS cash_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      register_id INTEGER,
      type TEXT DEFAULT 'venda',
      description TEXT DEFAULT '',
      client_id INTEGER,
      items TEXT DEFAULT '[]',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method_id INTEGER,
      payment_method_name TEXT DEFAULT '',
      installments INTEGER DEFAULT 1,
      status TEXT DEFAULT 'finalizado',
      created_at TEXT,
      user TEXT DEFAULT '',
      FOREIGN KEY (register_id) REFERENCES cash_registers(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS salon_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL,
      duration TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS salon_professionals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialties TEXT
    );

    CREATE TABLE IF NOT EXISTS salon_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT,
      clientPhone TEXT,
      serviceId INTEGER,
      professionalId INTEGER,
      date TEXT,
      time TEXT,
      price REAL,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  seedData();
  console.log('Database initialized successfully');
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count > 0) return;

  const seed = db.transaction(() => {
    const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    insertUser.run('Admin', 'admin@secvc.com', bcrypt.hashSync('admin123', 10), 'admin');
    insertUser.run('Elzito Junior', 'elzitojunior@outlook.com', bcrypt.hashSync('725609993', 10), 'admin');

    const insertClient = db.prepare(`INSERT INTO clients (name, gender, birth_date, cpf, rg, phone, email, how_found, holder_type, plan, cep, street, number, neighborhood, city, state, notes, profession) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertClient.run('Maria Silva', 'F', '1985-05-10', '111.222.333-44', '1234567', '(71) 99999-1111', 'maria@email.com', 'Instagram', 'Titular', 'Premium', '40000-000', 'Rua das Flores', '123', 'Centro', 'Salvador', 'BA', 'Cliente VIP', 'Empresa XYZ');
    insertClient.run('João Santos', 'M', '1990-12-25', '222.333.444-55', '2345678', '(71) 98888-2222', 'joao@email.com', 'Indicação', 'Titular', 'Básico', '40000-001', 'Av. Central', '456', 'Centro', 'Salvador', 'BA', '', '');
    insertClient.run('Ana Costa', 'F', '1995-05-04', '333.444.555-66', '3456789', '(71) 97777-3333', 'ana@email.com', 'Google', 'Dependente', 'Premium', '40000-002', 'Rua da Paz', '789', 'Centro', 'Salvador', 'BA', 'Prefere horários pela manhã', '');

    const insertEmployee = db.prepare('INSERT INTO employees (name, phone, email, specialty, commission_rate, active) VALUES (?, ?, ?, ?, ?, ?)');
    insertEmployee.run('Ana Paula', '(71) 96666-1111', 'ana.paula@salao.com', 'Cabelo,Coloração', 40, 1);
    insertEmployee.run('Maria Clara', '(71) 95555-2222', 'maria.clara@salao.com', 'Unhas,Sobrancelhas', 35, 1);
    insertEmployee.run('Juliana', '(71) 94444-3333', 'juliana@salao.com', 'Maquiagem,Cabelo', 45, 1);
    insertEmployee.run('Carla', '(71) 93333-4444', 'carla@salao.com', 'Cabelo,Hidratação', 38, 1);

    const insertService = db.prepare('INSERT INTO services (name, description, price, duration_minutes, active) VALUES (?, ?, ?, ?, ?)');
    insertService.run('Corte Feminino', 'Corte com finalização', 80, 60, 1);
    insertService.run('Corte Masculino', 'Corte tradicional', 50, 30, 1);
    insertService.run('Escova Progressiva', 'Tratamento progressivo', 150, 120, 1);
    insertService.run('Coloração', 'Coloração completa', 120, 90, 1);
    insertService.run('Hidratação Capilar', 'Tratamento hidratante', 70, 40, 1);
    insertService.run('Manicure', 'Cuidado das unhas', 25, 30, 1);
    insertService.run('Pedicure', 'Cuidado dos pés', 25, 30, 1);
    insertService.run('Maquiagem', 'Maquiagem social', 100, 60, 1);
    insertService.run('Design de Sobrancelhas', 'Modelagem de sobrancelhas', 35, 20, 1);

    const insertProduct = db.prepare('INSERT INTO products (code, name, description, product_group, type, cost, sale_price, unit, stock, min_stock, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertProduct.run('PROD-001', 'Shampoo Hidratante 500ml', 'Shampoo profissional para cabelos secos e danificados', 'Shampoo', 'garrafa', 22.50, 45.00, 'ml', 15, 5, 1);
    insertProduct.run('PROD-002', 'Máscara de Hidratação 300g', 'Tratamento profundo com queratina e óleos essenciais', 'Tratamento', 'pote', 30.00, 65.00, 'g', 8, 3, 1);
    insertProduct.run('PROD-003', 'Tinta Profissional Louro Médio 7.0', 'Coloração permanente de alta performance', 'Coloração', 'tubo', 18.00, 35.00, 'ml', 20, 10, 1);
    insertProduct.run('PROD-004', 'Óleo de Argan 60ml', 'Finalizador e reparador de pontas com argan puro', 'Finalização', 'bisnaga', 25.00, 55.00, 'ml', 12, 5, 1);
    insertProduct.run('PROD-005', 'Kit Manicure Profissional', 'Kit com alicate, espátula e cortador de unha', 'Acessórios', 'caixa', 35.00, 89.00, 'un', 6, 3, 1);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const insertAppointment = db.prepare('INSERT INTO appointments (client_id, employee_id, service_id, date, time, status, notes, total_price, commission_processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertAppointment.run(1, 1, 1, today, '10:00', 'atendido', '', 80, 0);
    insertAppointment.run(2, 3, 4, today, '14:00', 'concluido', 'Cor intensa', 120, 0);
    insertAppointment.run(3, 2, 6, tomorrow, '09:00', 'agendado', '', 25, 0);

    const insertCategory = db.prepare('INSERT INTO financial_categories (name, type, icon, color, active) VALUES (?, ?, ?, ?, ?)');
    insertCategory.run('Serviços', 'receita', '✂️', '#27ae60', 1);
    insertCategory.run('Venda de Produtos', 'receita', '📦', '#2ecc71', 1);
    insertCategory.run('Aluguel', 'despesa', '🏠', '#e74c3c', 1);
    insertCategory.run('Produtos (Compra)', 'despesa', '🛒', '#c0392b', 1);
    insertCategory.run('Salários/Comissões', 'despesa', '💵', '#e67e22', 1);
    insertCategory.run('Conta de Luz', 'despesa', '💡', '#f39c12', 1);
    insertCategory.run('Conta de Água', 'despesa', '💧', '#3498db', 1);
    insertCategory.run('Internet/Telefone', 'despesa', '📱', '#9b59b6', 1);
    insertCategory.run('Material de Limpeza', 'despesa', '🧹', '#1abc9c', 1);
    insertCategory.run('Marketing', 'despesa', '📢', '#2980b9', 1);
    insertCategory.run('Outras Receitas', 'receita', '💰', '#16a085', 1);
    insertCategory.run('Outras Despesas', 'despesa', '📝', '#d35400', 1);

    const insertAccount = db.prepare('INSERT INTO financial_accounts (name, type, balance, active) VALUES (?, ?, ?, ?)');
    insertAccount.run('Caixa', 'dinheiro', 5000.00, 1);
    insertAccount.run('Banco Itaú - CC 12345', 'banco', 12500.00, 1);
    insertAccount.run('PIX', 'digital', 3200.00, 1);
    insertAccount.run('Maquininha Cartão', 'cartao', 8500.00, 1);

    const insertPaymentMethod = db.prepare('INSERT INTO payment_methods (name, type, icon, max_installments, active) VALUES (?, ?, ?, ?, ?)');
    insertPaymentMethod.run('Dinheiro', 'dinheiro', '💵', 1, 1);
    insertPaymentMethod.run('PIX', 'digital', '📱', 1, 1);
    insertPaymentMethod.run('Cartão Débito', 'cartao', '💳', 1, 1);
    insertPaymentMethod.run('Cartão Crédito', 'cartao', '💳', 1, 1);
    insertPaymentMethod.run('Cartão Crédito (Parcelado)', 'parcelado', '💳', 12, 1);
    insertPaymentMethod.run('Boleto', 'boleto', '📄', 1, 1);
    insertPaymentMethod.run('Crédito do Cliente', 'credito', '🔵', 1, 1);
    insertPaymentMethod.run('Transferência', 'digital', '🏦', 1, 1);

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const insertCashRegister = db.prepare('INSERT INTO cash_registers (opened_at, closed_at, initial_amount, final_amount, status, notes, user) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertCashRegister.run(`${today} 08:00:00`, null, 500.00, null, 'aberto', 'Turno manhã', 'Admin');
    insertCashRegister.run(`${yesterday} 08:00:00`, `${yesterday} 18:00:00`, 500.00, 1850.00, 'fechado', 'Turno manhã', 'Admin');

    const insertCashTransaction = db.prepare('INSERT INTO cash_transactions (register_id, type, description, client_id, items, subtotal, discount, total, payment_method_id, payment_method_name, status, created_at, user) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertCashTransaction.run(1, 'venda', 'Corte Feminino - Maria Silva', 1, JSON.stringify([{type: 'servico', name: 'Corte Feminino', price: 80.00, qty: 1}]), 80.00, 0.00, 80.00, 1, 'Dinheiro', 'finalizado', `${today} 10:15:00`, 'Admin');
    insertCashTransaction.run(1, 'suprimento', 'Reforço de troco', null, '[]', 0.00, 0.00, 200.00, 1, 'Dinheiro', 'finalizado', `${today} 08:30:00`, 'Admin');
    insertCashTransaction.run(1, 'sangria', 'Pagamento conta de luz', null, '[]', 0.00, 0.00, 150.00, 1, 'Dinheiro', 'finalizado', `${today} 12:00:00`, 'Admin');
    insertCashTransaction.run(1, 'venda', 'Shampoo + Corte - João Santos', 2, JSON.stringify([{type: 'servico', name: 'Corte Masculino', price: 50.00, qty: 1}, {type: 'produto', name: 'Shampoo Hidratante', price: 45.00, qty: 1}]), 95.00, 5.00, 90.00, 2, 'PIX', 'finalizado', `${today} 11:30:00`, 'Admin');

    const insertFinancialTransaction = db.prepare('INSERT INTO financial_transactions (code, type, category_id, account_id, payment_method_id, client_id, appointment_id, description, amount, installments, due_date, paid_date, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertFinancialTransaction.run('FIN-001', 'receita', 1, 1, 1, 1, 1, 'Corte Feminino - Maria Silva', 80.00, 1, today, today, 'pago', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-002', 'receita', 1, 3, 2, 2, 2, 'Coloração - João Santos', 120.00, 1, today, null, 'pendente', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-003', 'despesa', 3, 2, 6, null, null, 'Aluguel do salão - Maio', 3500.00, 1, '2026-05-10', null, 'pendente', 'Vencimento dia 10', new Date().toISOString());
    insertFinancialTransaction.run('FIN-004', 'despesa', 4, 2, 3, null, null, 'Compra de produtos - Distribuidora XYZ', 850.00, 1, today, today, 'pago', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-005', 'despesa', 5, 1, 1, null, null, 'Comissão Ana Paula - Semana', 450.00, 1, today, today, 'pago', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-006', 'despesa', 6, 2, 8, null, null, 'Conta de Luz', 280.00, 1, '2026-05-15', null, 'pendente', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-007', 'receita', 2, 4, 3, 1, null, 'Venda Shampoo Hidratante', 45.00, 1, today, today, 'pago', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-008', 'receita', 1, 4, 5, 3, 3, 'Manicure - Ana Costa (2x)', 25.00, 2, today, null, 'parcial', 'Parcela 1/2', new Date().toISOString());
    insertFinancialTransaction.run('FIN-009', 'despesa', 10, 2, 2, null, null, 'Anúncio Instagram', 150.00, 1, '2026-05-20', null, 'pendente', '', new Date().toISOString());
    insertFinancialTransaction.run('FIN-010', 'despesa', 7, 2, 8, null, null, 'Conta de Água', 120.00, 1, '2026-05-18', null, 'pendente', '', new Date().toISOString());

    const insertStockMovement = db.prepare('INSERT INTO stock_movements (product_id, type, quantity, date, reason, user) VALUES (?, ?, ?, ?, ?, ?)');
    insertStockMovement.run(1, 'entrada', 20, '2024-01-15', 'Compra fornecedor', 'Admin');
    insertStockMovement.run(1, 'saida', 5, '2024-02-20', 'Venda no caixa', 'Admin');
    insertStockMovement.run(3, 'entrada', 25, '2024-02-01', 'Compra fornecedor', 'Admin');
    insertStockMovement.run(3, 'saida', 5, '2024-03-10', 'Uso em serviço', 'Admin');

    const insertSalonService = db.prepare('INSERT INTO salon_services (name, price, duration, category) VALUES (?, ?, ?, ?)');
    insertSalonService.run('Corte Feminino', 80, '60 min', 'Cabelo');
    insertSalonService.run('Corte Masculino', 50, '30 min', 'Cabelo');
    insertSalonService.run('Escova Progressiva', 150, '120 min', 'Cabelo');
    insertSalonService.run('Coloração', 120, '90 min', 'Cabelo');
    insertSalonService.run('Hidratação Capilar', 70, '40 min', 'Cabelo');
    insertSalonService.run('Manicure', 25, '30 min', 'Unhas');
    insertSalonService.run('Pedicure', 25, '30 min', 'Unhas');
    insertSalonService.run('Maquiagem', 100, '60 min', 'Maquiagem');
    insertSalonService.run('Design de Sobrancelhas', 35, '20 min', 'Sobrancelhas');

    const insertSalonProfessional = db.prepare('INSERT INTO salon_professionals (name, specialties) VALUES (?, ?)');
    insertSalonProfessional.run('Ana Paula', 'Cabelo,Coloração');
    insertSalonProfessional.run('Maria Clara', 'Unhas,Sobrancelhas');
    insertSalonProfessional.run('Juliana', 'Maquiagem,Cabelo');
    insertSalonProfessional.run('Carla', 'Cabelo,Hidratação');

    const insertSalonBooking = db.prepare('INSERT INTO salon_bookings (clientName, clientPhone, serviceId, professionalId, date, time, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertSalonBooking.run('Maria Silva', '(71) 99999-1111', 1, 1, today, '10:00', 80, 'pending');
    insertSalonBooking.run('Ana Costa', '(71) 97777-3333', 4, 3, today, '14:00', 120, 'pending');
  });

  seed();
}

function getDB() {
  if (!db) {
    initDB();
  }
  return db;
}

function closeDB() {
  if (db) {
    db.close();
  }
}

module.exports = { initDB, getDB, closeDB };
