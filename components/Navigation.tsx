'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Truck, Car, Route, Bell, BarChart3, Trophy, Settings, LogOut, Image, History, DollarSign, Calendar, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Panel Principal', id: 'dashboard' },
  { href: '/routes', icon: Route, label: 'Rutas', id: 'routes', highlight: true },
  { href: '/clients', icon: Users, label: 'Clientes', id: 'clients' },
  { href: '/messengers', icon: Truck, label: 'Mensajeros', id: 'messengers' },
  { href: '/vehicles', icon: Car, label: 'Vehículos', id: 'vehicles' },
  { href: '/alerts', icon: Bell, label: 'Alertas', id: 'alerts' },
  { href: '/fuel', icon: DollarSign, label: 'Combustible', id: 'fuel' },
  { href: '/reports', icon: BarChart3, label: 'Reportes', id: 'reports' },
  { href: '/documents', icon: Briefcase, label: 'Documentos', id: 'documents' },
  { href: '/gamification', icon: Trophy, label: 'Clasificación', id: 'gamification' },
  { href: '/medios', icon: Image, label: 'Medios', id: 'medios' },
  { href: '/auditoria', icon: History, label: 'Auditoría', id: 'auditoria' },
  { href: '/calendar', icon: Calendar, label: 'Fechas Importantes', id: 'calendar' },
  { href: '/users', icon: Users, label: 'Usuarios', id: 'users', adminOnly: true },
];

import { useAuth } from "../app/context/AuthContext";
import { useSystemConfig } from "../app/context/SystemConfigContext";
import { useState, useEffect } from 'react';

function LiveClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Initial set
    setTime(new Date().toLocaleTimeString('es-DO', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-DO', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="h-6 w-20 bg-muted/50 animate-pulse rounded mx-auto" />;

  return (
    <div className="text-lg font-mono font-bold text-primary tracking-wider">
      {time}
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { config } = useSystemConfig();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { AlertService } = await import('../app/services');
        const alerts = await AlertService.getActiveAlerts();
        setAlertCount(alerts.length);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col z-50 shadow-xl">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          {config.appLogo ? (
            <img src={config.appLogo} alt="Logo" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
              LT
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{config.appName}</h1>
          </div>
        </div>

        {/* Live Clock */}
        <div className="mb-4 p-2 bg-primary/10 rounded-lg text-center border border-primary/20">
          <LiveClock />
        </div>

        {/* User Profile Snippet */}
        {user && (
          <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2 hover:bg-muted transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </Link>
        )}

        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.filter(item => {
          if (user?.role === 'admin') return true;
          if (item.adminOnly) return false;
          const allowed = user?.allowedSections || [];
          if (allowed.includes('all')) return true;
          return allowed.includes(item.id);
        }).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isHighlighted = 'highlight' in item && item.highlight;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : isHighlighted
                  ? 'glass-rgb-button text-foreground font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : isHighlighted ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {item.label === 'Alertas' && alertCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                    {alertCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
              {isHighlighted && !isActive && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                  ★
                </span>
              )}
            </Link>
          );
        })}

        {/* Settings Link */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${pathname === '/settings'
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
          <Settings className={`w-5 h-5 ${pathname === '/settings' ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
          <span className="font-medium">Configuración</span>
        </Link>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
