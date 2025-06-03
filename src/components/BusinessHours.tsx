
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";

interface BusinessHoursProps {
  companyId?: string;
}

interface DaySchedule {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const BusinessHours = ({ companyId }: BusinessHoursProps) => {
  const { toast } = useToast();
  
  const defaultSchedule: WeekSchedule = {
    monday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    tuesday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    wednesday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    thursday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    friday: { enabled: true, openTime: '08:00', closeTime: '18:00' },
    saturday: { enabled: true, openTime: '08:00', closeTime: '16:00' },
    sunday: { enabled: false, openTime: '08:00', closeTime: '18:00' }
  };

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const dataPrefix = companyId ? `${companyId}_` : '';
    const saved = localStorage.getItem(`${dataPrefix}businessHours`);
    return saved ? JSON.parse(saved) : defaultSchedule;
  });

  const [slotDuration, setSlotDuration] = useState(() => {
    const dataPrefix = companyId ? `${companyId}_` : '';
    const saved = localStorage.getItem(`${dataPrefix}slotDuration`);
    return saved ? parseInt(saved) : 30;
  });

  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const updateDaySchedule = (day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const saveSchedule = () => {
    const dataPrefix = companyId ? `${companyId}_` : '';
    localStorage.setItem(`${dataPrefix}businessHours`, JSON.stringify(schedule));
    localStorage.setItem(`${dataPrefix}slotDuration`, slotDuration.toString());
    
    toast({
      title: "Horários salvos!",
      description: "Os horários de funcionamento foram atualizados com sucesso.",
    });
  };

  const copyToAllDays = (sourceDay: keyof WeekSchedule) => {
    const sourceSchedule = schedule[sourceDay];
    const newSchedule = { ...schedule };
    
    Object.keys(newSchedule).forEach(day => {
      if (day !== sourceDay) {
        newSchedule[day as keyof WeekSchedule] = {
          ...sourceSchedule,
          enabled: newSchedule[day as keyof WeekSchedule].enabled
        };
      }
    });
    
    setSchedule(newSchedule);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Configurações de Horários</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slot-duration">Duração dos Horários (minutos)</Label>
              <Input
                id="slot-duration"
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value) || 30)}
                min="15"
                max="120"
                step="15"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Define o intervalo entre horários disponíveis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(dayNames).map(([dayKey, dayName]) => {
            const day = dayKey as keyof WeekSchedule;
            const daySchedule = schedule[day];
            
            return (
              <div key={day} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(checked) => updateDaySchedule(day, 'enabled', checked)}
                    />
                    <Label className="text-base font-medium">{dayName}</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToAllDays(day)}
                    disabled={!daySchedule.enabled}
                  >
                    Copiar para todos
                  </Button>
                </div>

                {daySchedule.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`${day}-open`}>Abertura</Label>
                      <Input
                        id={`${day}-open`}
                        type="time"
                        value={daySchedule.openTime}
                        onChange={(e) => updateDaySchedule(day, 'openTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${day}-close`}>Fechamento</Label>
                      <Input
                        id={`${day}-close`}
                        type="time"
                        value={daySchedule.closeTime}
                        onChange={(e) => updateDaySchedule(day, 'closeTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${day}-break-start`}>Início Intervalo</Label>
                      <Input
                        id={`${day}-break-start`}
                        type="time"
                        value={daySchedule.breakStart || ''}
                        onChange={(e) => updateDaySchedule(day, 'breakStart', e.target.value || undefined)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${day}-break-end`}>Fim Intervalo</Label>
                      <Input
                        id={`${day}-break-end`}
                        type="time"
                        value={daySchedule.breakEnd || ''}
                        onChange={(e) => updateDaySchedule(day, 'breakEnd', e.target.value || undefined)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          <Button onClick={saveSchedule} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Horários de Funcionamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessHours;
