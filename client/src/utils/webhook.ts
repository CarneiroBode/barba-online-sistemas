
export interface WebhookPayload {
  type: 'appointment_confirmed' | 'appointment_cancelled' | 'reminder_scheduled';
  appointment?: {
    id: string;
    clientName: string;
    clientPhone: string;
    service: {
      name: string;
      price: number;
      duration: number;
    };
    barber: string;
    date: string;
    time: string;
    status: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

// URL do webhook n8n - substituir pela URL real quando configurado
const WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/barber-appointment';

export const sendWebhook = async (payload: WebhookPayload): Promise<boolean> => {
  try {
    console.log('Enviando webhook:', payload);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('Webhook enviado com sucesso');
      return true;
    } else {
      console.error('Erro ao enviar webhook:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Erro na requisição do webhook:', error);
    return false;
  }
};

// Função para agendar lembretes (seria implementada no n8n)
export const scheduleReminders = async (appointment: WebhookPayload['appointment']) => {
  if (!appointment) return;

  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
  
  // Lembrete 1 dia antes
  const oneDayBefore = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
  
  // Lembrete 1 hora antes
  const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
  
  // Lembrete 30 minutos antes
  const thirtyMinBefore = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);

  const payload: WebhookPayload = {
    type: 'reminder_scheduled',
    appointment,
    timestamp: new Date().toISOString(),
    metadata: {
      reminders: [
        { type: '1_day_before', scheduledFor: oneDayBefore.toISOString() },
        { type: '1_hour_before', scheduledFor: oneHourBefore.toISOString() },
        { type: '30_min_before', scheduledFor: thirtyMinBefore.toISOString() }
      ]
    }
  };

  return sendWebhook(payload);
};

// Mensagens de template para WhatsApp
export const getWhatsAppTemplates = () => ({
  confirmation: (appointment: WebhookPayload['appointment']) => 
    `🎉 *Agendamento Confirmado!*\n\n` +
    `📅 *Serviço:* ${appointment?.service.name}\n` +
    `👨‍💼 *Profissional:* ${appointment?.barber}\n` +
    `📅 *Data:* ${appointment?.date}\n` +
    `⏰ *Horário:* ${appointment?.time}\n` +
    `💰 *Valor:* R$ ${appointment?.service.price.toFixed(2)}\n\n` +
    `📍 *Local:* Rua Gama Rosa, 197 - Loja F - Ed. Maria Tereza\n\n` +
    `Para cancelar, acesse: https://seu-dominio.com/?phone=${appointment?.clientPhone}`,

  reminderOneDay: (appointment: WebhookPayload['appointment']) =>
    `⏰ *Lembrete - 1 dia para seu agendamento!*\n\n` +
    `Olá ${appointment?.clientName}! Seu agendamento é amanhã:\n\n` +
    `📅 *${appointment?.service.name}* com ${appointment?.barber}\n` +
    `⏰ *${appointment?.time}*\n` +
    `📍 Rua Gama Rosa, 197 - Loja F\n\n` +
    `Nos vemos em breve! 💈`,

  reminderOneHour: (appointment: WebhookPayload['appointment']) =>
    `🔔 *Seu agendamento é em 1 hora!*\n\n` +
    `${appointment?.clientName}, não esqueça:\n` +
    `📅 *${appointment?.service.name}* - ${appointment?.time}\n` +
    `📍 Rua Gama Rosa, 197 - Loja F\n\n` +
    `Te esperamos! 💈`,

  reminderThirtyMin: (appointment: WebhookPayload['appointment']) =>
    `⚡ *Seu agendamento é em 30 minutos!*\n\n` +
    `${appointment?.clientName}, já pode se preparar!\n` +
    `🕒 *${appointment?.time}* - ${appointment?.service.name}\n` +
    `📍 Rua Gama Rosa, 197 - Loja F\n\n` +
    `Até já! 💈`
});
