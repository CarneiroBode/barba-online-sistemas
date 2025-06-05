import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment, Service } from "@/pages/Index";

interface MyAppointmentsProps {
  appointments: Appointment[];
  services: Service[];
  onBack: () => void;
  onCancelAppointment: (appointmentId: string) => void;
  onNewAppointment: () => void;
}

const MyAppointments = ({
  appointments,
  services,
  onBack,
  onCancelAppointment,
  onNewAppointment
}: MyAppointmentsProps) => {
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

  const getServiceDetails = (serviceId: string) => {
    return services.find(s => s.id === serviceId);
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingAppointments = sortedAppointments.filter(apt => {
    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
    return aptDateTime > new Date() && apt.status !== 'cancelled';
  });

  const pastAppointments = sortedAppointments.filter(apt => {
    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
    return aptDateTime <= new Date() || apt.status === 'cancelled';
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-20">
        <h1 className="text-2xl font-bold mb-8 text-center">Meus Agendamentos</h1>

        {upcomingAppointments.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.map(apt => {
                const service = getServiceDetails(apt.serviceId);
                return (
                  <div key={apt.id} className="p-4 border border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{service?.name}</h3>
                        <p className="text-sm text-gray-400">{formatDate(apt.date)}</p>
                        <p className="text-sm text-gray-400">às {apt.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {service?.price.toFixed(2)}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onCancelAppointment(apt.id)}
                          className="mt-2"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {pastAppointments.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastAppointments.map(apt => {
                const service = getServiceDetails(apt.serviceId);
                return (
                  <div key={apt.id} className="p-4 border border-gray-700 rounded-lg opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{service?.name}</h3>
                        <p className="text-sm text-gray-400">{formatDate(apt.date)}</p>
                        <p className="text-sm text-gray-400">às {apt.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {service?.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">{apt.status}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={onNewAppointment}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Novo Agendamento
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
