
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Service, Appointment } from "@/pages/Index";
import { getAvailableTimeSlots, isTimeSlotInFuture } from "@/utils/timeUtils";
import { isBusinessOpen } from "@/utils/businessHours";

interface DateTimeSelectionProps {
  service: Service;
  onDateTimeSelect: (date: string, time: string) => void;
  onBack: () => void;
  existingAppointments: Appointment[];
  companyId?: string;
}

const DateTimeSelection = ({ service, onDateTimeSelect, onBack, existingAppointments, companyId }: DateTimeSelectionProps) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Gerar próximos 14 dias (2 semanas)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      const monthNames = ['JAN', 'FEB', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      
      const dateString = date.toISOString().split('T')[0];
      const isOpen = isBusinessOpen(dateString, companyId);
      
      dates.push({
        date: dateString,
        dayName: dayNames[date.getDay()],
        day: date.getDate().toString().padStart(2, '0'),
        month: monthNames[date.getMonth()],
        fullDate: date,
        isOpen
      });
    }
    return dates;
  };

  const generateTimeSlots = () => {
    return getAvailableTimeSlots(selectedDate, companyId);
  };

  const isTimeSlotAvailable = (date: string, time: string) => {
    // Verificar se não há agendamento confirmado no horário
    const hasExistingAppointment = existingAppointments.some(apt => 
      apt.date === date && 
      apt.time === time && 
      apt.status === 'confirmed' &&
      (companyId ? apt.companyId === companyId : true)
    );
    
    // Verificar se o horário não é no passado
    const isFutureTime = isTimeSlotInFuture(date, time);
    
    return !hasExistingAppointment && isFutureTime;
  };

  const dates = generateDates();
  const timeSlots = generateTimeSlots();

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const dayName = dayNames[date.getDay()];
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      onDateTimeSelect(selectedDate, selectedTime);
    }
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
          <p className="text-gray-400 mb-6">SELECIONE O DIA E HORÁRIO:</p>
        </div>

        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-4">
            {dates.map((dateObj) => (
              <Card 
                key={dateObj.date}
                className={`min-w-[80px] cursor-pointer transition-colors ${
                  !dateObj.isOpen 
                    ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                    : selectedDate === dateObj.date 
                    ? 'bg-amber-700 border-amber-600' 
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                }`}
                onClick={() => dateObj.isOpen && setSelectedDate(dateObj.date)}
              >
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-300">{dateObj.dayName}</p>
                  <p className="text-2xl font-bold text-white">{dateObj.day}</p>
                  <p className="text-sm text-gray-300">{dateObj.month}</p>
                  {!dateObj.isOpen && (
                    <p className="text-xs text-red-400 mt-1">Fechado</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center text-gray-400 text-sm">
            <span>→ ARRASTE PARA O LADO PARA VER MAIS</span>
          </div>
        </div>

        {selectedDate && (
          <div className="mb-8">
            {timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Nenhum horário disponível para esta data.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.map((time) => {
                  const isAvailable = isTimeSlotAvailable(selectedDate, time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={`p-4 rounded-xl text-lg ${
                        selectedTime === time 
                          ? 'bg-amber-700 hover:bg-amber-600 border-amber-600' 
                          : isAvailable 
                            ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-white' 
                            : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={() => isAvailable && setSelectedTime(time)}
                      disabled={!isAvailable}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedDate && selectedTime && (
          <div className="text-center mb-6">
            <p className="text-white">{formatSelectedDate()} às {selectedTime}</p>
          </div>
        )}

        <Button 
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl p-4 text-lg"
        >
          Enviar
        </Button>

        <Button 
          onClick={onBack}
          variant="ghost"
          className="w-full mt-4 text-white hover:bg-gray-700 rounded-xl p-4 text-lg"
        >
          Voltar
        </Button>
      </div>
    </div>
  );
};

export default DateTimeSelection;
