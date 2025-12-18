'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { AuditService, AuditLog, AuthService, PlatformUser } from '../services';
import { Shield, UserPlus, History, Settings, X } from "lucide-react";
import { useSystemConfig } from '../context/SystemConfigContext';

export default function SettingsPage() {
    const router = useRouter();
    const { config, updateConfig } = useSystemConfig();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logsData, usersData] = await Promise.all([
                AuditService.getAllLogs(),
                AuthService.getPlatformUsers()
            ]);
            setLogs(logsData as unknown as AuditLog[]);
            setUsers(usersData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold mb-2">Configuración</h1>
                <p className="text-muted-foreground">Gestión de usuarios y auditoría del sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Configuration Section */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configuración del Sistema
                        </CardTitle>
                        <CardDescription>Personalizar apariencia</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Nombre del Sistema</label>
                                <input
                                    type="text"
                                    value={config.appName}
                                    onChange={(e) => updateConfig({ appName: e.target.value })}
                                    className="w-full p-2 rounded-md border bg-background"
                                    placeholder="LogiTrack Enterprise v5"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Logo (URL o Base64)</label>
                                <input
                                    type="text"
                                    value={config.appLogo}
                                    onChange={(e) => updateConfig({ appLogo: e.target.value })}
                                    className="w-full p-2 rounded-md border bg-background"
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Deja vacío para usar el logo por defecto
                                </p>
                            </div>
                            {config.appLogo && (
                                <div className="mt-2 p-2 border rounded-md flex justify-center bg-muted/20">
                                    <img src={config.appLogo} alt="Logo Preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* User Management Section */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Usuarios de Plataforma
                        </CardTitle>
                        <CardDescription>Gestionar acceso al sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button variant="primary" className="w-full" onClick={() => router.push('/users')}>
                                <UserPlus className="w-4 h-4" />
                                Ir a Gestión de Usuarios
                            </Button>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {users.map((user, index) => (
                                    <div key={index} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">{user.name}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary-foreground'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                ))}
                                {users.length === 0 && !loading && (
                                    <p className="text-center text-muted-foreground text-sm">No hay usuarios encontrados.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Log Section */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Registro de Auditoría
                        </CardTitle>
                        <CardDescription>Historial inmutable de acciones (Últimos 50)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-center text-muted-foreground py-4">Cargando registros...</p>
                            ) : logs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No hay registros de auditoría.</p>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Acción</th>
                                                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                                                <th className="px-4 py-3 text-left font-medium">Detalles</th>
                                                <th className="px-4 py-3 text-right font-medium">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {logs.map((log, index) => (
                                                <tr key={index} className="hover:bg-muted/50">
                                                    <td className="px-4 py-3 font-medium">{log.action}</td>
                                                    <td className="px-4 py-3">{log.user}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{log.details}</td>
                                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                                        {log.timestamp?.seconds
                                                            ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                                                            : 'Justo ahora'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create User Modal */}
            
        </div>
    );
}

