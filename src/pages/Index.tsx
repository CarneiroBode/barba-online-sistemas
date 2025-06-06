
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
import { supabase } from "@/lib/supabase";

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
  clientWhatsapp: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  company_whatsapp: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
  whatsapp: string; // Este campo agora será usado como ID da empresa
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

  // Dados dinâmicos - carregados do Supabase
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extrair company_id da URL (agora usando whatsapp)
  const extractCompanyId = (): string => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    const companyId = pathSegments[0] || '';
    
    console.log('Extracting company ID from path:', path, 'Result:', companyId);
    
    // Verifica se é a rota de admin
    if (companyId === 'admin') {
      return companyId;
    }

    // Se não há ID na URL, pode ser acesso direto
    if (!companyId) {
      console.log('Acesso direto à raiz');
      return '';
    }

    // Validar se o ID parece um número de WhatsApp (aceitar vários formatos)
    const cleanId = companyId.replace(/\D/g, '');
    if (cleanId.length < 10 || cleanId.length > 15) {
      console.error('ID da empresa inválido: deve ser um número de WhatsApp válido');
      return '';
    }

    return cleanId;
  };

  useEffect(() => {
    const initializeApp = async () => {
      console.log('Inicializando aplicação...');
      setIsLoading(true);
      
      const companyWhatsapp = extractCompanyId();
      const clientWhatsapp = searchParams.get('phone') || '';
      const code = searchParams.get('code') || '';

      console.log('Parâmetros:', { companyWhatsapp, clientWhatsapp, code });

      // Rota de admin
      if (companyWhatsapp === 'admin') {
        console.log('Rota de admin detectada');
        setIsLoading(false);
        return;
      }

      // Se não há parâmetros de empresa, mostrar tela de acesso restrito
      if (!companyWhatsapp) {
        console.log('Sem ID de empresa, mostrando acesso restrito');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      setCompanyId(companyWhatsapp);

      // Se há parâmetros de autenticação, tentar validar
      if (clientWhatsapp && code) {
        try {
          console.log('Validando acesso do usuário...');
          const isValid = await validateUserAccess(companyWhatsapp, clientWhatsapp, code);
          
          if (isValid) {
            console.log('Acesso válido, autenticando usuário');
            setClientPhone(clientWhatsapp);
            setSecurityCode(code);
            setIsAuthenticated(true);
            setStep('service');
          } else {
            console.log('Acesso inválido');
            setIsAuthenticated(false);
            toast({
              title: "Acesso Negado",
              description: "Link inválido ou expirado. Por favor, solicite um novo link.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Erro na autenticação:', error);
          setIsAuthenticated(false);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao validar seu acesso. Por favor, tente novamente.",
            variant: "destructive"
          });
        }
      } else {
        console.log('Sem parâmetros de autenticação, mostrando acesso restrito');
        setIsAuthenticated(false);
      }

      // Carregar dados da empresa independentemente da autenticação
      await loadInitialData(companyWhatsapp);
      setIsLoading(false);
    };

    initializeApp();
  }, [searchParams, location.pathname, toast]);

  const loadInitialData = async (companyWhatsapp?: string) => {
    try {
      const currentCompanyId = companyWhatsapp || companyId;
      
      if (!currentCompanyId) {
        console.log('Sem ID da empresa para carregar dados');
        return;
      }

      console.log('Carregando dados da empresa:', currentCompanyId);

      // Carregar informações da empresa
      const companyData = await getCompanyInfo(currentCompanyId);
      if (companyData) {
        console.log('Dados da empresa carregados:', companyData);
        setCompanyInfo({
          name: companyData.name,
          address: companyData.address,
          phone: companyData.phone,
          professionalName: companyData.professional_name,
          whatsapp: companyData.whatsapp,
          socialMedia: companyData.social_media
        });
      } else {
        console.log('Empresa não encontrada');
        setError("Empresa não encontrada");
        return;
      }

      // Carregar serviços
      const servicesData = await getServices(currentCompanyId);
      if (servicesData && servicesData.length > 0) {
        console.log('Serviços carregados:', servicesData.length);
        setServices(servicesData);
      } else {
        console.log('Nenhum serviço encontrado');
        setServices([]);
      }

      // Carregar agendamentos se autenticado
      if (isAuthenticated) {
        const appointmentsData = await getAppointments(currentCompanyId);
        if (appointmentsData) {
          console.log('Agendamentos carregados:', appointmentsData.length);
          setAppointments(appointmentsData);
        }
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
        const secureLink = generateSecureLink(companyId, clientPhone, newSecurityCode);

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
    if (selectedService && selectedDate && selectedTime) {
      try {
        const appointment: Appointment = {
          id: Date.now().toString(),
          clientName,
          clientWhatsapp: clientPhone,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          status: 'pending',
          company_whatsapp: companyId
        };

        await saveAppointmentToSupabase(appointment);
        
        const updatedAppointments = [...appointments, appointment];
        setAppointments(updatedAppointments);

        toast({
          title: "Agendamento realizado!",
          description: "Seu horário foi agendado com sucesso.",
        });

        // Limpar formulário
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setStep('welcome');
      } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível realizar o agendamento. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
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

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-lg text-gray-300">
            Validando acesso e carregando dados...
          </p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Erro</h1>
          <p className="text-lg text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Tela de acesso restrito
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{companyInfo.name}</h1>
          <div className="bg-amber-700 rounded-2xl p-6 mb-6">
            <p className="text-lg">
              Acesso restrito. Por favor, use o link enviado via WhatsApp para acessar o sistema de agendamento.
            </p>
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
          appointments={appointments.filter(apt => apt.clientWhatsapp === clientPhone)}
          services={services}
          onBack={() => setStep('welcome')}
          onCancelAppointment={handleCancel}
          onNewAppointment={() => setStep('service')}
        />
      )}
    </div>
  );
};

export default Index;
