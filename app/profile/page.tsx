'use client';

import { useAuth } from '../context/AuthContext';
import { LogOut, Users } from 'lucide-react';
import Link from 'next/link';

const SECTION_LABELS: Record<string, string> = {
    dashboard: 'Panel Principal',
    routes: 'Rutas',
    clients: 'Clientes',
    messengers: 'Mensajeros',
    vehicles: 'Vehículos',
    alerts: 'Alertas',
    fuel: 'Combustible',
    reports: 'Reportes',
    gamification: 'Clasificación',
    medios: 'Medios',
    auditoria: 'Auditoría',
    calendar: 'Fechas Importantes',
    documents: 'Documentos',
    users: 'Usuarios',
};

const ROLE_LABELS: Record<string, string> = {
    admin: 'ADMINISTRADOR',
    dispatcher: 'DESPACHADOR',
    hr: 'RECURSOS HUMANOS',
    accounting: 'CONTABILIDAD',
    cashier: 'CAJA',
};

export default function ProfilePage() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-4xl font-bold">
                        {user.name.charAt(0)}
                    </div>

                    {/* Identity Info */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-foreground leading-tight">
                            {user.name}
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            @{user.username}
                        </p>
                    </div>

                    {/* Role Badge */}
                    <div>
                        <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-600 text-sm font-bold rounded-lg tracking-wide">
                            {ROLE_LABELS[user.role] || user.role.toUpperCase()}
                        </span>
                    </div>

                    {/* Access Section */}
                    <div className="mt-4 space-y-3">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            ACCESO A:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(user.allowedSections?.includes('all') ?
                                Object.keys(SECTION_LABELS).map(k => ({ id: k, label: SECTION_LABELS[k] }))
                                :
                                user.allowedSections?.map(s => ({ id: s, label: SECTION_LABELS[s] || s }))
                            )?.map((section) => (
                                <span
                                    key={section.id}
                                    className="px-3 py-1.5 bg-[#10B981] text-white text-sm font-medium rounded-md hover:bg-[#059669] transition-colors"
                                >
                                    {section.label}
                                </span>
                            ))}

                            {(!user.allowedSections || user.allowedSections.length === 0) && (
                                <span className="text-muted-foreground text-sm italic">Sin secciones asignadas</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {user.role === 'admin' && (
                    <Link
                        href="/users"
                        className="flex items-center gap-2 px-8 py-3 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary hover:text-white transition-all duration-200"
                    >
                        <Users className="w-4 h-4" />
                        GESTIONAR USUARIOS
                    </Link>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-8 py-3 bg-destructive/10 text-destructive text-sm font-bold rounded-xl hover:bg-destructive hover:text-white transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    CERRAR SESIÓN
                </button>
            </div>
        </div>
    );
}
