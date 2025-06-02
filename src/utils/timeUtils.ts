
export const isTimeSlotInFuture = (date: string, time: string): boolean => {
  const now = new Date();
  const slotDateTime = new Date(`${date}T${time}:00`);
  
  // Adiciona uma margem de 30 minutos para evitar agendamentos muito próximos
  const minimumTime = new Date(now.getTime() + 30 * 60 * 1000);
  
  return slotDateTime > minimumTime;
};

export const getAvailableTimeSlots = (date: string): string[] => {
  const slots = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Se for hoje, filtra horários passados
  if (date === today) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Se for uma hora futura ou se for a hora atual mas com minutos futuros (+ margem)
        if (hour > currentHour || (hour === currentHour && minute > currentMinute + 30)) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }
    }
  } else {
    // Para datas futuras, mostra todos os horários
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
  }
  
  return slots;
};
