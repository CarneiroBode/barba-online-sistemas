
-- Dados de exemplo para testes

-- Inserir empresa de exemplo
INSERT INTO companies (company_id, name, address, phone, whatsapp, professional_name) VALUES 
('barber_shop_001', 'Barbearia do João', 'Rua das Flores, 123 - Centro', '(11) 9999-8888', '11999998888', 'João Silva');

-- Inserir usuário admin da empresa
INSERT INTO company_users (company_id, username, password, name, role) VALUES 
('barber_shop_001', 'admin', 'admin123', 'João Silva', 'admin');

-- Inserir usuário super admin
INSERT INTO company_users (company_id, username, password, name, role) VALUES 
('barber_shop_001', 'superadmin', 'super123', 'Super Admin', 'superadmin');

-- Inserir serviços de exemplo
INSERT INTO services (company_id, name, duration, price, description) VALUES 
('barber_shop_001', 'Corte Masculino', 30, 25.00, 'Corte de cabelo masculino tradicional'),
('barber_shop_001', 'Barba', 20, 15.00, 'Aparar e modelar barba'),
('barber_shop_001', 'Corte + Barba', 45, 35.00, 'Corte completo com barba');

-- Inserir horários de funcionamento (Segunda a Sexta: 8:00-18:00, Sábado: 8:00-16:00)
INSERT INTO business_hours (company_id, day_of_week, is_open, open_time, close_time, break_start, break_end, slot_duration) VALUES 
('barber_shop_001', 1, true, '08:00', '18:00', '12:00', '13:00', 30), -- Segunda
('barber_shop_001', 2, true, '08:00', '18:00', '12:00', '13:00', 30), -- Terça
('barber_shop_001', 3, true, '08:00', '18:00', '12:00', '13:00', 30), -- Quarta
('barber_shop_001', 4, true, '08:00', '18:00', '12:00', '13:00', 30), -- Quinta
('barber_shop_001', 5, true, '08:00', '18:00', '12:00', '13:00', 30), -- Sexta
('barber_shop_001', 6, true, '08:00', '16:00', NULL, NULL, 30), -- Sábado
('barber_shop_001', 0, false, NULL, NULL, NULL, NULL, 30); -- Domingo fechado
