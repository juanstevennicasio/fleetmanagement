'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Users, Truck, Car, Route, TrendingUp, AlertTriangle, Clock, CheckCircle, Cake, Calendar } from "lucide-react";
import Link from "next/link";
import { ResourceService, ClientService, DispatchService, isBirthdayToday, isLicenseExpiringSoon, isLicenseExpired, getBirthdayMessage } from './services';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [messengers, setMessengers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [messengerData, clientData, vehicleData, routeData] = await Promise.all([
        ResourceService.getAvailableMessengers(),
        ClientService.getAllClients(),
        ResourceService.getAvailableVehicles(),
        DispatchService.getActiveRoutes()
      ]);
      setMessengers(messengerData);
      setClients(clientData);
      setVehicles(vehicleData);
      setRoutes(routeData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate live stats
  const activeRoutesCount = routes.filter(r => r.status === 'active').length;
  const totalMessengers = messengers.length;
  const totalVehicles = vehicles.length;

  // Calculate alerts
  const birthdaysToday = [...messengers.filter(m => m.dob && isBirthdayToday(m.dob)), ...clients.filter(c => c.dob && isBirthdayToday(c.dob))];
  const expiringSoonLicenses = messengers.filter(m => m.licenseExpiry && isLicenseExpiringSoon(m.licenseExpiry));
  const expiredLicenses = messengers.filter(m => m.licenseExpiry && isLicenseExpired(m.licenseExpiry));
  const totalAlerts = birthdaysToday.length + expiringSoonLicenses.length + expiredLicenses.length;

  const stats = [
    { label: "Rutas Activas", value: activeRoutesCount.toString(), icon: Route, color: "text-primary", href: "/routes" },
    { label: "Total Mensajeros", value: totalMessengers.toString(), icon: Users, color: "text-secondary", href: "/messengers" },
    { label: "Vehículos de Flota", value: totalVehicles.toString(), icon: Car, color: "text-accent", href: "/vehicles" },
    { label: "Alertas Pendientes", value: totalAlerts.toString(), icon: AlertTriangle, color: "text-warning", href: "/alerts" },
  ];

  // Generate alerts
  const recentAlerts = [
    ...birthdaysToday.map(person => ({
      id: `birthday-${person.id}`,
      type: "Cumpleaños Hoy",
      message: `¡${('firstName' in person ? `${person.firstName} ${person.lastName}` : person.fullName)} cumple años hoy! 🎉`,
      severity: "success" as const,
      icon: Cake
    })),
    ...expiredLicenses.map(m => ({
      id: `expired-${m.id}`,
      type: "Licencia Vencida",
      message: `La licencia de ${m.firstName} ${m.lastName} está VENCIDA`,
      severity: "error" as const,
      icon: AlertTriangle
    })),
    ...expiringSoonLicenses.map(m => ({
      id: `expiring-${m.id}`,
      type: "Licencia por Vencer",
      message: `La licencia de ${m.firstName} ${m.lastName} vence pronto`,
      severity: "warning" as const,
      icon: Calendar
    }))
  ].slice(0, 5); // Show only first 5 alerts

  const copyBirthdayMessage = (person: any) => {
    const message = 'firstName' in person
      ? getBirthdayMessage(person.firstName, person.lastName)
      : getBirthdayMessage(person.fullName.split(' ')[0], person.fullName.split(' ').slice(1).join(' '));
    navigator.clipboard.writeText(message);
    alert('¡Mensaje de cumpleaños copiado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel principal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Panel Principal</h1>
        <p className="text-muted-foreground">Bienvenido a LogiTrack Enterprise v5 - {user?.username}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card hover className="relative overflow-hidden cursor-pointer">
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      En tiempo real
                    </span>
                    <Icon className={`w-8 h-8 ${stat.color} opacity-20 absolute right-4 top-4`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Rutas Activas
            </CardTitle>
            <CardDescription>Entregas actualmente en progreso</CardDescription>
          </CardHeader>
          <CardContent>
            {routes.filter(r => r.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay rutas activas en este momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {routes.filter(r => r.status === 'active').slice(0, 3).map((route) => {
                  const messenger = messengers.find(m => m.id === route.messengerId);
                  const vehicle = vehicles.find(v => v.id === route.vehicleId);
                  return (
                    <div key={route.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                      <div className="flex-1">
                        <p className="font-semibold">{messenger ? `${messenger.firstName} ${messenger.lastName}` : 'Mensajero'}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle ? `${vehicle.code} - ${vehicle.model}` : 'Vehículo'} • {route.stops?.length || 0} paradas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {route.startTime ? new Date(route.startTime.seconds * 1000).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Activa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/routes">
              <Button variant="outline" className="w-full mt-4">
                Ver Todas las Rutas
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas y Notificaciones
            </CardTitle>
            <CardDescription>Eventos importantes del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <div key={alert.id} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                      <div className={`w-2 h-2 rounded-full mt-2 ${alert.severity === 'error' ? 'bg-error' :
                          alert.severity === 'warning' ? 'bg-warning' :
                            alert.severity === 'success' ? 'bg-success' : 'bg-info'
                        }`} />
                      <Icon className={`w-5 h-5 mt-0.5 ${alert.severity === 'error' ? 'text-error' :
                          alert.severity === 'warning' ? 'text-warning' :
                            alert.severity === 'success' ? 'text-success' : 'text-info'
                        }`} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.type}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/alerts">
              <Button variant="outline" className="w-full mt-4">
                Ver Todas las Alertas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Tareas comunes y accesos directos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/routes">
              <Button variant="primary" className="w-full">
                <Route className="w-4 h-4" />
                Nueva Ruta
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="secondary" className="w-full">
                <Users className="w-4 h-4" />
                Agregar Cliente
              </Button>
            </Link>
            <Link href="/messengers">
              <Button variant="outline" className="w-full">
                <Truck className="w-4 h-4" />
                Gestionar Mensajeros
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4" />
                Ver Reportes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
