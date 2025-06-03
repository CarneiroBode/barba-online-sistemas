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

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
}

interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'client';
  companyName?: string;
  companyId?: string;
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
  const [view, setView] = useState<'dashboard' | 'appointments' | 'services' | 'company' | 'users' | 'calendar' | 'hours'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Estados para edição de serviços
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });

  // Estado para cancelamento de agendamentos
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointmentId: string | null }>({ 
    open: false, 
    appointmentId: null 
  });

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = () => {
    // Determinar o prefixo dos dados baseado no tipo de usuário
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    
    const savedAppointments = localStorage.getItem(`${dataPrefix}appointments`);
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }

    const savedServices = localStorage.getItem(`${dataPrefix}services`);
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      // Serviços padrão apenas se não houver salvos
      const defaultServices: Service[] = [
        { id: '1', name: 'Serviço Básico', price: 50, duration: 30 },
        { id: '2', name: 'Serviço Premium', price: 100, duration: 60 }
      ];
      setServices(defaultServices);
      localStorage.setItem(`${dataPrefix}services`, JSON.stringify(defaultServices));
    }

    const savedCompanyInfo = localStorage.getItem(`${dataPrefix}companyInfo`);
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    } else if (currentUser?.role === 'client') {
      // Para clientes, usar o nome da empresa do perfil como padrão
      setCompanyInfo(prev => ({
        ...prev,
        name: currentUser.companyName || ''
      }));
    }
  };

  const saveCompanyInfo = () => {
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    localStorage.setItem(`${dataPrefix}companyInfo`, JSON.stringify(companyInfo));
    toast({
      title: "Informações salvas!",
      description: "As informações da empresa foram atualizadas com sucesso.",
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const addService = () => {
    if (!newService.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do serviço é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      price: newService.price,
      duration: newService.duration
    };

    const updatedServices = [...services, service];
    setServices(updatedServices);
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    localStorage.setItem(`${dataPrefix}services`, JSON.stringify(updatedServices));
    setNewService({ name: '', price: 0, duration: 30 });
    
    toast({
      title: "Serviço adicionado!",
      description: `${service.name} foi adicionado com sucesso.`,
    });
  };

  const updateService = () => {
    if (!editingService) return;

    const updatedServices = services.map(service => 
      service.id === editingService.id ? editingService : service
    );
    setServices(updatedServices);
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    localStorage.setItem(`${dataPrefix}services`, JSON.stringify(updatedServices));
    setEditingService(null);
    
    toast({
      title: "Serviço atualizado!",
      description: `${editingService.name} foi atualizado com sucesso.`,
    });
  };

  const deleteService = (serviceId: string) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    localStorage.setItem(`${dataPrefix}services`, JSON.stringify(updatedServices));
    
    toast({
      title: "Serviço removido!",
      description: "O serviço foi removido com sucesso.",
    });
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

  const cancelAppointment = (appointmentId: string) => {
    const updatedAppointments = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    );
    setAppointments(updatedAppointments);
    const dataPrefix = currentUser?.role === 'superadmin' ? '' : `${currentUser?.companyId}_`;
    localStorage.setItem(`${dataPrefix}appointments`, JSON.stringify(updatedAppointments));
    setCancelDialog({ open: false, appointmentId: null });
    
    toast({
      title: "Agendamento cancelado",
      description: "O agendamento foi cancelado com sucesso.",
    });
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
            {currentUser.role === 'superadmin' ? 'Painel Super Admin' : companyInfo.name || 'Painel Administrativo'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Olá, {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.companyName}
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2 flex-wrap">
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
            {currentUser.role === 'superadmin' && (
              <Button 
                variant={view === 'users' ? 'default' : 'outline'}
                onClick={() => setView('users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Clientes
              </Button>
            )}
          </div>
        </div>

        {view === 'users' && currentUser.role === 'superadmin' && (
          <UserManagement currentUser={currentUser} />
        )}

        {view === 'calendar' && (
          <CalendarView
            appointments={appointments}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
            companyId={currentUser.role === 'client' ? currentUser.companyId : undefined}
          />
        )}

        {view === 'hours' && (
          <BusinessHours companyId={currentUser.role === 'client' ? currentUser.companyId : undefined} />
        )}

        {view === 'company' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button onClick={saveCompanyInfo} className="w-full">
                Salvar Informações
              </Button>
            </CardContent>
          </Card>
        )}

        {view === 'dashboard' && (
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

        {view === 'appointments' && (
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

        {view === 'services' && (
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
                              onClick={() => deleteService(service.id)} 
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
    </div>
  );
};

export default Admin;
