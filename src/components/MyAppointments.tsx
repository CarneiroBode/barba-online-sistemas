import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Appointment } from "@/pages/Index";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MyAppointmentsProps {
  appointments: Appointment[];
  onBack: () => void;
  onCancelAppointment: (appointmentId: string) => void;
  onNewAppointment: () => void;
}

const MyAppointments = ({ appointments, onBack, onCancelAppointment, onNewAppointment }: MyAppointmentsProps) => {
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; appointmentId: string | null }>({ 
    open: false, 
    appointmentId: null 
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const dayName = dayNames[date.getDay()];

    return `${dayName}, ${day} ${month} ${year}`;
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
    const diffInHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    console.log('Can cancel check:', { diffInHours, status: appointment.status, canCancel: diffInHours >= 2 && appointment.status === 'confirmed' });
    return diffInHours >= 2 && appointment.status === 'confirmed';
  };

  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  const handleCancelClick = (appointmentId: string) => {
    setCancelDialog({ open: true, appointmentId });
  };

  const handleConfirmCancel = () => {
    if (cancelDialog.appointmentId) {
      onCancelAppointment(cancelDialog.appointmentId);
    }
    setCancelDialog({ open: false, appointmentId: null });
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
          <h1 className="text-2xl font-bold">Meus</h1>
          <h1 className="text-4xl font-bold mb-8">Agendamentos</h1>
        </div>

        {confirmedAppointments.length === 0 ? (
          <div className="text-center py-12">            
            <h2 className="text-xl font-semibold mb-4">Você não possui agendamentos em aberto.</h2>
            <p className="text-gray-400 mb-8">Realize um agendamento e ele aparecerá aqui!</p>

            <Button 
              onClick={onNewAppointment}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
            >
              Novo Agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmedAppointments.map((appointment) => {
              const canCancel = canCancelAppointment(appointment);
              return (
                <Card key={appointment.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-white text-sm">{formatDate(appointment.date)} às {appointment.time}</p>
                        <h3 className="text-white text-xl font-bold mt-2">{appointment.clientName}</h3>
                        <p className="text-gray-300 text-lg">{appointment.service.name.toUpperCase()}</p>
                        <p className="text-gray-400">PROFISSIONAL: {appointment.professional.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xl font-bold">R$ {appointment.service.price.toFixed(2)}</p>
                        {canCancel && (
                          <Button
                            onClick={() => handleCancelClick(appointment.id)}
                            variant="destructive"
                            size="sm"
                            className="mt-2"
                          >
                            CANCELAR
                          </Button>
                        )}
                      </div>
                    </div>

                    {canCancel && (
                      <div className="mt-4 p-3 bg-gray-600 rounded-lg">
                        <p className="text-sm text-gray-300">
                          Este estabelecimento permite cancelamentos com no mínimo 2h de antecedência.
                        </p>
                      </div>
                    )}

                    {!canCancel && (
                      <div className="mt-4 p-3 bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-300">
                          Cancelamento não permitido (menos de 2h de antecedência ou agendamento já passou).
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button 
              onClick={onNewAppointment}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg mt-6"
            >
              Novo Agendamento
            </Button>
          </div>
        )}
      </div>

      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, appointmentId: null })}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Deseja cancelar este horário?</DialogTitle>
            <DialogDescription>
              Ao confirmar, este horário poderá ser preenchido por outro agendamento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, appointmentId: null })}
              className="flex-1"
            >
              NÃO
            </Button>
            <Button
              onClick={handleConfirmCancel}
              className="flex-1 bg-amber-700 hover:bg-amber-600"
            >
              SIM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointments;