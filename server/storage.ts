
import { supabase } from '../src/config/supabase';
import { users, urlValidations, companies, type User, type InsertUser, type UrlValidation, type InsertUrlValidation, type Company } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUrlAccess(company_id: string, whatsapp: string, codigo: string): Promise<UrlValidation | undefined>;
  createUrlValidation(validation: InsertUrlValidation): Promise<UrlValidation>;
  markUrlValidationAsUsed(id: number): Promise<void>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: { id: string; name: string; active?: boolean }): Promise<Company>;
  getServices(company_id: string): Promise<any[]>;
  createService(service: any): Promise<any>;
  updateService(id: number, service: any): Promise<any>;
  deleteService(id: number): Promise<void>;
  getAppointments(company_id: string): Promise<any[]>;
  createAppointment(appointment: any): Promise<any>;
  updateAppointment(id: number, appointment: any): Promise<any>;
  deleteAppointment(id: number): Promise<void>;
  getBusinessHours(company_id: string): Promise<any[]>;
  updateBusinessHours(company_id: string, hours: any[]): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('user_auth')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      company_id: data.company_id
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('user_auth')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      company_id: data.company_id
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('user_auth')
      .insert({
        username: insertUser.username,
        password: insertUser.password,
        company_id: null
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);
    
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      company_id: data.company_id
    };
  }

  async validateUrlAccess(company_id: string, whatsapp: string, codigo: string): Promise<UrlValidation | undefined> {
    const { data, error } = await supabase
      .from('url_validations')
      .select('*')
      .eq('company_id', company_id)
      .eq('whatsapp', whatsapp)
      .eq('codigo', codigo)
      .eq('used', false)
      .single();

    if (error || !data) return undefined;

    // Verifica se expirou
    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      return undefined;
    }

    return data;
  }

  async createUrlValidation(insertValidation: InsertUrlValidation): Promise<UrlValidation> {
    const { data, error } = await supabase
      .from('url_validations')
      .insert(insertValidation)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar validação: ${error.message}`);
    return data;
  }

  async markUrlValidationAsUsed(id: number): Promise<void> {
    const { error } = await supabase
      .from('url_validations')
      .update({ used: true })
      .eq('id', id);

    if (error) throw new Error(`Erro ao marcar como usado: ${error.message}`);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return data;
  }

  async createCompany(company: { id: string; name: string; active?: boolean }): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar empresa: ${error.message}`);
    return data;
  }

  async getServices(company_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', company_id)
      .eq('active', true);

    if (error) throw new Error(`Erro ao buscar serviços: ${error.message}`);
    return data || [];
  }

  async createService(service: any): Promise<any> {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar serviço: ${error.message}`);
    return data;
  }

  async updateService(id: number, service: any): Promise<any> {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar serviço: ${error.message}`);
    return data;
  }

  async deleteService(id: number): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update({ active: false })
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar serviço: ${error.message}`);
  }

  async getAppointments(company_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .eq('company_id', company_id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
    return data || [];
  }

  async createAppointment(appointment: any): Promise<any> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .single();

    if (error) throw new Error(`Erro ao criar agendamento: ${error.message}`);
    return data;
  }

  async updateAppointment(id: number, appointment: any): Promise<any> {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id)
      .select(`
        *,
        services (name, duration_minutes)
      `)
      .single();

    if (error) throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
    return data;
  }

  async deleteAppointment(id: number): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar agendamento: ${error.message}`);
  }

  async getBusinessHours(company_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('company_id', company_id)
      .order('day_of_week', { ascending: true });

    if (error) throw new Error(`Erro ao buscar horários: ${error.message}`);
    return data || [];
  }

  async updateBusinessHours(company_id: string, hours: any[]): Promise<void> {
    // Remove horários existentes
    await supabase
      .from('business_hours')
      .delete()
      .eq('company_id', company_id);

    // Insere novos horários
    if (hours.length > 0) {
      const { error } = await supabase
        .from('business_hours')
        .insert(hours.map(hour => ({ ...hour, company_id })));

      if (error) throw new Error(`Erro ao atualizar horários: ${error.message}`);
    }
  }
}

export const storage = new SupabaseStorage();
