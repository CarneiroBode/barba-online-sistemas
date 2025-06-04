-- Tabela para armazenar as empresas (companies)
CREATE TABLE companies (
  whatsapp VARCHAR(13) PRIMARY KEY CHECK (whatsapp ~ '^\d{13}$'),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  professional_name VARCHAR(255),
  social_media TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para usuários administrativos das empresas
CREATE TABLE IF NOT EXISTS company_users (
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
CREATE TABLE IF NOT EXISTS user_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_whatsapp VARCHAR(13) NOT NULL CHECK (company_whatsapp ~ '^\d{13}$'),
  client_whatsapp VARCHAR(13) NOT NULL CHECK (client_whatsapp ~ '^\d{13}$'),
  security_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_whatsapp, client_whatsapp, security_code)
);

-- Tabela para serviços oferecidos por cada empresa
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_whatsapp VARCHAR(13) REFERENCES companies(whatsapp),
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  service_id UUID REFERENCES services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para horários de funcionamento das empresas
CREATE TABLE IF NOT EXISTS business_hours (
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
CREATE INDEX IF NOT EXISTS idx_appointments_company_whatsapp ON appointments(company_whatsapp);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_user_auth_phone ON user_auth(phone);
CREATE INDEX IF NOT EXISTS idx_user_auth_company_whatsapp ON user_auth(company_whatsapp);
CREATE INDEX IF NOT EXISTS idx_services_company_whatsapp ON services(company_whatsapp);
CREATE INDEX IF NOT EXISTS idx_business_hours_company_whatsapp ON business_hours(company_whatsapp);

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

-- Policies básicas (ajuste conforme necessário)
CREATE POLICY "Users can view their own company data" ON companies FOR SELECT USING (true);
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Users can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update appointments" ON appointments FOR UPDATE USING (true);
