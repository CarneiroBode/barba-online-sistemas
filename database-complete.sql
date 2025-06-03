
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar schema público se não existir
CREATE SCHEMA IF NOT EXISTS public;

-- Criar tabela de empresas
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de usuários de empresas
CREATE TABLE company_users (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de autenticação de usuários
CREATE TABLE user_auth (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_id INTEGER REFERENCES company_users(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de horários de funcionamento
CREATE TABLE business_hours (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, day_of_week)
);

-- Criar tabela de serviços
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    price DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de agendamentos
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_by INTEGER REFERENCES company_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de validações de URL (sua implementação atual)
CREATE TABLE url_validations (
    id SERIAL PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    whatsapp TEXT NOT NULL,
    codigo TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT false
);

-- Criar índices para melhor performance
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_user_auth_company_id ON user_auth(company_id);
CREATE INDEX idx_user_auth_username ON user_auth(username);
CREATE INDEX idx_business_hours_company_id ON business_hours(company_id);
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_url_validations_company_id ON url_validations(company_id);
CREATE INDEX idx_url_validations_whatsapp_codigo ON url_validations(whatsapp, codigo);
CREATE INDEX idx_url_validations_used ON url_validations(used);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON company_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_updated_at BEFORE UPDATE ON user_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO companies (id, name, active) VALUES 
('1', 'Empresa Exemplo 1', true),
('2', 'Empresa Exemplo 2', true),
('ABC123', 'Clínica Médica ABC', true),
('XYZ789', 'Salão de Beleza XYZ', true);

-- Inserir usuários da empresa
INSERT INTO company_users (company_id, name, email, phone, role) VALUES 
('1', 'Admin Principal', 'admin@empresa1.com', '11999999999', 'admin'),
('1', 'Atendente 1', 'atendente1@empresa1.com', '11888888888', 'user'),
('2', 'Gerente', 'gerente@empresa2.com', '11777777777', 'admin');

-- Inserir autenticação
INSERT INTO user_auth (company_id, username, password, user_id) VALUES 
('1', 'admin1', '$2b$10$exemplo_hash_senha_1', 1),
('1', 'atendente1', '$2b$10$exemplo_hash_senha_2', 2),
('2', 'gerente2', '$2b$10$exemplo_hash_senha_3', 3);

-- Inserir horários de funcionamento (empresa 1 - segunda a sexta)
INSERT INTO business_hours (company_id, day_of_week, open_time, close_time, is_closed) VALUES 
('1', 1, '08:00', '18:00', false), -- Segunda
('1', 2, '08:00', '18:00', false), -- Terça
('1', 3, '08:00', '18:00', false), -- Quarta
('1', 4, '08:00', '18:00', false), -- Quinta
('1', 5, '08:00', '18:00', false), -- Sexta
('1', 6, '08:00', '12:00', false), -- Sábado
('1', 0, null, null, true); -- Domingo fechado

-- Inserir serviços
INSERT INTO services (company_id, name, description, duration_minutes, price) VALUES 
('1', 'Consulta Médica', 'Consulta médica geral', 30, 150.00),
('1', 'Exame de Rotina', 'Exames laboratoriais básicos', 15, 80.00),
('2', 'Corte de Cabelo', 'Corte masculino/feminino', 45, 50.00),
('2', 'Coloração', 'Coloração completa', 120, 200.00);

-- Inserir alguns agendamentos de exemplo
INSERT INTO appointments (company_id, service_id, customer_name, customer_phone, appointment_date, appointment_time, status, created_by) VALUES 
('1', 1, 'João Silva', '11987654321', CURRENT_DATE + INTERVAL '1 day', '09:00', 'scheduled', 1),
('1', 2, 'Maria Santos', '11876543210', CURRENT_DATE + INTERVAL '2 days', '14:30', 'confirmed', 1),
('2', 3, 'Pedro Oliveira', '11765432109', CURRENT_DATE + INTERVAL '1 day', '10:00', 'scheduled', 3);

-- Políticas de segurança RLS (Row Level Security) - opcional
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_validations ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE companies IS 'Tabela de empresas/clientes do sistema';
COMMENT ON TABLE company_users IS 'Usuários vinculados às empresas';
COMMENT ON TABLE user_auth IS 'Autenticação dos usuários';
COMMENT ON TABLE business_hours IS 'Horários de funcionamento das empresas';
COMMENT ON TABLE services IS 'Serviços oferecidos pelas empresas';
COMMENT ON TABLE appointments IS 'Agendamentos realizados';
COMMENT ON TABLE url_validations IS 'Validações de URLs geradas pelo N8N';
