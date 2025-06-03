
-- ================================
-- SETUP COMPLETO DO SUPABASE
-- Sistema de Agendamentos
-- ================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TABELA: COMPANIES (Empresas que usam o sistema)
-- ================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id VARCHAR(50) UNIQUE NOT NULL, -- ID único gerado para cada empresa
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  professional_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true -- Para desativar empresas sem deletar
);

-- ================================
-- TABELA: COMPANY_USERS (Usuários administrativos das empresas)
-- ================================
CREATE TABLE IF NOT EXISTS company_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ================================
-- TABELA: USER_AUTH (Clientes que fazem agendamentos)
-- ================================
CREATE TABLE IF NOT EXISTS user_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  securitycode VARCHAR(50) NOT NULL,
  company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- TABELA: SERVICES (Serviços oferecidos por cada empresa)
-- ================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL, -- duração em minutos
  price DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- TABELA: APPOINTMENTS (Agendamentos)
-- ================================
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  securitycode VARCHAR(50) NOT NULL,
  service JSONB NOT NULL, -- armazena dados do serviço
  professional VARCHAR(255),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true -- Para manter histórico sem deletar
);

-- ================================
-- TABELA: BUSINESS_HOURS (Horários de funcionamento)
-- ================================
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id VARCHAR(50) REFERENCES companies(company_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  is_open BOOLEAN DEFAULT false,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  slot_duration INTEGER DEFAULT 30, -- duração do slot em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, day_of_week)
);

-- ================================
-- ÍNDICES PARA PERFORMANCE
-- ================================
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON companies(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_username ON company_users(username);
CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON appointments(company_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_is_active ON appointments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_auth_phone ON user_auth(phone);
CREATE INDEX IF NOT EXISTS idx_user_auth_company_id ON user_auth(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_business_hours_company_id ON business_hours(company_id);

-- ================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at 
    BEFORE UPDATE ON company_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_updated_at 
    BEFORE UPDATE ON user_auth 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at 
    BEFORE UPDATE ON business_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- ================================
-- POLÍTICAS DE SEGURANÇA BÁSICAS
-- ================================
-- Permite leitura geral (ajuste conforme necessário para produção)
CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON company_users FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON user_auth FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON business_hours FOR SELECT USING (true);

-- Permite inserção/atualização (ajuste conforme necessário para produção)
CREATE POLICY "Allow public insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON company_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON user_auth FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON business_hours FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON company_users FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON user_auth FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON business_hours FOR UPDATE USING (true);

-- ================================
-- DADOS DE EXEMPLO PARA TESTE
-- ================================

-- Inserir empresa de exemplo
INSERT INTO companies (company_id, name, address, phone, whatsapp, professional_name) 
VALUES ('barber_shop_001', 'Barbearia do João', 'Rua das Flores, 123 - Centro', '(11) 9999-8888', '11999998888', 'João Silva')
ON CONFLICT (company_id) DO NOTHING;

-- Inserir usuário super admin padrão
INSERT INTO company_users (company_id, username, password, name, role) 
VALUES ('barber_shop_001', 'admin', 'admin123', 'Super Admin', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- Inserir serviços de exemplo
INSERT INTO services (company_id, name, duration, price, description) VALUES 
('barber_shop_001', 'Corte Masculino', 30, 25.00, 'Corte de cabelo masculino tradicional'),
('barber_shop_001', 'Barba', 20, 15.00, 'Aparar e modelar barba'),
('barber_shop_001', 'Corte + Barba', 45, 35.00, 'Corte completo com barba')
ON CONFLICT DO NOTHING;

-- Inserir horários de funcionamento (Segunda a Sexta: 8:00-18:00, Sábado: 8:00-16:00)
INSERT INTO business_hours (company_id, day_of_week, is_open, open_time, close_time, break_start, break_end, slot_duration) VALUES 
('barber_shop_001', 1, true, '08:00', '18:00', '12:00', '13:00', 30), -- Segunda
('barber_shop_001', 2, true, '08:00', '18:00', '12:00', '13:00', 30), -- Terça
('barber_shop_001', 3, true, '08:00', '18:00', '12:00', '13:00', 30), -- Quarta
('barber_shop_001', 4, true, '08:00', '18:00', '12:00', '13:00', 30), -- Quinta
('barber_shop_001', 5, true, '08:00', '18:00', '12:00', '13:00', 30), -- Sexta
('barber_shop_001', 6, true, '08:00', '16:00', NULL, NULL, 30), -- Sábado
('barber_shop_001', 0, false, NULL, NULL, NULL, NULL, 30) -- Domingo fechado
ON CONFLICT (company_id, day_of_week) DO NOTHING;

-- ================================
-- VERIFICAÇÃO FINAL
-- ================================
-- Mostrar resumo das tabelas criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'company_users', 'user_auth', 'services', 'appointments', 'business_hours')
ORDER BY tablename;
