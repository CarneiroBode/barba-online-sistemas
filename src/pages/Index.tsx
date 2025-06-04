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
import Welcome from "@/components/Welcome";
import Auth from "@/components/Auth";
import { 
  validateUserAccess, 
  upsertUser, 
  getUserByPhone, 
  saveAppointmentToSupabase,
  generateSecureLink,
  getCompanyInfo,
  getServices,
  getAppointments,
  saveAppointment,
  updateAppointmentStatus
} from "@/utils/supabaseOperations";

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
  createdAt?: string;
  companyId?: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
  whatsapp: string;
  socialMedia: string;
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
    professionalName: 'Profissional',
    whatsapp: '',
    socialMedia: ''
  });

  // Dados dinâmicos - carregados do localStorage
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Extrair company_id da URL
  const extractCompanyId = (): string => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    return pathSegments[0] || '';
  };

  // Verificar se a empresa existe
  const validateCompany = (companyId: string): boolean => {
    const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    return adminUsers.some((user: any) => user.companyId === companyId);
  };

  useEffect(() => {
    const initializeApp = async () => {
      const extractedCompanyId = extractCompanyId();

      if (!extractedCompanyId) {
        // URL sem company_id - não autenticar
        setIsAuthenticated(false);
        return;
      }

      // Verificar se a empresa existe
      if (!validateCompany(extractedCompanyId)) {
        // Empresa não encontrada - não autenticar
        setIsAuthenticated(false);
        return;
      }

      setCompanyId(extractedCompanyId);
      await loadInitialData();

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
          // Link inválido ou expirado - não autenticar
          setIsAuthenticated(false);
        }
      } else if (phone) {
        // Apenas telefone fornecido - verificar se usuário existe
        const user = await getUserByPhone(phone);
        if (user) {
          // Link incompleto - não autenticar
          setIsAuthenticated(false);
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

  useEffect(() => {
    loadInitialData();
  }, [companyId]);

  const loadInitialData = async () => {
    try {
      if (!companyId) {
        setError("ID da empresa não fornecido");
        return;
      }

      // Carregar informações da empresa
      const companyData = await getCompanyInfo(companyId);
      if (companyData) {
        setCompanyInfo({
          name: companyData.name,
          address: companyData.address,
          phone: companyData.phone,
          professionalName: companyData.professional_name,
          whatsapp: companyData.whatsapp,
          socialMedia: companyData.social_media
        });
      } else {
        setError("Empresa não encontrada");
        return;
      }

      // Carregar serviços
      const servicesData = await getServices(companyId);
      if (servicesData && servicesData.length > 0) {
        setServices(servicesData);
      }

      // Carregar agendamentos
      const appointmentsData = await getAppointments(companyId);
      if (appointmentsData) {
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError("Erro ao carregar dados da empresa");
    }
  };

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

  const handleSchedule = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const appointment: Appointment = {
        id: Date.now().toString(),
        clientName,
        clientPhone,
        service: selectedService,
        professional: companyInfo.professionalName || 'Profissional',
        date: selectedDate,
        time: selectedTime,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        companyId
      };

      await saveAppointment(appointment, companyId);
      
      const updatedAppointments = [...appointments, appointment];
      setAppointments(updatedAppointments);

      toast({
        title: "Agendamento realizado!",
        description: "Seu horário foi agendado com sucesso.",
      });

      // Limpar formulário
      setClientName('');
      setClientPhone('');
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setStep('welcome' as const);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled');
      
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
      );
      setAppointments(updatedAppointments);

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
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
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-lg text-gray-300">
            Acesso restrito. Por favor, use o link enviado via WhatsApp para acessar seus agendamentos.
          </p>
        </div>
      </div>
    );
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
          onConfirm={handleSchedule}
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
          onCancelAppointment={handleCancel}
          onNewAppointment={() => setStep('service')}
        />
      )}
    </div>
  );
};

export default Index;