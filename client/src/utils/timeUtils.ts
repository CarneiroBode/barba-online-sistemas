
import { getBusinessTimeSlots, isBusinessOpen, isTimeSlotValid } from './businessHours';

export const isTimeSlotInFuture = (date: string, time: string): boolean => {
  const now = new Date();
  const slotDateTime = new Date(`${date}T${time}:00`);
  
  // Adiciona uma margem de 30 minutos para evitar agendamentos muito próximos
  const minimumTime = new Date(now.getTime() + 30 * 60 * 1000);
  
  return slotDateTime > minimumTime;
};

export const getAvailableTimeSlots = (date: string, companyId?: string): string[] => {
  // Verificar se o estabelecimento funciona neste dia
  if (!isBusinessOpen(date, companyId)) {
    return [];
  }
  
  // Obter slots baseados nos horários de funcionamento
  const businessSlots = getBusinessTimeSlots(date, companyId);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Se for hoje, filtra horários passados
  if (date === today) {
    return businessSlots.filter(time => isTimeSlotInFuture(date, time));
  }
  
  // Para datas futuras, retorna todos os slots do horário de funcionamento
  return businessSlots;
};

export const isValidTimeSlot = (date: string, time: string, companyId?: string): boolean => {
  return isTimeSlotValid(date, time, companyId) && isTimeSlotInFuture(date, time);
};
