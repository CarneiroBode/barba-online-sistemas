
interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export const getBusinessHours = (companyId?: string): WeekSchedule => {
  const dataPrefix = companyId ? `${companyId}_` : '';
  const saved = localStorage.getItem(`${dataPrefix}businessHours`);
  
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Horários padrão
  return {
    monday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    tuesday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    wednesday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    thursday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    friday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    saturday: { enabled: true, openTime: '08:00', closeTime: '16:00' },
    sunday: { enabled: false, openTime: '08:00', closeTime: '18:00' }
  };
};

export const getSlotDuration = (companyId?: string): number => {
  const dataPrefix = companyId ? `${companyId}_` : '';
  const saved = localStorage.getItem(`${dataPrefix}slotDuration`);
  return saved ? parseInt(saved) : 30;
};

export const isBusinessOpen = (date: string, companyId?: string): boolean => {
  const businessHours = getBusinessHours(companyId);
  const dateObj = new Date(date + 'T00:00:00');
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateObj.getDay()] as keyof WeekSchedule;
  
  return businessHours[dayName].enabled;
};

export const getBusinessTimeSlots = (date: string, companyId?: string): string[] => {
  const businessHours = getBusinessHours(companyId);
  const slotDuration = getSlotDuration(companyId);
  const dateObj = new Date(date + 'T00:00:00');
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateObj.getDay()] as keyof WeekSchedule;
  
  const daySchedule = businessHours[dayName];
  
  if (!daySchedule.enabled) {
    return [];
  }
  
  const slots: string[] = [];
  const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = daySchedule.closeTime.split(':').map(Number);
  
  let currentTime = openHour * 60 + openMinute; // em minutos
  const endTime = closeHour * 60 + closeMinute;
  
  // Horário de intervalo (se definido)
  let breakStartTime: number | null = null;
  let breakEndTime: number | null = null;
  
  if (daySchedule.breakStart && daySchedule.breakEnd) {
    const [breakStartHour, breakStartMinute] = daySchedule.breakStart.split(':').map(Number);
    const [breakEndHour, breakEndMinute] = daySchedule.breakEnd.split(':').map(Number);
    breakStartTime = breakStartHour * 60 + breakStartMinute;
    breakEndTime = breakEndHour * 60 + breakEndMinute;
  }
  
  while (currentTime < endTime) {
    // Pular horário de intervalo
    if (breakStartTime && breakEndTime && currentTime >= breakStartTime && currentTime < breakEndTime) {
      currentTime = breakEndTime;
      continue;
    }
    
    const hour = Math.floor(currentTime / 60);
    const minute = currentTime % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Verificar se ainda há tempo para o slot completo antes do fechamento ou intervalo
    const slotEndTime = currentTime + slotDuration;
    
    if (slotEndTime <= endTime) {
      // Se há intervalo, verificar se o slot não conflita
      if (breakStartTime && breakEndTime) {
        if (!(currentTime < breakEndTime && slotEndTime > breakStartTime)) {
          slots.push(timeString);
        }
      } else {
        slots.push(timeString);
      }
    }
    
    currentTime += slotDuration;
  }
  
  return slots;
};

export const isTimeSlotValid = (date: string, time: string, companyId?: string): boolean => {
  const validSlots = getBusinessTimeSlots(date, companyId);
  return validSlots.includes(time);
};
