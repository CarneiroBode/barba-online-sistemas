import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

interface WelcomeProps {
  onNewAppointment: () => void;
  onViewAppointments: () => void;
  companyName: string;
}

const Welcome = ({ onNewAppointment, onViewAppointments, companyName }: WelcomeProps) => {
  return (
    <div className="p-4">
      <div className="max-w-md mx-auto pt-20 text-center">
        <h1 className="text-2xl font-bold mb-8">{companyName}</h1>
        <div className="space-y-4">
          <Button 
            onClick={onNewAppointment}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          >
            <Calendar className="mr-2" />
            Novo Agendamento
          </Button>
          <Button 
            onClick={onViewAppointments}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          >
            <Clock className="mr-2" />
            Meus Agendamentos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome; 