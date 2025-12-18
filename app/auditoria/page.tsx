'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { History, Search, RefreshCw, User, Clock, FileEdit } from "lucide-react";
import { AuditService, AuditLog } from '../services';

export default function AuditHistoryPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, searchTerm, filterAction]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await AuditService.getAllLogs();
            setLogs(data);
        } catch (error) {
            console.error("Error loading audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        if (filterAction !== 'all') {
            filtered = filtered.filter(log => log.action.includes(filterAction.toUpperCase()));
        }

        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'text-success';
        if (action.includes('UPDATE')) return 'text-warning';
        if (action.includes('DELETE')) return 'text-error';
        return 'text-info';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATE')) return <Plus className="w-4 h-4" />;
        if (action.includes('UPDATE')) return <FileEdit className="w-4 h-4" />;
        if (action.includes('DELETE')) return <Trash2 className="w-4 h-4" />;
        return <History className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Historial de Auditoría</h1>
                    <p className="text-muted-foreground">Registro completo de todas las acciones del sistema</p>
                </div>
                <Button variant="outline" onClick={loadLogs} isLoading={loading}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 p-3 rounded-lg border border-input bg-background"
                                placeholder="Buscar por acción, usuario o detalles..."
                            />
                        </div>

                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="p-3 rounded-lg border border-input bg-background"
                        >
                            <option value="all">Todas las acciones</option>
                            <option value="create">Creaciones</option>
                            <option value="update">Modificaciones</option>
                            <option value="delete">Eliminaciones</option>
                            <option value="upload">Cargas de archivos</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{logs.length}</p>
                            <p className="text-sm text-muted-foreground">Total Registros</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-success">{logs.filter(l => l.action.includes('CREATE')).length}</p>
                            <p className="text-sm text-muted-foreground">Creaciones</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-warning">{logs.filter(l => l.action.includes('UPDATE')).length}</p>
                            <p className="text-sm text-muted-foreground">Modificaciones</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-error">{logs.filter(l => l.action.includes('DELETE')).length}</p>
                            <p className="text-sm text-muted-foreground">Eliminaciones</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Audit Log Timeline */}
            {loading ? (
                <div className="text-center py-10">Cargando registros...</div>
            ) : filteredLogs.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron registros</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Línea de Tiempo de Auditoría</CardTitle>
                        <CardDescription>Mostrando {filteredLogs.length} de {logs.length} registros</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredLogs.map((log, index) => (
                                <div key={index} className="flex gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${log.action.includes('CREATE') ? 'bg-success/20' :
                                        log.action.includes('UPDATE') ? 'bg-warning/20' :
                                            log.action.includes('DELETE') ? 'bg-error/20' : 'bg-info/20'
                                        }`}>
                                        {getActionIcon(log.action)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className={`font-semibold ${getActionColor(log.action)}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-sm text-foreground mt-1">{log.details}</p>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <User className="w-3 h-3" />
                                                    <span className="font-medium">{log.user}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(log.timestamp.seconds * 1000).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Missing imports
import { Plus, Trash2 } from "lucide-react";
