'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { AlertService, Alert } from "../services";
import { useState, useEffect } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await AlertService.getActiveAlerts();
    setAlerts(data);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-error/20 text-error border-error/50';
      case 'warning': return 'bg-warning/20 text-warning border-warning/50';
      case 'info': return 'bg-info/20 text-info border-info/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'warning': return Bell;
      case 'info': return Info;
      default: return CheckCircle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Alertas y Notificaciones</h1>
          <p className="text-muted-foreground">Alertas del sistema y notificaciones importantes</p>
        </div>
        <Button variant="outline" onClick={loadAlerts}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando alertas...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay alertas activas</div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getSeverityIcon(alert.severity);
            return (
              <Card key={alert.id} hover>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{alert.type}</h3>
                      <p className="text-muted-foreground mb-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.date}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
