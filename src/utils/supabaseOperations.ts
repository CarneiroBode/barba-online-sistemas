import { supabase } from '@/lib/supabase';
import { Service, Appointment } from '@/pages/Index';

// Interfaces
interface CompanyInfo {
  whatsapp: string;
  name: string;
  address: string;
  phone: string;
  professional_name: string;
  social_media?: string;
  professionalName?: string;
  socialMedia?: string;
}

interface CompanyUser {
  id: string;
  company_whatsapp: string;
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

export const validateUserAccess = async (
  companyWhatsapp: string,
  clientWhatsapp: string,
  securityCode: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('url_validations')
      .select('*')
      .eq('company_whatsapp', companyWhatsapp)
      .eq('client_whatsapp', clientWhatsapp)
      .eq('security_code', securityCode)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
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

export const saveAppointmentToSupabase = async (appointment: Appointment): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .insert({
        id: appointment.id,
        client_whatsapp: appointment.clientWhatsapp,
        client_name: appointment.clientName,
        service_id: appointment.serviceId,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        company_whatsapp: appointment.company_whatsapp
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

export const generateSecureLink = (
  companyWhatsapp: string,
  clientWhatsapp: string,
  securityCode: string
): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/${companyWhatsapp}?phone=${encodeURIComponent(clientWhatsapp)}&code=${encodeURIComponent(securityCode)}`;
};

// Operações de Empresas
export const saveCompanyInfo = async (companyInfo: CompanyInfo) => {
  try {
    console.log('Tentando salvar empresa:', companyInfo);
    
    const { data, error } = await supabase
      .from('companies')
      .upsert({
        whatsapp: companyInfo.whatsapp.replace(/\D/g, ''), // Remove formatação
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        professional_name: companyInfo.professional_name || companyInfo.professionalName, // Handle both field names
        social_media: companyInfo.social_media || companyInfo.socialMedia,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar empresa:', error);
      throw error;
    }

    console.log('Empresa salva com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao salvar empresa:', error);
    throw error;
  }
};

export const getCompanyInfo = async (whatsappId: string) => {
  try {
    console.log('Buscando empresa com WhatsApp:', whatsappId);
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('whatsapp', whatsappId.replace(/\D/g, '')) // Remove formatação
      .single();

    if (error) {
      console.error('Erro ao buscar empresa:', error);
      throw error;
    }

    console.log('Empresa encontrada:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return null;
  }
};

// Operações de Usuários
export const saveCompanyUser = async (user: CompanyUser) => {
  const { data, error } = await supabase
    .from('company_users')
    .upsert({
      company_whatsapp: user.company_whatsapp,
      username: user.username,
      password: user.password,
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
export const saveService = async (service: Service, companyWhatsapp: string) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .upsert({
        ...service,
        company_whatsapp: companyWhatsapp
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar serviço:', error);
    return null;
  }
};

export const getServices = async (companyWhatsapp: string) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_whatsapp', companyWhatsapp);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return null;
  }
};

export const deleteService = async (serviceId: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) throw error;
};

// Operações de Agendamentos
export const saveAppointment = async (appointment: Appointment, companyWhatsapp: string) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        company_whatsapp: companyWhatsapp,
        client_whatsapp: appointment.clientWhatsapp,
        client_name: appointment.clientName,
        service_id: appointment.serviceId,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status || 'pending'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    return null;
  }
};

export const getAppointments = async (companyWhatsapp: string) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_whatsapp', companyWhatsapp);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return null;
  }
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

// Função para registrar ou atualizar interação entre cliente e empresa
export const registerClientCompanyInteraction = async (
  companyWhatsapp: string,
  clientWhatsapp: string,
  clientName?: string
): Promise<boolean> => {
  try {
    const { data: existingInteraction, error: searchError } = await supabase
      .from('client_company_interactions')
      .select('*')
      .eq('company_whatsapp', companyWhatsapp)
      .eq('client_whatsapp', clientWhatsapp)
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
      console.error('Erro ao buscar interação:', searchError);
      return false;
    }

    if (existingInteraction) {
      // Atualiza interação existente
      const { error: updateError } = await supabase
        .from('client_company_interactions')
        .update({
          last_contact_at: new Date().toISOString(),
          total_interactions: existingInteraction.total_interactions + 1,
          client_name: clientName || existingInteraction.client_name
        })
        .eq('id', existingInteraction.id);

      if (updateError) {
        console.error('Erro ao atualizar interação:', updateError);
        return false;
      }
    } else {
      // Cria nova interação
      const { error: insertError } = await supabase
        .from('client_company_interactions')
        .insert({
          company_whatsapp: companyWhatsapp,
          client_whatsapp: clientWhatsapp,
          client_name: clientName
        });

      if (insertError) {
        console.error('Erro ao criar interação:', insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    return false;
  }
};

// Função para verificar se cliente já interagiu com a empresa
export const checkClientCompanyHistory = async (
  companyWhatsapp: string,
  clientWhatsapp: string
): Promise<{ isExistingClient: boolean; totalInteractions?: number; firstContact?: string }> => {
  try {
    const { data, error } = await supabase
      .from('client_company_interactions')
      .select('*')
      .eq('company_whatsapp', companyWhatsapp)
      .eq('client_whatsapp', clientWhatsapp)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Não encontrado
        return { isExistingClient: false };
      }
      console.error('Erro ao verificar histórico:', error);
      throw error;
    }

    return {
      isExistingClient: true,
      totalInteractions: data.total_interactions,
      firstContact: data.first_contact_at
    };
  } catch (error) {
    console.error('Erro ao verificar histórico:', error);
    return { isExistingClient: false };
  }
}; 