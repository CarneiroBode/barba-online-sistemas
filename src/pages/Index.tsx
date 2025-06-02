
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone } from "lucide-react";
import ServiceSelection from "@/components/ServiceSelection";
import DateTimeSelection from "@/components/DateTimeSelection";
import AppointmentConfirmation from "@/components/AppointmentConfirmation";
import MyAppointments from "@/components/MyAppointments";
import { useToast } from "@/hooks/use-toast";

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // em minutos
  description?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  service: Service;
  barber: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<'welcome' | 'service' | 'datetime' | 'confirmation' | 'myappointments'>('welcome');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Dados mock - em produção viria do backend
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services] = useState<Service[]>([
    { id: '1', name: 'Corte', price: 35, duration: 30 },
    { id: '2', name: 'Barba', price: 35, duration: 30 },
    { id: '3', name: 'Corte + Barba', price: 60, duration: 60 },
    { id: '4', name: 'Barboterapia', price: 89, duration: 90 },
    { id: '5', name: 'Pezinho', price: 10, duration: 15 }
  ]);

  useEffect(() => {
    // Verificar se há número de telefone na URL
    const phone = searchParams.get('phone');
    if (phone) {
      setClientPhone(phone);
      // Verificar se é cliente existente (mock)
      const existingClient = localStorage.getItem(`client_${phone}`);
      if (existingClient) {
        const clientData = JSON.parse(existingClient);
        setClientName(clientData.name);
        setStep('service');
        toast({
          title: `Olá, ${clientData.name}!`,
          description: "Que bom que voltou! Vamos agendar seu horário?",
        });
      } else {
        setIsNewClient(true);
      }
    }

    // Carregar agendamentos do localStorage
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }
  }, [searchParams, toast]);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setClientName(nameInput);
      // Salvar cliente no localStorage
      localStorage.setItem(`client_${clientPhone}`, JSON.stringify({ name: nameInput, phone: clientPhone }));
      setIsNewClient(false);
      setStep('service');
      toast({
        title: `Bem-vindo, ${nameInput}!`,
        description: "Vamos escolher o serviço desejado?",
      });
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('datetime');
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('confirmation');
  };

  const handleConfirmAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      service: selectedService,
      barber: 'Wanderson',
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

    // Enviar webhook para n8n (quando integrado)
    try {
      const webhookData = {
        type: 'appointment_confirmed',
        appointment: newAppointment,
        timestamp: new Date().toISOString()
      };
      
      // Exemplo de chamada para webhook - substituir pela URL real
      console.log('Enviando para webhook n8n:', webhookData);
      
      toast({
        title: "Agendamento confirmado!",
        description: `${selectedService.name} agendado para ${selectedDate} às ${selectedTime}`,
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    );
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    
    toast({
      title: "Agendamento cancelado",
      description: "Seu horário foi cancelado com sucesso.",
    });
  };

  if (isNewClient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">MEUS AGENDAMENTOS</h1>
            <div className="bg-amber-700 rounded-2xl p-6 mb-6">
              <p className="text-lg">Como vai! Que bom que chegou!</p>
            </div>
            <div className="bg-amber-700 rounded-2xl p-6 mb-6">
              <p>Para que possamos lembrá-lo de seu agendamento, qual seu nome?</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Digite seu nome"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
            />
            <Button 
              onClick={handleNameSubmit}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {step === 'welcome' && (
        <div className="p-4">
          <div className="max-w-md mx-auto pt-20 text-center">
            <h1 className="text-2xl font-bold mb-8">BARBEARIA DOUTOR DA BARBA</h1>
            <div className="space-y-4">
              <Button 
                onClick={() => setStep('service')}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
              >
                <Calendar className="mr-2" />
                Novo Agendamento
              </Button>
              <Button 
                onClick={() => setStep('myappointments')}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
              >
                <Clock className="mr-2" />
                Meus Agendamentos
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'service' && (
        <ServiceSelection
          services={services}
          onServiceSelect={handleServiceSelect}
          onBack={() => setStep('welcome')}
        />
      )}

      {step === 'datetime' && selectedService && (
        <DateTimeSelection
          service={selectedService}
          onDateTimeSelect={handleDateTimeSelect}
          onBack={() => setStep('service')}
          existingAppointments={appointments}
        />
      )}

      {step === 'confirmation' && selectedService && (
        <AppointmentConfirmation
          clientName={clientName}
          service={selectedService}
          date={selectedDate}
          time={selectedTime}
          barber="Wanderson"
          onConfirm={handleConfirmAppointment}
          onNewAppointment={() => {
            setSelectedService(null);
            setSelectedDate('');
            setSelectedTime('');
            setStep('service');
          }}
          onMyAppointments={() => setStep('myappointments')}
        />
      )}

      {step === 'myappointments' && (
        <MyAppointments
          appointments={appointments.filter(apt => apt.clientPhone === clientPhone)}
          onBack={() => setStep('welcome')}
          onCancelAppointment={handleCancelAppointment}
          onNewAppointment={() => setStep('service')}
        />
      )}
    </div>
  );
};

export default Index;
