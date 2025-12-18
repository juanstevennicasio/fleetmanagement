'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileSpreadsheet, FileText, Calendar, Filter, RefreshCw } from "lucide-react";
import { ClientService, ResourceService, RouteService, RouteHistory, Messenger, Client } from '../services';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

// Helper for exact duration
const formatExactDuration = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '0s';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime(); // ms
    
    if (diff < 0) return '0s';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
};


// Extend jsPDF for autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function ReportsPage() {
    const { user } = useAuth();
    const [allRoutes, setAllRoutes] = useState<RouteHistory[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<RouteHistory[]>([]);
    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<'general' | 'messenger' | 'client' | 'duration'>('general');

    // Date Filters
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterData();
    }, [allRoutes, startDate, endDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [routesData, messengersData, clientsData] = await Promise.all([
                RouteService.getRouteHistory(),
                ResourceService.getAllMessengers(),
                ClientService.getAllClients()
            ]);
            // Filter completed routes for reports
            
            setAllRoutes(routesData);
            setMessengers(messengersData);
            setClients(clientsData);
        } catch (error) {
            console.error("Error loading report data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        if (!startDate || !endDate) {
            setFilteredRoutes(allRoutes);
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const filtered = allRoutes.filter(r => {
            const routeDate = new Date(r.startTime);
            return routeDate >= start && routeDate <= end;
        });
        setFilteredRoutes(filtered);
    };

    // Calculate Stats
    const totalRoutes = filteredRoutes.length;
    const averageDuration = totalRoutes > 0 
        ? (filteredRoutes.reduce((acc, curr) => {
            const diff = new Date(curr.endTime).getTime() - new Date(curr.startTime).getTime();
            return acc + (diff / 60000); // minutes
        }, 0) / totalRoutes).toFixed(1)
        : "0.0";
    
    // Messenger Stats
    const messengerStats = messengers.map(m => {
        const messengerRoutes = filteredRoutes.filter(r => r.messengerId === m.id);
        const totalDuration = messengerRoutes.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        return {
            name: `${m.firstName} ${m.lastName}`,
            entregas: messengerRoutes.length,
            duracionPromedio: messengerRoutes.length > 0 ? Math.round(totalDuration / messengerRoutes.length) : 0
        };
    }).filter(s => s.entregas > 0).sort((a, b) => b.entregas - a.entregas);

    // Client Stats
    const clientStats = clients.map(c => {
        const clientRoutes = filteredRoutes.filter(r => r.clientName === c.locationName || r.clientName === c.fullName); // Simple match
        return {
            name: c.locationName,
            visitas: clientRoutes.length
        };
    }).filter(s => s.visitas > 0).sort((a, b) => b.visitas - a.visitas).slice(0, 10);

    // Duration Distribution
    const durationRanges = [
        { rango: '0-15 min', min: 0, max: 15, cantidad: 0 },
        { rango: '16-30 min', min: 16, max: 30, cantidad: 0 },
        { rango: '31-60 min', min: 31, max: 60, cantidad: 0 },
        { rango: '> 60 min', min: 61, max: 9999, cantidad: 0 }
    ];

    filteredRoutes.forEach(r => {
        const d = r.duration || 0;
        const range = durationRanges.find(range => d >= range.min && d <= range.max);
        if (range) range.cantidad++;
    });

    // Daily Stats for Line Chart
    const dailyStats = filteredRoutes.reduce((acc: any[], curr) => {
        const date = new Date(curr.startTime).toLocaleDateString('es-DO');
        const existing = acc.find(item => item.dia === date);
        if (existing) {
            existing.entregas++;
        } else {
            acc.push({ dia: date, entregas: 1 });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

    // --- Exports ---

    const exportCSV = () => {
        const headers = ['ID', 'Fecha', 'Salida', 'Llegada', 'Mensajero', 'Cliente', 'Duración (min)', 'Estado'];
        const rows = filteredRoutes.map(r => [
            r.id,
            new Date(r.startTime).toLocaleDateString('es-DO'),
            new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            r.messengerName,
            r.clientName,
            formatExactDuration(r.startTime, r.endTime),
            'Completada'
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_entregas_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredRoutes.map(r => ({
            ID: r.id,
            Fecha: new Date(r.startTime).toLocaleDateString('es-DO'),
            Salida: new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            Llegada: new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            Mensajero: r.messengerName,
            Cliente: r.clientName,
            Duracion_Min: formatExactDuration(r.startTime, r.endTime),
            Estado: 'Completada'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Entregas");
        XLSX.writeFile(workbook, `Reporte_General_${startDate}_${endDate}.xlsx`);
    };

    const exportPDF = () => {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        // Header
        doc.setFontSize(20);
        doc.text("Reporte General de Entregas", 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Rango: ${startDate} a ${endDate}`, 14, 36);

        // Stats Summary
        doc.text(`Total Entregas: ${totalRoutes}`, 14, 46);
        doc.text(`Duración Promedio: ${averageDuration} min`, 80, 46);

        // Table
        const tableColumn = ["Fecha", "Salida", "Llegada", "Mensajero", "Cliente", "Duración"];
        const tableRows: any[] = [];

        filteredRoutes.forEach(route => {
            const routeData = [
                new Date(route.startTime).toLocaleDateString(),
                new Date(route.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                new Date(route.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                route.messengerName,
                route.clientName,
                `${formatExactDuration(route.startTime, route.endTime)}`
            ];
            tableRows.push(routeData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 54,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save(`reporte_entregas_pdf_${startDate}_${endDate}.pdf`);
    };

    return (
        <div className="space-y-8 p-8 fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes y Analíticas</h1>
                    <p className="text-muted-foreground">Visualiza el rendimiento de tu flota en tiempo real.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center gap-2 px-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <input 
                            type="date" 
                            className="bg-transparent text-sm focus:outline-none w-32"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm focus:outline-none w-32"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="h-6 w-px bg-border mx-1"></div>
                    <Button variant="ghost" size="sm" onClick={loadData} isLoading={loading}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Entregas</CardDescription>
                        <CardTitle className="text-4xl">{totalRoutes}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="text-emerald-500 font-bold">100%</span> completadas
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>Duración Promedio</CardDescription>
                        <CardTitle className="text-4xl">{averageDuration}<span className="text-lg text-muted-foreground ml-1">min</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Tiempo por entrega
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>Mensajeros Activos</CardDescription>
                        <CardTitle className="text-4xl">{messengers.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            En nómina
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow bg-primary text-primary-foreground">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/80">Exportar Datos</CardDescription>
                        <CardTitle className="text-2xl">Reportes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={exportPDF} title="PDF">
                            <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={exportExcel} title="Excel">
                            <FileSpreadsheet className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={exportCSV} title="CSV">
                            <Download className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Daily Trend */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tendencia Diaria</CardTitle>
                        <CardDescription>Volumen de entregas por día</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="dia" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Line type="monotone" dataKey="entregas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Messenger Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rendimiento por Mensajero</CardTitle>
                        <CardDescription>Top mensajeros por volumen</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={messengerStats.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
                                <Bar dataKey="entregas" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. Duration Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tiempos de Entrega</CardTitle>
                        <CardDescription>Distribución por duración</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={durationRanges}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="cantidad"
                                >
                                    {durationRanges.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalle de Operaciones</CardTitle>
                    <CardDescription>Listado completo de entregas en el rango seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="text-left border-b">
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Fecha</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Mensajero</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Cliente</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Salida</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Llegada</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground">Duración</th>
                                    <th className="h-10 px-4 font-medium text-muted-foreground text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoutes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No hay registros en este rango de fechas.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRoutes.map((route, i) => {
                                        const messenger = messengers.find(m => m.id === route.messengerId);
                                        return (
                                        <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle">{new Date(route.startTime).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle font-medium">
                                                <div className="flex items-center gap-2">
                                                    {messenger?.photoUrl ? (
                                                        <img src={messenger.photoUrl} alt={route.messengerName} className="w-8 h-8 rounded-full object-cover border border-border" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border border-border">
                                                            {route.messengerName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {route.messengerName}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">{route.clientName}</td>
                                            <td className="p-4 align-middle">{new Date(route.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="p-4 align-middle">{new Date(route.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="p-4 align-middle">{formatExactDuration(route.startTime, route.endTime)}</td>
                                            <td className="p-4 align-middle text-right">
                                                <span className="inline-flex items-center rounded-full border border-transparent bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                    Completado
                                                </span>
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
