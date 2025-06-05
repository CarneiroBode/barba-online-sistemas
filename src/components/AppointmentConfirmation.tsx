import { Button } from "@/components/ui/button";
import { Service } from "@/pages/Index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  professionalName: string;
}

interface AppointmentConfirmationProps {
  clientName: string;
  service: Service;
  date: string;
  time: string;
  professional: string;
  companyInfo: CompanyInfo;
  onConfirm: () => void;
  onNewAppointment: () => void;
  onMyAppointments: () => void;
}

const AppointmentConfirmation = ({
  clientName,
  service,
  date,
  time,
  professional,
  companyInfo,
  onConfirm,
  onNewAppointment,
  onMyAppointments
}: AppointmentConfirmationProps) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-20">
        <h1 className="text-2xl font-bold mb-8 text-center">{companyInfo.name}</h1>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Confirmar Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400">Cliente</Label>
              <p className="text-white">{clientName}</p>
            </div>
            <div>
              <Label className="text-gray-400">Serviço</Label>
              <p className="text-white">{service.name}</p>
            </div>
            <div>
              <Label className="text-gray-400">Profissional</Label>
              <p className="text-white">{professional}</p>
            </div>
            <div>
              <Label className="text-gray-400">Data</Label>
              <p className="text-white">{new Date(date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <Label className="text-gray-400">Horário</Label>
              <p className="text-white">{time}</p>
            </div>
            <div>
              <Label className="text-gray-400">Valor</Label>
              <p className="text-white">R$ {service.price.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-gray-400">Duração</Label>
              <p className="text-white">{service.duration} minutos</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          <Button 
            onClick={onConfirm}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmar Agendamento
          </Button>
          <Button 
            onClick={onNewAppointment}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Novo Agendamento
          </Button>
          <Button 
            onClick={onMyAppointments}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Meus Agendamentos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;
