'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Cake, AlertTriangle, Building, Clock, Truck } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientService, ResourceService, CalendarService, CustomEvent, Client } from '../services';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'birthday' | 'expiry' | 'foundation' | 'meeting' | 'maintenance' | 'holiday' | 'other';
    description?: string;
    isCustom: boolean;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

    // Form state
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState<'meeting' | 'maintenance' | 'holiday' | 'other'>('meeting');
    const [newEventDesc, setNewEventDesc] = useState('');

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const [clients, messengers, vehicles, customEvents] = await Promise.all([
                ClientService.getAllClients(),
                ResourceService.getAvailableMessengers(),
                ResourceService.getAvailableVehicles(),
                CalendarService.getCustomEvents()
            ]);

            const allEvents: CalendarEvent[] = [];

            // 1. Birthdays (Messengers)
            messengers.forEach(m => {
                if (m.dob) {
                    const dob = parseISO(m.dob);
                    // Add for current year and next year to cover transitions
                    const currentYearBirthday = new Date(currentDate.getFullYear(), dob.getMonth(), dob.getDate());
                    allEvents.push({
                        id: `bday-m-${m.id}`,
                        title: `Cumpleaños: ${m.firstName} ${m.lastName}`,
                        date: currentYearBirthday,
                        type: 'birthday',
                        isCustom: false
                    });
                }
                // License Expiry
                if (m.licenseExpiry) {
                    const expiry = parseISO(m.licenseExpiry);
                    allEvents.push({
                        id: `exp-m-${m.id}`,
                        title: `Vence Licencia: ${m.firstName} ${m.lastName}`,
                        date: expiry,
                        type: 'expiry',
                        isCustom: false
                    });
                }
            });

            // 2. Foundation Dates (Clients)
            clients.forEach(c => {
                if (c.type === 'juridica' && c.foundationDate) {
                    const fd = parseISO(c.foundationDate);
                    const currentYearFoundation = new Date(currentDate.getFullYear(), fd.getMonth(), fd.getDate());
                    allEvents.push({
                        id: `found-c-${c.id}`,
                        title: `Aniversario: ${c.fullName}`,
                        date: currentYearFoundation,
                        type: 'foundation',
                        isCustom: false
                    });
                } else if (c.type === 'fisica' && c.dob) {
                    const dob = parseISO(c.dob);
                    const currentYearBirthday = new Date(currentDate.getFullYear(), dob.getMonth(), dob.getDate());
                    allEvents.push({
                        id: `bday-c-${c.id}`,
                        title: `Cumpleaños: ${c.fullName}`,
                        date: currentYearBirthday,
                        type: 'birthday',
                        isCustom: false
                    });
                }
            });

            // 3. Vehicles (Insurance & Maintenance)
            vehicles.forEach(v => {
                // Insurance
                if (v.insuranceExpiry) {
                    const expiry = parseISO(v.insuranceExpiry);
                    allEvents.push({
                        id: `ins-v-${v.id}`,
                        title: `Vence Seguro: ${v.code} (${v.model})`,
                        date: expiry,
                        type: 'expiry',
                        isCustom: false
                    });
                }
                // Maintenance
                if (v.maintenanceSchedule) {
                    v.maintenanceSchedule.forEach(sch => {
                        if (sch.lastMaintenanceDate && sch.frequencyMonths) {
                            const last = parseISO(sch.lastMaintenanceDate);
                            const next = addMonths(last, sch.frequencyMonths);
                            allEvents.push({
                                id: `maint-v-${v.id}-${sch.type}`,
                                title: `Mantenimiento: ${v.code} - ${sch.type}`,
                                date: next,
                                type: 'maintenance',
                                isCustom: false
                            });
                        }
                    });
                }
            });

            // 4. Custom Events
            customEvents.forEach(e => {
                allEvents.push({
                    id: e.id,
                    title: e.title,
                    date: parseISO(e.date),
                    type: e.type,
                    description: e.description,
                    isCustom: true
                });
            });

            setEvents(allEvents);
        } catch (error) {
            console.error("Error loading calendar events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const handleDateClick = (date: Date) => {
        const dayEvents = events.filter(e => isSameDay(e.date, date));
        setSelectedDate(date);
        setSelectedEvents(dayEvents);
        setIsDetailModalOpen(true);
    };

    const handleAddEvent = async () => {
        if (!selectedDate || !newEventTitle.trim()) return;

        try {
            await CalendarService.addCustomEvent({
                title: newEventTitle,
                date: format(selectedDate, 'yyyy-MM-dd'),
                type: newEventType,
                description: newEventDesc,
                createdBy: 'user' // In real app, use auth user
            });
            await loadEvents();
            setIsAddModalOpen(false);
            setNewEventTitle('');
            setNewEventDesc('');
            // Refresh details modal if open
            // We need to re-fetch to see the new one immediately in the list, 
            // but loadEvents is async. For now, just close add modal.
            setIsDetailModalOpen(false);
        } catch (error) {
            console.error("Error adding event:", error);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este evento?')) {
            await CalendarService.deleteCustomEvent(id);
            await loadEvents();
            setIsDetailModalOpen(false);
        }
    };

    // Calendar Grid Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'birthday': return <Cake className="w-3 h-3 text-pink-500" />;
            case 'expiry': return <AlertTriangle className="w-3 h-3 text-red-500" />;
            case 'foundation': return <Building className="w-3 h-3 text-blue-500" />;
            case 'maintenance': return <Truck className="w-3 h-3 text-orange-500" />;
            default: return <Clock className="w-3 h-3 text-gray-500" />;
        }
    };

    const getEventColor = (event: CalendarEvent) => {
        if (!event?.date || !(event.date instanceof Date) || isNaN(event.date.getTime())) {
            return 'bg-gray-100 text-gray-700 border-gray-200';
        }

        const today = new Date();
        const diffTime = event.date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isUpcoming = diffDays >= 0 && diffDays <= 7;

        if (isUpcoming) {
            return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold ring-1 ring-amber-300';
        }

        switch (event.type) {
            case 'birthday': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'expiry': return 'bg-red-100 text-red-700 border-red-200';
            case 'foundation': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'meeting': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'holiday': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Fechas Importantes</h1>
                    <p className="text-muted-foreground">Calendario de eventos, vencimientos y celebraciones</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-card border rounded-lg p-1">
                        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="px-4 font-bold text-lg min-w-[150px] text-center capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                    <Button variant="primary" onClick={() => { setSelectedDate(new Date()); setIsAddModalOpen(true); }}>
                        <Plus className="w-4 h-4" />
                        Agregar Evento
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, idx) => {
                            const dayEvents = events.filter(e => isSameDay(e.date, day));
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                  min-h-[120px] p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md
                                  ${isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'}
                                  ${isTodayDate ? 'ring-2 ring-primary ring-offset-2' : ''}
                              `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-medium ${isTodayDate ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 rounded-full">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event, i) => (
                                            <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${getEventColor(event)}`}>
                                                {getEventIcon(event.type)}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] text-muted-foreground text-center">
                                                + {dayEvents.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : 'Detalles'}
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Eventos del día</h3>
                        <Button size="sm" variant="outline" onClick={() => { setIsDetailModalOpen(false); setIsAddModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-1" /> Nuevo
                        </Button>
                    </div>

                    {selectedEvents.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay eventos para este día.</p>
                    ) : (
                        <div className="space-y-3">
                            {selectedEvents.map(event => (
                                <div key={event.id} className={`p-3 rounded-lg border flex items-start gap-3 ${getEventColor(event)} bg-opacity-10`}>
                                    <div className="mt-1">{getEventIcon(event.type)}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{event.title}</p>
                                        {event.description && <p className="text-xs opacity-80 mt-1">{event.description}</p>}
                                        <p className="text-[10px] uppercase font-bold mt-1 opacity-60">{event.type}</p>
                                    </div>
                                    {event.isCustom && (
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Event Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Agregar Evento Personalizado"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium block mb-1">Fecha</label>
                        <div className="p-2 bg-muted rounded border text-sm">
                            {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : 'Seleccione una fecha'}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Título</label>
                        <input
                            type="text"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            className="w-full p-2 rounded border bg-background"
                            placeholder="Ej: Reunión de equipo"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Tipo</label>
                        <select
                            value={newEventType}
                            onChange={(e) => setNewEventType(e.target.value as any)}
                            className="w-full p-2 rounded border bg-background"
                        >
                            <option value="meeting">Reunión</option>
                            <option value="maintenance">Mantenimiento</option>
                            <option value="holiday">Festivo</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Descripción (Opcional)</label>
                        <textarea
                            value={newEventDesc}
                            onChange={(e) => setNewEventDesc(e.target.value)}
                            className="w-full p-2 rounded border bg-background"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAddEvent}>Guardar Evento</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
