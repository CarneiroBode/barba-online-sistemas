
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { Appointment } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  companyId?: string;
}

const CalendarView = ({ appointments, onDateSelect, selectedDate, companyId }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.date === dateString && 
      apt.status === 'confirmed' &&
      (companyId ? apt.companyId === companyId : true)
    );
  };

  const getDayContent = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

    return (
      <div className={cn(
        "w-full h-full flex flex-col items-center justify-center relative",
        isSelected && "bg-amber-700 text-white rounded-md",
        isToday && !isSelected && "bg-blue-100 rounded-md"
      )}>
        <span className="text-sm font-medium">{date.getDate()}</span>
        {dayAppointments.length > 0 && (
          <div className="flex space-x-1 mt-1">
            {dayAppointments.slice(0, 3).map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isSelected ? "bg-white" : "bg-amber-600"
                )}
              />
            ))}
            {dayAppointments.length > 3 && (
              <span className={cn(
                "text-xs",
                isSelected ? "text-white" : "text-amber-600"
              )}>
                +{dayAppointments.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Calendário de Agendamentos</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(currentMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border"
            components={{
              DayContent: ({ date }) => getDayContent(date)
            }}
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>{formatSelectedDate()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum agendamento para esta data.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{appointment.time}</Badge>
                        <div>
                          <p className="font-medium flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{appointment.clientName}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service.name}
                          </p>
                        </div>
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
      )}
    </div>
  );
};

export default CalendarView;
