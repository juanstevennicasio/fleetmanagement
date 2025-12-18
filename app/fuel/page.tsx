'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FuelService, FuelTicket, ResourceService, Vehicle, Messenger } from '../services';
import { Calendar, DollarSign, FileText, User, Truck, Clock } from "lucide-react";
import { useAuth } from '../context/AuthContext';

export default function FuelPage() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<FuelTicket[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5));
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedMessenger, setSelectedMessenger] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [orderImage, setOrderImage] = useState('');
    const [invoiceImage, setInvoiceImage] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ticketsData, vehiclesData, messengersData] = await Promise.all([
                FuelService.getAllFuelTickets(),
                ResourceService.getActiveVehicles(),
                ResourceService.getAllMessengers()
            ]);
            setTickets(ticketsData || []);
            setVehicles(vehiclesData || []);
            setMessengers(messengersData || []);
        } catch (error) {
            console.error("Error loading fuel data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceNumber || !amount || !selectedMessenger || !selectedVehicle) {
            alert('Por favor complete todos los campos');
            return;
        }

        setCreating(true);
        try {
            await FuelService.createFuelTicket({
                date,
                time,
                invoiceNumber,
                amount: Number(amount),
                messengerId: selectedMessenger,
                vehicleId: selectedVehicle,
                orderImageUrl: orderImage,
                invoiceImageUrl: invoiceImage
            }, user?.username || 'admin');

            // Reset form
            setInvoiceNumber('');
            setAmount('');
            setSelectedMessenger('');
            setSelectedVehicle('');
            setOrderImage('');
            setInvoiceImage('');

            // Reload tickets
            const newTickets = await FuelService.getAllFuelTickets();
            setTickets(newTickets || []);
        } catch (error) {
            console.error("Error creating fuel ticket:", error);
        } finally {
            setCreating(false);
        }
    };

    const getMessengerName = (id: string) => {
        const m = messengers.find(m => m.id === id);
        return m ? `${m.firstName} ${m.lastName}` : 'Desconocido';
    };

    const getVehicleCode = (id: string) => {
        const v = vehicles.find(v => v.id === id);
        return v ? `${v.code} (${v.model})` : 'Desconocido';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold mb-2">Control de Combustible</h1>
                <p className="text-muted-foreground">Registro y control de tickets de combustible</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl">Nuevo Registro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecha</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            className="w-full pl-9 p-2 rounded-lg border bg-background"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hora</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="time"
                                            className="w-full pl-9 p-2 rounded-lg border bg-background"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Número de Factura</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Ej: 000123"
                                        className="w-full pl-9 p-2 rounded-lg border bg-background"
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Monto (RD$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full pl-9 p-2 rounded-lg border bg-background"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mensajero</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="w-full pl-9 p-2 rounded-lg border bg-background appearance-none"
                                        value={selectedMessenger}
                                        onChange={e => setSelectedMessenger(e.target.value)}
                                    >
                                        <option value="">Seleccionar mensajero...</option>
                                        {messengers.map(m => (
                                            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Vehículo</label>
                                <div className="relative">
                                    <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="w-full pl-9 p-2 rounded-lg border bg-background appearance-none"
                                        value={selectedVehicle}
                                        onChange={e => setSelectedVehicle(e.target.value)}
                                    >
                                        <option value="">Seleccionar vehículo...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.code} - {v.model}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Order Image */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Imagen de Orden</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setOrderImage(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="w-full p-2 rounded-lg border bg-background text-sm"
                                />
                                {orderImage && <img src={orderImage} alt="Order" className="w-full h-20 rounded object-cover" />}
                            </div>

                            {/* Invoice Image */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Imagen de Factura</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setInvoiceImage(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="w-full p-2 rounded-lg border bg-background text-sm"
                                />
                                {invoiceImage && <img src={invoiceImage} alt="Invoice" className="w-full h-20 rounded object-cover" />}
                            </div>

                            <Button type="submit" className="w-full" isLoading={creating}>
                                Registrar Ticket
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">Historial de Tickets</h2>
                    {loading ? (
                        <div className="text-center py-8">Cargando historial...</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                            No hay tickets registrados
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.slice().reverse().map(ticket => (
                                <Card key={ticket.id} className="hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg">RD$ {ticket.amount.toLocaleString()}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                        #{ticket.invoiceNumber}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {getMessengerName(ticket.messengerId)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Truck className="w-3 h-3" /> {getVehicleCode(ticket.vehicleId)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <div className="flex items-center justify-end gap-1">
                                                <Calendar className="w-3 h-3" /> {ticket.date}
                                            </div>
                                            <div className="flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" /> {ticket.time}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
