-- Habilitar extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own company data" ON companies;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments" ON appointments;

-- Remover tabelas existentes
DROP TABLE IF EXISTS business_hours;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS user_auth;
DROP TABLE IF EXISTS url_validations;
DROP TABLE IF EXISTS client_company_interactions;
DROP TABLE IF EXISTS company_users;
DROP TABLE IF EXISTS companies;

-- Tabela para armazenar as empresas (companies)
CREATE TABLE companies (
  whatsapp VARCHAR(13) PRIMARY KEY CHECK (whatsapp ~ '^\d{13}$'),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  professional_name VARCHAR(255),
  cpf_cnpj VARCHAR(20),
  social_media TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para validações de URL
CREATE TABLE url_validations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp) ON DELETE CASCADE,
  client_whatsapp VARCHAR(13) NOT NULL CHECK (client_whatsapp ~ '^\d{13}$'),
  security_code VARCHAR(50) NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_whatsapp, client_whatsapp, security_code)
);

-- Tabela para usuários administrativos das empresas
CREATE TABLE company_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Tabela para autenticação de clientes finais
CREATE TABLE user_auth (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_whatsapp VARCHAR(13) NOT NULL CHECK (company_whatsapp ~ '^\d{13}$'),
  client_whatsapp VARCHAR(13) NOT NULL CHECK (client_whatsapp ~ '^\d{13}$'),
  security_code VARCHAR(8) NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance de busca
CREATE INDEX idx_user_auth_company_client ON user_auth(company_whatsapp, client_whatsapp);
CREATE INDEX idx_user_auth_valid_codes ON user_auth(company_whatsapp, client_whatsapp, is_valid, expires_at);

-- Tabela para registrar histórico de interações entre clientes e empresas
CREATE TABLE client_company_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_whatsapp VARCHAR(13) NOT NULL CHECK (company_whatsapp ~ '^\d{13}$'),
  client_whatsapp VARCHAR(13) NOT NULL CHECK (client_whatsapp ~ '^\d{13}$'),
  client_name VARCHAR(255),
  first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_interactions INTEGER DEFAULT 1,
  UNIQUE(company_whatsapp, client_whatsapp)
);

-- Índice para melhorar performance de busca de interações
CREATE INDEX idx_interactions_company ON client_company_interactions(company_whatsapp);
CREATE INDEX idx_interactions_client ON client_company_interactions(client_whatsapp);

-- Tabela para serviços oferecidos por cada empresa
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance de busca
CREATE INDEX idx_services_company ON services(company_whatsapp);

-- Tabela para agendamentos
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp) ON DELETE CASCADE,
  client_whatsapp VARCHAR(13) NOT NULL CHECK (client_whatsapp ~ '^\d{13}$'),
  client_name VARCHAR(255) NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para melhorar performance de busca
CREATE INDEX idx_appointments_company ON appointments(company_whatsapp);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Tabela para horários de funcionamento das empresas
CREATE TABLE business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  is_open BOOLEAN DEFAULT false,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  slot_duration INTEGER DEFAULT 30, -- duração do slot em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_whatsapp, day_of_week)
);

-- Índices para melhor performance
CREATE INDEX idx_user_auth_client_whatsapp ON user_auth(client_whatsapp);
CREATE INDEX idx_user_auth_company_whatsapp ON user_auth(company_whatsapp);
CREATE INDEX idx_services_company_whatsapp ON services(company_whatsapp);
CREATE INDEX idx_business_hours_company_whatsapp ON business_hours(company_whatsapp);
CREATE INDEX idx_client_company_interactions_company ON client_company_interactions(company_whatsapp);
CREATE INDEX idx_client_company_interactions_client ON client_company_interactions(client_whatsapp);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_updated_at
  BEFORE UPDATE ON user_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies para segurança
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_company_interactions ENABLE ROW LEVEL SECURITY;

-- Policies básicas (ajuste conforme necessário)
CREATE POLICY "Allow public access to companies" ON companies FOR ALL USING (true);
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Users can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Users can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Users can manage services" ON services FOR ALL USING (true);
CREATE POLICY "Users can view business hours" ON business_hours FOR SELECT USING (true);
CREATE POLICY "Users can manage business hours" ON business_hours FOR ALL USING (true);
CREATE POLICY "Users can view interactions" ON client_company_interactions FOR SELECT USING (true);
CREATE POLICY "Users can manage interactions" ON client_company_interactions FOR ALL USING (true);
