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

  // Dados dinâmicos - carregados do localStorage
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Extrair company_id da URL (agora usando whatsapp)
  const extractCompanyId = (): string => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    const companyId = pathSegments[0] || '';
    
    // Verifica se é a rota de admin
    if (companyId === 'admin') {
      return companyId;
    }

    // Valida se o ID é um número de WhatsApp válido (13 dígitos)
    const whatsappRegex = /^\d{13}$/;
    if (!whatsappRegex.test(companyId)) {
      console.error('ID da empresa inválido: deve ser um número de WhatsApp com 13 dígitos');
      return '';
    }

    return companyId;
  };

  // Verificar se a empresa existe
  const validateCompany = async (whatsappId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('whatsapp')
        .eq('whatsapp', whatsappId)
        .single();

      if (error) {
        console.error('Erro ao validar empresa:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao validar empresa:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const companyWhatsapp = extractCompanyId(); // Agora retorna o whatsapp da empresa
      const clientWhatsapp = searchParams.get('phone') || '';
      const code = searchParams.get('code') || '';

      // Rota de admin
      if (companyWhatsapp === 'admin') {
        // Lógica para admin
        return;
      }

      // Validação do formato dos números WhatsApp
      const whatsappRegex = /^\d{13}$/;
      const isValidCompanyWhatsapp = whatsappRegex.test(companyWhatsapp);
      const isValidClientWhatsapp = whatsappRegex.test(clientWhatsapp);

      // Validação da URL completa
      if (!isValidCompanyWhatsapp || !isValidClientWhatsapp || !code) {
        setIsAuthenticated(false);
        toast({
          title: "URL Inválida",
          description: "Por favor, use o link enviado via WhatsApp para acessar o sistema de agendamento.",
          variant: "destructive"
        });
        return;
      }

      try {
        // Validar acesso
        const isValid = await validateUserAccess(companyWhatsapp, clientWhatsapp, code);
        if (!isValid) {
          setIsAuthenticated(false);
          toast({
            title: "Acesso Negado",
            description: "Link inválido ou expirado. Por favor, solicite um novo link.",
            variant: "destructive"
          });
          return;
        }

        // Se chegou aqui, a autenticação foi bem sucedida
        setClientPhone(clientWhatsapp);
        setSecurityCode(code);
        setCompanyId(companyWhatsapp);
        setIsAuthenticated(true);
        setStep('service');

        // Carregar dados da empresa
        await loadInitialData();

      } catch (error) {
        console.error('Erro na autenticação:', error);
        setIsAuthenticated(false);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao validar seu acesso. Por favor, tente novamente.",
          variant: "destructive"
        });
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
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-lg text-gray-300">
            Por favor, use o link enviado via WhatsApp para acessar o sistema de agendamento.
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