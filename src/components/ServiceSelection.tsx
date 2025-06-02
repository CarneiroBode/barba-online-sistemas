
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "@/pages/Index";

interface ServiceSelectionProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  onBack: () => void;
}

const ServiceSelection = ({ services, onServiceSelect, onBack }: ServiceSelectionProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6 pt-4">
          <Button 
            onClick={onBack}
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-6">MEUS AGENDAMENTOS</h1>
          <div className="bg-amber-700 rounded-2xl p-6 mb-6">
            <p className="text-lg">Por qual serviço você está procurando?</p>
          </div>
          <p className="text-gray-400 mb-6">SELECIONE OS SERVIÇOS:</p>
        </div>

        <div className="space-y-4">
          {services.map((service) => (
            <Card 
              key={service.id}
              className="bg-gray-700 border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => onServiceSelect(service)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <h3 className="text-white text-lg font-semibold">{service.name}</h3>
                    <p className="text-gray-400">{formatDuration(service.duration)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xl font-bold">R$ {service.price.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <span>→</span>
            <span>ARRASTE PARA O LADO PARA VER MAIS</span>
          </div>
        </div>

        <Button 
          className="w-full mt-8 bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
          onClick={onBack}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelection;
