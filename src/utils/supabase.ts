
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhdtarrgtlyxwqbexhcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZHRhcnJndGx5eHdxYmV4aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTk2NjcsImV4cCI6MjA2MjYzNTY2N30._JeB0QOXlK8YqdpUeEYDxNuS5YuRckmwi5QURVijnlA'; // Chave pública (anon key)

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserAuth {
  phone: string;
  name: string;
  securityCode: string;
  createdAt?: string;
}

export interface SecureAppointment {
  id: string;
  phone: string;
  name: string;
  securityCode: string;
  service: any;
  professional: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  createdAt?: string;
}

// Gerar código de segurança único
export const generateSecurityCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validar acesso do usuário
export const validateUserAccess = async (phone: string, securityCode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_auth')
      .select('*')
      .eq('phone', phone)
      .eq('securityCode', securityCode)
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

// Criar ou atualizar usuário
export const upsertUser = async (phone: string, name: string): Promise<string> => {
  const securityCode = generateSecurityCode();
  
  try {
    const { data, error } = await supabase
      .from('user_auth')
      .upsert({
        phone,
        name,
        securityCode
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

// Buscar usuário por telefone
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

// Salvar agendamento no Supabase
export const saveAppointmentToSupabase = async (appointment: any, phone: string, securityCode: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert({
        id: appointment.id,
        phone,
        name: appointment.clientName,
        securityCode,
        service: appointment.service,
        professional: appointment.professional,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
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

// Gerar link seguro para agendamento
export const generateSecureLink = (phone: string, securityCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(securityCode)}`;
};
