
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Settings } from "lucide-react";
import { Appointment, Service } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [view, setView] = useState<'dashboard' | 'appointments' | 'services'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Carregar dados do localStorage
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }

    const defaultServices: Service[] = [
      { id: '1', name: 'Corte', price: 35, duration: 30 },
      { id: '2', name: 'Barba', price: 35, duration: 30 },
      { id: '3', name: 'Corte + Barba', price: 60, duration: 60 },
      { id: '4', name: 'Barboterapia', price: 89, duration: 90 },
      { id: '5', name: 'Pezinho', price: 10, duration: 15 }
    ];
    setServices(defaultServices);
  }, []);

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

  const stats = getTodayStats();
  const dayAppointments = getAppointmentsByDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel do Barbeiro</h1>
          <div className="flex space-x-2">
            <Button 
              variant={view === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setView('dashboard')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Dashboard
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
          </div>
        </div>

        {view === 'dashboard' && (
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
        )}

        {view === 'appointments' && (
          <div>
            <div className="mb-6">
              <Label htmlFor="date-picker">Selecionar Data:</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{formatDate(selectedDate)}</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.duration} minutos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {service.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
