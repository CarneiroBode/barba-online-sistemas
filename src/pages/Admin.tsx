import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Settings, Building, Plus, Edit, Trash2, LogOut, Users } from "lucide-react";
import { Appointment, Service } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdminAuth from "@/components/AdminAuth";
import UserManagement from "@/components/UserManagement";
import CalendarView from "@/components/CalendarView";
import BusinessHours from "@/components/BusinessHours";
import {
  saveCompanyInfo,
  getCompanyInfo,
  saveService,
  getServices,
  deleteService,
  saveAppointment,
  getAppointments,
  updateAppointmentStatus
} from "@/utils/supabaseOperations";

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
  cpfCnpj?: string;
  whatsapp?: string;
  socialMedia?: string;
  companyId?: string;
}

interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'client';
  companyName?: string;
  companyId?: string;
  address?: string;
  cpfCnpj?: string;
  whatsapp?: string;
  socialMedia?: string;
  createdAt: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
    professionalName: ''
  });
  const [view, setView] = useState<'dashboard' | 'appointments' | 'services' | 'company' | 'users' | 'calendar' | 'hours'>(currentUser?.role === 'superadmin' ? 'users' : 'dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Estados para edição de serviços
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });

  // Estado para cancelamento de agendamentos
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointmentId: string | null }>({ 
    open: false, 
    appointmentId: null 
  });

  // Estados para alteração de senha
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'client') {
        loadUserData();
      }
      // Ajustar view inicial baseada no tipo de usuário
      setView(currentUser.role === 'superadmin' ? 'users' : 'dashboard');
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      if (currentUser) {
        // Carregar agendamentos
        const appointments = await getAppointments(currentUser.companyId || '');
        setAppointments(appointments);

        // Carregar serviços
        const services = await getServices(currentUser.companyId || '');
        if (services && services.length > 0) {
          setServices(services);
        } else {
          // Serviços padrão apenas se não houver salvos
          const defaultServices: Service[] = [
            { id: '1', name: 'Serviço Básico', price: 50, duration: 30 },
            { id: '2', name: 'Serviço Premium', price: 100, duration: 60 }
          ];
          setServices(defaultServices);
          // Salvar serviços padrão no Supabase
          for (const service of defaultServices) {
            await saveService(service, currentUser.companyId || '');
          }
        }

        // Carregar informações da empresa
        if (currentUser.role === 'client') {
          const companyData = await getCompanyInfo(currentUser.companyId || '');
          if (companyData) {
            setCompanyInfo({
              name: companyData.name,
              address: companyData.address,
              phone: companyData.phone,
              professionalName: companyData.professional_name,
              cpfCnpj: companyData.cpf_cnpj,
              whatsapp: companyData.whatsapp,
              socialMedia: companyData.social_media,
              companyId: companyData.company_id
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const saveCompanyInfoHandler = async () => {
    try {
      await saveCompanyInfo({
        company_id: currentUser?.companyId || '',
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        whatsapp: companyInfo.whatsapp,
        professional_name: companyInfo.professionalName
      });
      
      toast({
        title: "Informações salvas!",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar informações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as informações. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const addService = async () => {
    if (!newService.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do serviço é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      const service: Service = {
        id: Date.now().toString(),
        name: newService.name,
        price: newService.price,
        duration: newService.duration
      };

      await saveService(service, currentUser?.companyId || '');
      const updatedServices = [...services, service];
      setServices(updatedServices);
      setNewService({ name: '', price: 0, duration: 30 });
      
      toast({
        title: "Serviço adicionado!",
        description: `${service.name} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o serviço. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateService = async () => {
    if (!editingService) return;

    try {
      await saveService(editingService, currentUser?.companyId || '');
      const updatedServices = services.map(service => 
        service.id === editingService.id ? editingService : service
      );
      setServices(updatedServices);
      setEditingService(null);
      
      toast({
        title: "Serviço atualizado!",
        description: `${editingService.name} foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const deleteServiceHandler = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      const updatedServices = services.filter(service => service.id !== serviceId);
      setServices(updatedServices);
      
      toast({
        title: "Serviço removido!",
        description: "O serviço foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o serviço. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAppointmentsByDate = (date: string) => {
    return appointments.filter(apt => apt.date === date && apt.status === 'confirmed');
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = getAppointmentsByDate(today);
    const revenue = todayAppointments.reduce((sum, apt) => sum + apt.service.price, 0);
    
    return {
      total: todayAppointments.length,
      revenue: revenue,
      nextAppointment: todayAppointments.find(apt => {
        const now = new Date();
        const aptTime = new Date(`${apt.date}T${apt.time}:00`);
        return aptTime > now;
      })
    };
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled');
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
      );
      setAppointments(updatedAppointments);
      setCancelDialog({ open: false, appointmentId: null });
      
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
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

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    if (currentUser?.role === 'superadmin') {
      const superAdmin = adminUsers.find((u: AdminUser) => u.role === 'superadmin');
      
      if (!superAdmin || superAdmin.password !== currentPassword) {
        toast({
          title: "Erro",
          description: "Senha atual incorreta.",
          variant: "destructive"
        });
        return;
      }

      const updatedUsers = adminUsers.map((user: AdminUser) => 
        user.role === 'superadmin' ? { ...user, password: newPassword } : user
      );
      
      localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
      
      toast({
        title: "Senha alterada!",
        description: "Senha do Super Admin alterada com sucesso.",
      });
    } else {
      // Para empresas
      const companyUser = adminUsers.find((u: AdminUser) => u.id === currentUser?.id);
      
      if (!companyUser || companyUser.password !== currentPassword) {
        toast({
          title: "Erro",
          description: "Senha atual incorreta.",
          variant: "destructive"
        });
        return;
      }

      const updatedUsers = adminUsers.map((user: AdminUser) => 
        user.id === currentUser?.id ? { ...user, password: newPassword } : user
      );
      
      localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
      
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
    }

    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Se não estiver logado, mostrar tela de login
  if (!currentUser) {
    return <AdminAuth onLogin={setCurrentUser} />;
  }

  const stats = getTodayStats();
  const dayAppointments = selectedDate ? getAppointmentsByDate(selectedDate.toISOString().split('T')[0]) : [];
  const todayAppointments = getAppointmentsByDate(new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser.role === 'superadmin' ? 'Painel Super Admin - Gerenciamento de Empresas' : companyInfo.name || 'Painel Administrativo'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Olá, {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.companyName}
            </span>
            <Button 
              onClick={() => setShowPasswordDialog(true)} 
              variant="outline" 
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2 flex-wrap">
            {currentUser.role === 'superadmin' ? (
              <Button 
                variant={view === 'users' ? 'default' : 'outline'}
                onClick={() => setView('users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Empresas
              </Button>
            ) : (
              <>
                <Button 
                  variant={view === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => setView('dashboard')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant={view === 'calendar' ? 'default' : 'outline'}
                  onClick={() => setView('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendário
                </Button>
                <Button 
                  variant={view === 'appointments' ? 'default' : 'outline'}
                  onClick={() => setView('appointments')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Agendamentos
                </Button>
                <Button 
                  variant={view === 'services' ? 'default' : 'outline'}
                  onClick={() => setView('services')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Serviços
                </Button>
                <Button 
                  variant={view === 'hours' ? 'default' : 'outline'}
                  onClick={() => setView('hours')}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Horários
                </Button>
                <Button 
                  variant={view === 'company' ? 'default' : 'outline'}
                  onClick={() => setView('company')}
                >
                  <Building className="w-4 h-4 mr-2" />
                  Empresa
                </Button>
              </>
            )}
          </div>
        </div>

        {currentUser.role === 'superadmin' ? (
          <UserManagement currentUser={currentUser} />
        ) : (
          <>
            {view === 'calendar' && (
              <CalendarView
                appointments={appointments}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
                companyId={currentUser.companyId}
              />
            )}

            {view === 'hours' && (
              <BusinessHours companyId={currentUser.companyId} />
            )}
          </>
        )}

        {view === 'company' && currentUser.role === 'client' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company ID em destaque suave */}
              <div>
                <Label htmlFor="company-id" className="font-bold">Company ID * (não pode ser alterado)</Label>
                <div className="bg-gray-50 border border-gray-300 p-3 rounded font-mono font-bold text-gray-800 mt-2">
                  {currentUser.companyId}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Este é o identificador único da sua empresa no sistema
                </p>
              </div>

              <div>
                <Label htmlFor="company-name">Nome da Empresa/Estabelecimento</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  placeholder="Ex: Salão Beleza & Arte"
                />
              </div>

              <div>
                <Label htmlFor="cpf-cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf-cnpj"
                  value={companyInfo.cpfCnpj || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, cpfCnpj: e.target.value})}
                  placeholder="Ex: 00.000.000/0001-00"
                />
              </div>

              <div>
                <Label htmlFor="professional-name">Nome do Profissional</Label>
                <Input
                  id="professional-name"
                  value={companyInfo.professionalName}
                  onChange={(e) => setCompanyInfo({...companyInfo, professionalName: e.target.value})}
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <Label htmlFor="company-address">Endereço</Label>
                <Input
                  id="company-address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                />
              </div>

              <div>
                <Label htmlFor="company-phone">Telefone</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={companyInfo.whatsapp || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, whatsapp: e.target.value})}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="social-media">Rede Social</Label>
                <Input
                  id="social-media"
                  value={companyInfo.socialMedia || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, socialMedia: e.target.value})}
                  placeholder="Ex: @minhaempresa"
                />
              </div>

              <Button onClick={saveCompanyInfoHandler} className="w-full">
                Salvar Informações
              </Button>
            </CardContent>
          </Card>
        )}

        {view === 'dashboard' && currentUser.role === 'client' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
                  <span className="text-lg">💰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Próximo Cliente</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {stats.nextAppointment ? stats.nextAppointment.clientName : 'Nenhum'}
                  </div>
                  {stats.nextAppointment && (
                    <p className="text-sm text-muted-foreground">
                      {stats.nextAppointment.time} - {stats.nextAppointment.service.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => (
                        <div key={appointment.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{appointment.clientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service.name} - {appointment.time}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tel: {appointment.clientPhone}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold">R$ {appointment.service.price.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.service.duration}min
                              </p>
                            </div>
                            <Button
                              onClick={() => setCancelDialog({ open: true, appointmentId: appointment.id })}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {view === 'appointments' && currentUser.role === 'client' && (
          <div>
            <div className="mb-6">
              <Label htmlFor="date-picker">Selecionar Data:</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                className="max-w-xs"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{selectedDate ? formatDate(selectedDate.toISOString().split('T')[0]) : 'Selecione uma data'}</CardTitle>
              </CardHeader>
              <CardContent>
                {dayAppointments.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum agendamento para esta data.</p>
                ) : (
                  <div className="space-y-4">
                    {dayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appointment) => (
                        <div key={appointment.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{appointment.clientName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service.name} - {appointment.time}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Tel: {appointment.clientPhone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R$ {appointment.service.price.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service.duration}min
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'services' && currentUser.role === 'client' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="service-name">Nome do Serviço</Label>
                    <Input
                      id="service-name"
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      placeholder="Ex: Corte de Cabelo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-price">Preço (R$)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-duration">Duração (minutos)</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService({...newService, duration: Number(e.target.value)})}
                      placeholder="30"
                    />
                  </div>
                </div>
                <Button onClick={addService} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serviços Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex justify-between items-center p-4 border rounded-lg">
                      {editingService?.id === service.id ? (
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <Input
                            value={editingService.name}
                            onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                            placeholder="Nome do serviço"
                          />
                          <Input
                            type="number"
                            value={editingService.price}
                            onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                            placeholder="Preço"
                          />
                          <Input
                            type="number"
                            value={editingService.duration}
                            onChange={(e) => setEditingService({...editingService, duration: Number(e.target.value)})}
                            placeholder="Duração"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.duration} minutos - R$ {service.price.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        {editingService?.id === service.id ? (
                          <>
                            <Button onClick={updateService} size="sm">
                              Salvar
                            </Button>
                            <Button 
                              onClick={() => setEditingService(null)} 
                              variant="outline" 
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              onClick={() => setEditingService(service)} 
                              variant="outline" 
                              size="sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => deleteServiceHandler(service.id)} 
                              variant="destructive" 
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, appointmentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, appointmentId: null })}
              className="flex-1"
            >
              Não
            </Button>
            <Button
              onClick={() => cancelDialog.appointmentId && cancelAppointment(cancelDialog.appointmentId)}
              variant="destructive"
              className="flex-1"
            >
              Sim, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentUser?.role === 'superadmin' ? 'Alterar Senha do Super Admin' : 'Alterar Minha Senha'}
            </DialogTitle>
            <DialogDescription>
              Digite sua senha atual e a nova senha para alterar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
