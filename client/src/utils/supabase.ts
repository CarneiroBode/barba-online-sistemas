import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jhdtarrgtlyxwqbexhcg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZHRhcnJndGx5eHdxYmV4aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNTk2NjcsImV4cCI6MjA2MjYzNTY2N30._JeB0QOXlK8YqdpUeEYDxNuS5YuRckmwi5QURVijnlA'; // Chave pública (anon key)

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserAuth {
  whatsapp: string;
  name: string;
  securitycode: string; // Minúsculo para compatibilidade com n8n
  createdAt?: string;
}

export interface SecureAppointment {
  id: string;
  whatsapp: string;
  name: string;
  securitycode: string; // Minúsculo para compatibilidade com n8n
  service: any;
  professional: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  companyId?: string;
  createdAt?: string;
}

// Gerar código de segurança único
export const generateSecurityCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validar acesso do usuário
export const validateUserAccess = async (whatsapp: string, securityCode: string, companyId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('user_auth')
      .select('*')
      .eq('whatsapp', whatsapp)
      .eq('securitycode', securityCode);

    // Se companyId é fornecido, incluir na validação
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.single();

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

// Verificar se empresa existe no Supabase
export const checkCompanyExists = async (companyId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao verificar empresa:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Erro na verificação de empresa:', error);
    return false;
  }
};

// Criar ou atualizar usuário
export const upsertUser = async (whatsapp: string, name: string, companyId?: string): Promise<string> => {
  const securityCode = generateSecurityCode();
  
  try {
    // Se companyId é fornecido, verificar se a empresa existe no Supabase
    if (companyId) {
      const companyExists = await checkCompanyExists(companyId);
      if (!companyExists) {
        throw new Error(`Empresa ${companyId} não encontrada. Verifique se a empresa está cadastrada no sistema.`);
      }
    }

    const userData: any = {
      whatsapp,
      name,
      securitycode: securityCode
    };

    // Adicionar company_id se fornecido e a empresa existir
    if (companyId) {
      userData.company_id = companyId;
    }

    const { data, error } = await supabase
      .from('user_auth')
      .upsert(userData, {
        onConflict: 'whatsapp'
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

// Buscar usuário por whatsapp
export const getUserByWhatsapp = async (whatsapp: string, companyId?: string): Promise<UserAuth | null> => {
  try {
    let query = supabase
      .from('user_auth')
      .select('*')
      .eq('whatsapp', whatsapp);

    // Se companyId é fornecido, incluir na busca
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.single();

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
export const saveAppointmentToSupabase = async (appointment: any, whatsapp: string, securityCode: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert({
        id: appointment.id,
        whatsapp,
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

// Gerar link seguro para agendamento
export const generateSecureLink = (whatsapp: string, securityCode: string, companyId?: string): string => {
  const baseUrl = window.location.origin;
  if (companyId) {
    return `${baseUrl}/${companyId}?whatsapp=${encodeURIComponent(whatsapp)}&code=${encodeURIComponent(securityCode)}`;
  }
  return `${baseUrl}?whatsapp=${encodeURIComponent(whatsapp)}&code=${encodeURIComponent(securityCode)}`;
};
