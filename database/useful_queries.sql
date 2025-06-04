
-- Consultas úteis para gerenciamento do sistema

-- 1. Buscar todos os agendamentos de uma empresa
SELECT 
    a.id,
    a.name as client_name,
    a.phone,
    a.service,
    a.professional,
    a.date,
    a.time,
    a.status,
    a.created_at
FROM appointments a
WHERE a.company_id = 'barber_shop_001'
AND a.is_active = true
ORDER BY a.date DESC, a.time;

-- 2. Relatório de agendamentos por período
SELECT 
    DATE(a.date) as appointment_date,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed
FROM appointments a
WHERE a.company_id = 'barber_shop_001'
AND a.date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY DATE(a.date)
ORDER BY appointment_date;

-- 3. Buscar horários disponíveis para um dia específico
SELECT 
    bh.open_time,
    bh.close_time,
    bh.break_start,
    bh.break_end,
    bh.slot_duration
FROM business_hours bh
WHERE bh.company_id = 'barber_shop_001'
AND bh.day_of_week = EXTRACT(DOW FROM DATE '2024-01-15'); -- 1 = segunda-feira

-- 4. Relatório de serviços mais procurados
SELECT 
    s.name as service_name,
    COUNT(a.id) as bookings_count,
    AVG(s.price) as avg_price
FROM services s
LEFT JOIN appointments a ON a.company_id = s.company_id 
    AND (a.service->>'name')::text = s.name
WHERE s.company_id = 'barber_shop_001'
AND s.is_active = true
GROUP BY s.name
ORDER BY bookings_count DESC;

-- 5. Clientes mais frequentes
SELECT 
    a.name as client_name,
    a.phone,
    COUNT(*) as total_appointments,
    MAX(a.date) as last_appointment
FROM appointments a
WHERE a.company_id = 'barber_shop_001'
AND a.status IN ('confirmed', 'completed')
AND a.is_active = true
GROUP BY a.name, a.phone
HAVING COUNT(*) > 1
ORDER BY total_appointments DESC;

-- 6. Agendamentos cancelados com motivo
SELECT 
    a.name as client_name,
    a.phone,
    a.date,
    a.time,
    a.cancellation_reason,
    a.cancelled_at
FROM appointments a
WHERE a.company_id = 'barber_shop_001'
AND a.status = 'cancelled'
ORDER BY a.cancelled_at DESC;

-- 7. Empresas ativas no sistema
SELECT 
    c.company_id,
    c.name,
    c.professional_name,
    c.phone,
    c.created_at,
    COUNT(a.id) as total_appointments
FROM companies c
LEFT JOIN appointments a ON a.company_id = c.company_id
WHERE c.is_active = true
GROUP BY c.company_id, c.name, c.professional_name, c.phone, c.created_at
ORDER BY total_appointments DESC;

-- 8. Limpar dados de teste (use com cuidado!)
-- DELETE FROM appointments WHERE company_id = 'test_company';
-- DELETE FROM services WHERE company_id = 'test_company';
-- DELETE FROM business_hours WHERE company_id = 'test_company';
-- DELETE FROM user_auth WHERE company_id = 'test_company';
-- DELETE FROM company_users WHERE company_id = 'test_company';
-- DELETE FROM companies WHERE company_id = 'test_company';
