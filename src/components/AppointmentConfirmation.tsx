
import { Button } from "@/components/ui/button";
import { Service } from "@/pages/Index";

interface AppointmentConfirmationProps {
  clientName: string;
  service: Service;
  date: string;
  time: string;
  barber: string;
  onConfirm: () => void;
  onNewAppointment: () => void;
  onMyAppointments: () => void;
}

const AppointmentConfirmation = ({ 
  clientName, 
  service, 
  date, 
  time, 
  barber, 
  onConfirm,
  onNewAppointment,
  onMyAppointments 
}: AppointmentConfirmationProps) => {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const dayName = dayNames[date.getDay()];
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const handleSaveToCalendar = () => {
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    
    const title = `${service.name} - ${barber}`;
    const details = `Agendamento na Barbearia Doutor da Barba\nServiço: ${service.name}\nProfissional: ${barber}\nValor: R$ ${service.price.toFixed(2)}`;
    const location = 'Rua Gama Rosa, 197 - Loja F - Ed. Maria Tereza';
    
    const startStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-6">MEUS AGENDAMENTOS</h1>
          
          <div className="bg-gray-600 rounded-xl p-1 mb-6 inline-block">
            <span className="text-white px-3 py-1">Perfeito....</span>
          </div>

          <div className="bg-amber-700 rounded-2xl p-6 mb-6">
            <p className="text-lg">
              Agendamento realizado: {service.name} - (R$ {service.price.toFixed(2)}), com o(a) {barber} no(a) {formatDate(date)} às {time}. O local é o de sempre Rua Gama Rosa, 197 - Loja F - Ed. Maria Tereza.
            </p>
          </div>

          <div className="bg-amber-700 rounded-2xl p-6 mb-8">
            <p className="text-lg">Muito obrigado, até mais!</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => {
              onConfirm();
              onMyAppointments();
            }}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          >
            Meus agendamentos
          </Button>

          <Button 
            onClick={() => {
              onConfirm();
              onNewAppointment();
            }}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          >
            Novo agendamento
          </Button>

          <Button 
            onClick={handleSaveToCalendar}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          >
            Salvar em minha agenda local
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;
