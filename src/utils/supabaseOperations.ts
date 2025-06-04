import { supabase } from './supabase';
import { Service, Appointment } from '@/pages/Index';

// Interfaces
export interface UserAuth {
  phone: string;
  name: string;
  securitycode: string;
  createdAt?: string;
}

interface CompanyInfo {
  company_id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  professional_name: string;
  is_active?: boolean;
}

interface CompanyUser {
  id?: string;
  company_id: string;
  username: string;
  password: string;
  name: string;
  role: 'superadmin' | 'admin';
  is_active?: boolean;
}

// Funções de Autenticação
export const generateSecurityCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const validateUserAccess = async (phone: string, securityCode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_auth')
      .select('*')
      .eq('phone', phone)
      .eq('securitycode', securityCode)
      .single();

    if (error) {
      console.error('Erro ao validar acesso:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Erro na validação:', error);
    return false;
  }
};

export const upsertUser = async (phone: string, name: string): Promise<string> => {
  const securityCode = generateSecurityCode();
  
  try {
    const { data, error } = await supabase
      .from('user_auth')
      .upsert({
        phone,
        name,
        securitycode: securityCode
      }, {
        onConflict: 'phone'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar usuário:', error);
      throw error;
    }

    return securityCode;
  } catch (error) {
    console.error('Erro no upsert:', error);
    throw error;
  }
};

export const getUserByPhone = async (phone: string): Promise<UserAuth | null> => {
  try {
    const { data, error } = await supabase
      .from('user_auth')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro na busca:', error);
    return null;
  }
};

export const saveAppointmentToSupabase = async (appointment: Appointment, phone: string, securityCode: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert({
        id: appointment.id,
        phone,
        name: appointment.clientName,
        securitycode: securityCode,
        service: appointment.service,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        company_id: appointment.companyId
      });

    if (error) {
      console.error('Erro ao salvar agendamento:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro no salvamento:', error);
    throw error;
  }
};

export const generateSecureLink = (phone: string, securityCode: string, companyId?: string): string => {
  const baseUrl = window.location.origin;
  if (companyId) {
    return `${baseUrl}/${companyId}?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(securityCode)}`;
  }
  return `${baseUrl}?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(securityCode)}`;
};

// Operações de Empresas
export const saveCompanyInfo = async (companyInfo: CompanyInfo) => {
  const { data, error } = await supabase
    .from('companies')
    .upsert({
      company_id: companyInfo.company_id,
      name: companyInfo.name,
      address: companyInfo.address,
      phone: companyInfo.phone,
      whatsapp: companyInfo.whatsapp,
      professional_name: companyInfo.professional_name,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCompanyInfo = async (companyId: string) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) throw error;
  return data;
};

// Operações de Usuários
export const saveCompanyUser = async (user: CompanyUser) => {
  const { data, error } = await supabase
    .from('company_users')
    .upsert({
      company_id: user.company_id,
      username: user.username,
      password: user.password, // Em produção, deve-se usar hash
      name: user.name,
      role: user.role,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCompanyUsers = async () => {
  const { data, error } = await supabase
    .from('company_users')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

// Operações de Serviços
export const saveService = async (service: Service, companyId: string) => {
  const { data, error } = await supabase
    .from('services')
    .upsert({
      company_id: companyId,
      name: service.name,
      duration: service.duration,
      price: service.price,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getServices = async (companyId: string) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

export const deleteService = async (serviceId: string) => {
  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', serviceId);

  if (error) throw error;
};

// Operações de Agendamentos
export const saveAppointment = async (appointment: Appointment, companyId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .upsert({
      id: appointment.id,
      company_id: companyId,
      phone: appointment.clientPhone,
      name: appointment.clientName,
      service: appointment.service,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAppointments = async (companyId: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled') => {
  const { error } = await supabase
    .from('appointments')
    .update({ 
      status,
      cancelled_at: status === 'cancelled' ? new Date().toISOString() : null
    })
    .eq('id', appointmentId);

  if (error) throw error;
};

// Operações de Horários de Funcionamento
export const saveBusinessHours = async (
  companyId: string,
  dayOfWeek: number,
  isOpen: boolean,
  openTime?: string,
  closeTime?: string,
  breakStart?: string,
  breakEnd?: string,
  slotDuration: number = 30
) => {
  const { error } = await supabase
    .from('business_hours')
    .upsert({
      company_id: companyId,
      day_of_week: dayOfWeek,
      is_open: isOpen,
      open_time: openTime,
      close_time: closeTime,
      break_start: breakStart,
      break_end: breakEnd,
      slot_duration: slotDuration
    });

  if (error) throw error;
};

export const getBusinessHours = async (companyId: string) => {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('company_id', companyId);

  if (error) throw error;
  return data;
}; 