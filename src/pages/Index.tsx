
import { useEffect, useState } from "react";
import { useSearchParams, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone, Settings } from "lucide-react";
import ServiceSelection from "@/components/ServiceSelection";
import DateTimeSelection from "@/components/DateTimeSelection";
import AppointmentConfirmation from "@/components/AppointmentConfirmation";
import MyAppointments from "@/components/MyAppointments";
import { useToast } from "@/hooks/use-toast";
import { 
  validateUserAccess, 
  upsertUser, 
  getUserByPhone, 
  saveAppointmentToSupabase,
  generateSecureLink 
} from "@/utils/supabase";

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
  professional: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
  companyId?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'auth' | 'welcome' | 'service' | 'datetime' | 'confirmation' | 'myappointments'>('auth');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [securityCode, setSecurityCode] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'MEUS AGENDAMENTOS',
    address: '',
    phone: '',
    professionalName: 'Profissional'
  });

  // Dados dinâmicos - carregados do localStorage
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Extrair company_id da URL
  const extractCompanyId = (): string => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    return pathSegments[0] || '';
  };

  // Verificar se a empresa existe
  const validateCompany = (companyId: string): boolean => {
    const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    return adminUsers.some((user: any) => user.companyId === companyId && user.role === 'client');
  };

  // Carregar dados específicos da empresa
  const loadCompanyData = (companyId: string) => {
    // Carregar informações da empresa
    const savedCompanyInfo = localStorage.getItem(`${companyId}_companyInfo`);
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    } else {
      // Buscar nome da empresa nos dados do admin
      const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
      const company = adminUsers.find((user: any) => user.companyId === companyId);
      if (company) {
        setCompanyInfo(prev => ({
          ...prev,
          name: company.companyName || 'MEUS AGENDAMENTOS'
        }));
      }
    }

    // Carregar serviços da empresa
    const savedServices = localStorage.getItem(`${companyId}_services`);
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      // Serviços padrão apenas se não houver salvos
      const defaultServices: Service[] = [
        { id: '1', name: 'Serviço Básico', price: 50, duration: 30 },
        { id: '2', name: 'Serviço Premium', price: 100, duration: 60 }
      ];
      setServices(defaultServices);
    }

    // Carregar agendamentos da empresa
    const savedAppointments = localStorage.getItem(`${companyId}_appointments`);
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const extractedCompanyId = extractCompanyId();
      
      if (!extractedCompanyId) {
        // URL sem company_id - mostrar erro
        toast({
          title: "Acesso inválido",
          description: "Link inválido. Por favor, use o link fornecido pela empresa.",
          variant: "destructive"
        });
        setStep('auth');
        return;
      }

      // Verificar se a empresa existe
      if (!validateCompany(extractedCompanyId)) {
        toast({
          title: "Empresa não encontrada",
          description: "A empresa não foi encontrada no sistema.",
          variant: "destructive"
        });
        setStep('auth');
        return;
      }

      setCompanyId(extractedCompanyId);
      loadCompanyData(extractedCompanyId);

      // Verificar parâmetros da URL
      const phone = searchParams.get('phone');
      const code = searchParams.get('code');

      if (phone && code) {
        // Validar acesso com código de segurança
        const isValid = await validateUserAccess(phone, code);
        if (isValid) {
          const user = await getUserByPhone(phone);
          if (user) {
            setClientPhone(phone);
            setClientName(user.name);
            setSecurityCode(code);
            setIsAuthenticated(true);
            setStep('service'); // Vai direto para seleção de serviço
            toast({
              title: `Olá, ${user.name}!`,
              description: "Acesso autorizado. Bem-vindo de volta!",
            });
          }
        } else {
          toast({
            title: "Acesso negado",
            description: "Link inválido ou expirado.",
            variant: "destructive"
          });
          setStep('auth');
        }
      } else if (phone) {
        // Apenas telefone fornecido - verificar se usuário existe
        const user = await getUserByPhone(phone);
        if (user) {
          toast({
            title: "Link incompleto",
            description: "Por favor, use o link completo enviado via WhatsApp.",
            variant: "destructive"
          });
          setStep('auth');
        } else {
          // Novo usuário
          setClientPhone(phone);
          setIsNewClient(true);
          setStep('auth');
        }
      } else {
        // Apenas company_id - permitir cadastro de novo usuário
        setStep('auth');
      }
    };

    initializeApp();
  }, [searchParams, location.pathname, toast]);

  const handleNameSubmit = async () => {
    if (nameInput.trim() && clientPhone) {
      try {
        const newSecurityCode = await upsertUser(clientPhone, nameInput);
        setClientName(nameInput);
        setSecurityCode(newSecurityCode);
        setIsAuthenticated(true);
        setIsNewClient(false);
        setStep('welcome');
        
        // Gerar link seguro para o usuário
        const secureLink = generateSecureLink(clientPhone, newSecurityCode);
        
        toast({
          title: `Bem-vindo, ${nameInput}!`,
          description: "Usuário registrado com sucesso!",
        });

        console.log('Link seguro gerado:', secureLink);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao registrar usuário. Tente novamente.",
          variant: "destructive"
        });
      }
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
    if (!selectedService || !selectedDate || !selectedTime || !isAuthenticated || !companyId) return;

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      clientName,
      clientPhone,
      service: selectedService,
      professional: companyInfo.professionalName || 'Profissional',
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      companyId: companyId
    };

    try {
      // Salvar no localStorage específico da empresa
      const updatedAppointments = [...appointments, newAppointment];
      setAppointments(updatedAppointments);
      localStorage.setItem(`${companyId}_appointments`, JSON.stringify(updatedAppointments));

      // Salvar no Supabase
      await saveAppointmentToSupabase(newAppointment, clientPhone, securityCode);

      // Enviar webhook para n8n (quando integrado)
      try {
        const webhookData = {
          type: 'appointment_confirmed',
          appointment: newAppointment,
          companyInfo: companyInfo,
          companyId: companyId,
          secureLink: generateSecureLink(clientPhone, securityCode),
          timestamp: new Date().toISOString()
        };
        
        console.log('Enviando para webhook n8n:', webhookData);
        
        toast({
          title: "Agendamento confirmado!",
          description: `${selectedService.name} agendado para ${selectedDate} às ${selectedTime}`,
        });
      } catch (error) {
        console.error('Erro ao enviar webhook:', error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar agendamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    );
    setAppointments(updatedAppointments);
    localStorage.setItem(`${companyId}_appointments`, JSON.stringify(updatedAppointments));
    
    toast({
      title: "Agendamento cancelado",
      description: "Seu horário foi cancelado com sucesso.",
    });
  };

  // Tela de autenticação
  if (step === 'auth' && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">{companyInfo.name}</h1>
            {isNewClient ? (
              <>
                <div className="bg-amber-700 rounded-2xl p-6 mb-6">
                  <p className="text-lg">Como vai! Que bom que chegou!</p>
                </div>
                <div className="bg-amber-700 rounded-2xl p-6 mb-6">
                  <p>Para que possamos lembrá-lo de seus agendamentos, qual seu nome?</p>
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
              </>
            ) : (
              <div className="bg-amber-700 rounded-2xl p-6 mb-6">
                <p className="text-lg">
                  Acesso restrito. Por favor, use o link enviado via WhatsApp para acessar seus agendamentos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {step === 'welcome' && (
        <div className="p-4">
          <div className="max-w-md mx-auto pt-20 text-center">
            <h1 className="text-2xl font-bold mb-8">{companyInfo.name}</h1>
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
          companyName={companyInfo.name}
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
          professional={companyInfo.professionalName || 'Profissional'}
          companyInfo={companyInfo}
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
