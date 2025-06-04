
import { supabase } from '../config/supabase';

export { supabase };

// Funções auxiliares para o sistema de agendamentos
export const supabaseUtils = {
  // Serviços
  async getServices(companyId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true);
    
    if (error) throw error;
    return data || [];
  },

  async createService(service: any) {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateService(id: number, service: any) {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteService(id: number) {
    const { error } = await supabase
      .from('services')
      .update({ active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Agendamentos
  async getAppointments(companyId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .eq('company_id', companyId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createAppointment(appointment: any) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAppointment(id: number, appointment: any) {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id)
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAppointment(id: number) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Horários de funcionamento
  async getBusinessHours(companyId: string) {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('company_id', companyId)
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async updateBusinessHours(companyId: string, hours: any[]) {
    // Remove horários existentes
    await supabase
      .from('business_hours')
      .delete()
      .eq('company_id', companyId);

    // Insere novos horários
    if (hours.length > 0) {
      const { error } = await supabase
        .from('business_hours')
        .insert(hours.map(hour => ({ ...hour, company_id: companyId })));

      if (error) throw error;
    }
  },

  // Empresas
  async createCompany(company: { id: string; name: string; active?: boolean }) {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCompany(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }
};
