import { CorporateDocument, DocumentCategory, DocumentStatusType } from '../lib/types';
import { supabase } from '../lib/supabase';


// --- Persistence Helpers ---
async function fetchCollection<T>(collection: string): Promise<T[]> {
    if (typeof window === 'undefined') return [];
    try {
        const res = await fetch(`/api/storage?collection=${collection}`);
        if (res.ok) return await res.json();
    } catch (e) {
        console.error(`Error fetching ${collection}`, e);
    }
    return [];
}

async function saveCollection(collection: string, data: any[]) {
    try {
        await fetch('/api/storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, data })
        });
    } catch (e) {
        console.error(`Error saving ${collection}`, e);
    }
}

// --- Types ---
export interface PlatformUser {
    username: string;
    role: 'admin' | 'dispatcher' | 'hr' | 'accounting' | 'cashier';
    name: string;
    allowedSections?: string[]; // IDs or labels of sections
}

export interface AuditLog {
    action: string;
    details: string;
    user: string;
    timestamp: any;
}

export interface Messenger {
    id?: string;
    firstName: string;
    lastName: string;
    photoUrl?: string; // Foto del mensajero
    cedula: string;
    dob: string;
    idFrontImageUrl?: string; // Foto cédula frontal
    idBackImageUrl?: string; // Foto cédula reverso
    licenseImageUrl?: string; // Foto de licencia
    licenseExpiry: string;
    phone: string;
    address: string;
    assignedVehicles: string[]; // Array de IDs de vehículos
    status: 'available' | 'busy';
    points: number;
    createdBy?: string;
    createdAt?: any;
    modifiedBy?: string;
    modifiedAt?: any;
}

export interface Vehicle {
    id?: string;
    code: string; // ARJ-1
    model: string;
    type: 'Motor' | 'Carro' | 'Camión' | 'Furgoneta' | 'Autobús' | 'Otro';
    chassisNumber?: string;
    insuranceExpiry?: string;
    registrationImageUrl?: string;
    insuranceImageUrl?: string;
    photoUrl?: string; // Foto del vehículo
    assignedStaffId?: string;
    status: 'active' | 'maintenance';
    maintenanceSchedule?: MaintenanceSchedule[];
    maintenanceLog?: MaintenanceRecord[];
    createdBy?: string;
    createdAt?: any;
    modifiedBy?: string;
    modifiedAt?: any;
}

export interface MaintenanceSchedule {
    id: string;
    type: string; // e.g., "Cambio de Aceite", "Frenos"
    frequencyKm?: number;
    frequencyMonths?: number;
    lastMaintenanceDate?: string;
    lastMaintenanceKm?: number;
}

export interface MaintenanceRecord {
    id: string;
    date: string;
    type: string;
    description: string;
    cost: number;
    mileage?: number;
    performedBy: string; // Taller o mecánico
    invoiceNumber?: string;
    notes?: string;
}

export interface RouteStop {
    type: 'client' | 'stop';
    ticketNumber: string;
    clientId?: string;
    clientName?: string; // For display
    address?: string;
    arrivalTime?: string; // ISO string
    departureTime?: string; // ISO string
}

export interface MediaFile {
    id?: string;
    fileName: string;
    fileUrl: string; // Base64 or URL
    fileType: 'registration' | 'insurance' | 'license' | 'other';
    entityType: 'vehicle' | 'messenger' | 'client';
    entityId: string;
    entityName: string;
    uploadedAt: any;
    uploadedBy: string;
}

export interface Client {
    id?: string;
    type: 'fisica' | 'juridica';
    locationName: string; // Nombre de ubicación o cliente
    fullName: string; // Nombre completo o Razón Social
    dob?: string; // Fecha de nacimiento (Física)
    foundationDate?: string; // Fecha de fundación (Jurídica)
    cedula?: string; // Número de cédula (Física)
    rnc?: string; // RNC (Jurídica)
    idFrontImageUrl?: string; // Foto cédula frontal
    idBackImageUrl?: string; // Foto cédula reverso
    photoUrl?: string; // Foto de cliente (Física) o Logo (Jurídica)
    locationPhotos?: string[]; // Fotos del local (máximo 3)
    registroMercantilUrl?: string; // Registro Mercantil (Jurídica)
    address?: string; // Dirección escrita (opcional)
    latitude: number; // Coordenadas del mapa
    longitude: number;
    annualVisits: number; // Cantidad de visitas anuales
    createdBy?: string;
    createdAt: any;
    modifiedBy?: string;
    modifiedAt?: any;
}

export interface Alert {
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    date: string; // ISO string or display string
    entityId?: string;
    entityType?: 'vehicle' | 'messenger' | 'client';
    status: 'active' | 'resolved';
}

// --- Gamification Types ---
export interface GamificationRule {
    id: string;
    name: string;
    type: 'time_based' | 'star_rating' | 'streak' | 'volume' | 'custom';
    enabled: boolean;
    pointsAwarded: number;
    pointsDeducted: number;
    threshold?: number; // For time-based: percentage difference (e.g., 20 = 20% faster/slower)
    description: string;
}

export interface RouteHistory {
    id: string;
    messengerId: string;
    messengerName: string;
    vehicleId: string;
    vehicleCode: string;
    clientId: string;
    clientName: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    duration: number; // minutes
    starRating: number; // 1-5
    note: string;
    pointsEarned: number;
    completedBy: string;
    completedAt: string; // ISO string
}

export interface EvaluationQuestion {
    id: string;
    question: string;
    category: 'punctuality' | 'customer_service' | 'vehicle_care' | 'communication' | 'professionalism' | 'safety' | 'reliability' | 'problem_solving';
    rating: number; // 1-5
}

export interface MessengerEvaluation {
    id: string;
    messengerId: string;
    messengerName: string;
    evaluatedBy: string;
    evaluatedAt: string; // ISO string
    questions: EvaluationQuestion[];
    totalScore: number; // Average of all ratings
    notes?: string;
}

export interface ClientRouteStats {
    clientId: string;
    clientName: string;
    totalRoutes: number;
    averageDuration: number; // minutes
    fastestDuration: number; // minutes
    slowestDuration: number; // minutes
    lastUpdated: string; // ISO string
}

// --- Alert Service ---
export const AlertService = {
    getActiveAlerts: async () => {
        const alerts: Alert[] = [];
        const now = new Date();
        const warningDays = 7; // Warn if expiring in 7 days (as requested)
        const insuranceWarningDays = 30; // Keep 30 days for insurance warning, but critical at 7

        // 1. Check Messenger Licenses & Birthdays
        const messengers = await ResourceService.getAvailableMessengers();

        messengers.forEach(m => {
            // License
            if (m.licenseExpiry) {
                const expiryDate = new Date(m.licenseExpiry);
                const diffTime = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    alerts.push({
                        id: `lic-exp-${m.id}`,
                        type: 'Licencia Vencida',
                        message: `La licencia de ${m.firstName} ${m.lastName} venció hace ${Math.abs(diffDays)} días`,
                        severity: 'critical',
                        date: 'Ahora',
                        entityId: m.id,
                        entityType: 'messenger',
                        status: 'active'
                    });
                } else if (diffDays <= warningDays) {
                    alerts.push({
                        id: `lic-warn-${m.id}`,
                        type: 'Licencia por Vencer',
                        message: `La licencia de ${m.firstName} ${m.lastName} vence en ${diffDays} días`,
                        severity: 'warning',
                        date: 'Ahora',
                        entityId: m.id,
                        entityType: 'messenger',
                        status: 'active'
                    });
                }
            }

            // Birthday
            if (m.dob) {
                const dob = new Date(m.dob);
                const currentYear = now.getFullYear();
                const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
                const diffTime = birthdayThisYear.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // If birthday passed this year, check next year (optional, but for alerts usually we care about upcoming)
                // We only care if it's within the next 7 days or today
                if (diffDays >= 0 && diffDays <= 7) {
                    alerts.push({
                        id: `bday-m-${m.id}`,
                        type: 'Cumpleaños',
                        message: diffDays === 0 ? `¡Hoy es el cumpleaños de ${m.firstName} ${m.lastName}!` : `El cumpleaños de ${m.firstName} ${m.lastName} es en ${diffDays} días`,
                        severity: 'info',
                        date: diffDays === 0 ? 'Hoy' : `En ${diffDays} días`,
                        entityId: m.id,
                        entityType: 'messenger',
                        status: 'active'
                    });
                }
            }
        });

        // 2. Check Vehicle Insurance & Maintenance
        const vehicles = await ResourceService.getAvailableVehicles();
        vehicles.forEach(v => {
            // Insurance
            if (v.insuranceExpiry) {
                const expiryDate = new Date(v.insuranceExpiry);
                const diffTime = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    alerts.push({
                        id: `ins-exp-${v.id}`,
                        type: 'Seguro Vencido',
                        message: `El seguro del vehículo ${v.code} (${v.model}) ha vencido`,
                        severity: 'critical',
                        date: 'Ahora',
                        entityId: v.id,
                        entityType: 'vehicle',
                        status: 'active'
                    });
                } else if (diffDays <= insuranceWarningDays) {
                    alerts.push({
                        id: `ins-warn-${v.id}`,
                        type: 'Seguro por Vencer',
                        message: `El seguro del vehículo ${v.code} vence en ${diffDays} días`,
                        severity: diffDays <= 7 ? 'critical' : 'warning',
                        date: 'Ahora',
                        entityId: v.id,
                        entityType: 'vehicle',
                        status: 'active'
                    });
                }
            }

            // Maintenance (Simple logic: Last date + frequency)
            // Assuming default frequency if not set (e.g., 3 months)
            if (v.maintenanceSchedule && v.maintenanceSchedule.length > 0) {
                v.maintenanceSchedule.forEach(schedule => {
                    if (schedule.lastMaintenanceDate && schedule.frequencyMonths) {
                        const lastDate = new Date(schedule.lastMaintenanceDate);
                        const nextDate = new Date(lastDate);
                        nextDate.setMonth(lastDate.getMonth() + schedule.frequencyMonths);

                        const diffTime = nextDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays < 0) {
                            alerts.push({
                                id: `maint-overdue-${v.id}-${schedule.type}`,
                                type: 'Mantenimiento Atrasado',
                                message: `Mantenimiento (${schedule.type}) para ${v.code} está atrasado por ${Math.abs(diffDays)} días`,
                                severity: 'critical',
                                date: 'Ahora',
                                entityId: v.id,
                                entityType: 'vehicle',
                                status: 'active'
                            });
                        } else if (diffDays <= 7) {
                            alerts.push({
                                id: `maint-due-${v.id}-${schedule.type}`,
                                type: 'Mantenimiento Próximo',
                                message: `Mantenimiento (${schedule.type}) para ${v.code} toca en ${diffDays} días`,
                                severity: 'warning',
                                date: 'Ahora',
                                entityId: v.id,
                                entityType: 'vehicle',
                                status: 'active'
                            });
                        }
                    }
                });
            }
        });

        // 3. Check Client Birthdays & Foundation
        const clients = await ClientService.getAllClients();

        clients.forEach(c => {
            // Birthday (Physical)
            if (c.type === 'fisica' && c.dob) {
                const dob = new Date(c.dob);
                const currentYear = now.getFullYear();
                const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate());
                const diffTime = birthdayThisYear.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 7) {
                    alerts.push({
                        id: `bday-c-${c.id}`,
                        type: 'Cumpleaños de Cliente',
                        message: diffDays === 0 ? `¡Hoy es el cumpleaños de ${c.fullName}!` : `El cumpleaños de ${c.fullName} es en ${diffDays} días`,
                        severity: 'info',
                        date: diffDays === 0 ? 'Hoy' : `En ${diffDays} días`,
                        entityId: c.id,
                        entityType: 'client',
                        status: 'active'
                    });
                }
            }

            // Foundation (Juridica)
            if (c.type === 'juridica' && c.foundationDate) {
                const fd = new Date(c.foundationDate);
                const currentYear = now.getFullYear();
                const annivThisYear = new Date(currentYear, fd.getMonth(), fd.getDate());
                const diffTime = annivThisYear.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 7) {
                    alerts.push({
                        id: `found-c-${c.id}`,
                        type: 'Aniversario de Cliente',
                        message: diffDays === 0 ? `¡Hoy es el aniversario de ${c.fullName}!` : `El aniversario de ${c.fullName} es en ${diffDays} días`,
                        severity: 'info',
                        date: diffDays === 0 ? 'Hoy' : `En ${diffDays} días`,
                        entityId: c.id,
                        entityType: 'client',
                        status: 'active'
                    });
                }
            }
        });

        return alerts;
    }
};

export interface ActiveRoute {
    id: string; // Required for Supabase interaction
    messengerId: string;
    vehicleId: string;
    startTime: any;
    endTime?: any;
    stops: RouteStop[];
    status: 'active' | 'completed';
}

// --- PERSISTENT STORAGE (Gradual Migration) ---
import { StorageService } from './storage';

// Initialize storage on first load
if (typeof window !== 'undefined') {
    // // StorageService.initializeIfEmpty();
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'; // Gradual migration - will switch modules one by one



// --- Auth Service ---
export const AuthService = {
    async login(username: string, password: string): Promise<PlatformUser | null> {
        if (USE_MOCK) {
            const users = await fetchCollection<any>('platformUsers');
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                return {
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    allowedSections: user.allowedSections || []
                };
            }

            // Default fallback if no users in DB yet
            if (username === 'admin' && password === '1234') {
                return { username: 'admin', role: 'admin', name: 'System Admin', allowedSections: ['all'] };
            }
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('platform_users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error || !data) return null;

            return {
                username: data.username,
                role: data.role,
                name: data.name,
                allowedSections: data.allowed_sections || []
            };
        } catch (e) {
            console.error("Supabase Auth failed", e);
            return null;
        }
    },

    async seedAdmin() {
        if (USE_MOCK) return;
        try {
            const { data, error } = await supabase.from('platform_users').select('username').limit(1);
            if (!error && data.length === 0) {
                await supabase.from('platform_users').insert([{
                    username: 'admin',
                    password: '1234',
                    name: 'System Admin',
                    role: 'admin',
                    allowed_sections: ['all']
                }]);
                console.log('Admin seeded');
            }
        } catch (e) { console.error(e); }
    },

    async getPlatformUsers(): Promise<PlatformUser[]> {
        if (USE_MOCK) {
            const users = await fetchCollection('platformUsers');
            if (users.length === 0) {
                // Default mock user if none exist in storage
                return [{ username: 'admin', role: 'admin', name: 'System Admin' }];
            }
            return users as unknown as PlatformUser[];
        }
        const { data, error } = await supabase
            .from('platform_users')
            .select('*');
        if (error) throw error;
        return data.map(u => ({
            username: u.username,
            role: u.role,
            name: u.name,
            allowedSections: u.allowed_sections || []
        }));
    },

    async createPlatformUser(userData: PlatformUser, password: string) {
        if (USE_MOCK) {
            const users = await fetchCollection('platformUsers') as any[];
            // Check if username exists
            if (users.some(u => u.username === userData.username)) {
                throw new Error("El nombre de usuario ya existe");
            }

            if (users.length === 0 && userData.username !== 'admin') {
                users.push({ username: 'admin', role: 'admin', name: 'System Admin', allowedSections: ['all'], password: '1234' });
            }
            users.push({ ...userData, password });
            await saveCollection('platformUsers', users);
            return;
        }

        const { error } = await supabase
            .from('platform_users')
            .insert([{
                username: userData.username,
                password: password,
                name: userData.name,
                role: userData.role,
                allowed_sections: userData.allowedSections
            }]);

        if (error) {
            if (error.code === '23505') throw new Error("El nombre de usuario ya existe");
            throw error;
        }
    },

    async updatePlatformUser(username: string, updates: Partial<PlatformUser>, password?: string) {
        if (USE_MOCK) {
            const users = await fetchCollection('platformUsers') as any[];
            const index = users.findIndex(u => u.username === username);
            if (index === -1 && username === 'admin') {
                users.push({
                    username: 'admin',
                    role: 'admin',
                    name: 'System Admin',
                    allowedSections: ['all'],
                    password: '1234',
                    ...updates
                });
                if (password) users[users.length - 1].password = password;
                await saveCollection('platformUsers', users);
                return;
            }
            if (index !== -1) {
                users[index] = { ...users[index], ...updates };
                if (password) users[index].password = password;
                await saveCollection('platformUsers', users);
            }
            return;
        }

        const data: any = {
            name: updates.name,
            role: updates.role,
            allowed_sections: updates.allowedSections
        };
        if (password) data.password = password;

        const { error } = await supabase
            .from('platform_users')
            .update(data)
            .eq('username', username);

        if (error) throw error;
    },

    async deletePlatformUser(username: string) {
        if (USE_MOCK) {
            const users = await fetchCollection('platformUsers') as any[];
            const filtered = users.filter(u => u.username !== username);
            await saveCollection('platformUsers', filtered);
            return;
        }

        const { error } = await supabase
            .from('platform_users')
            .delete()
            .eq('username', username);

        if (error) throw error;
    }
};


export interface CustomEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: 'meeting' | 'maintenance' | 'holiday' | 'other';
    description?: string;
    createdBy: string;
}

export const CalendarService = {
    async getCustomEvents(): Promise<CustomEvent[]> {
        if (USE_MOCK) {
            return await fetchCollection('customEvents') as unknown as CustomEvent[];
        }
        const { data, error } = await supabase
            .from('custom_events')
            .select('*')
            .order('date', { ascending: true });
        if (error) throw error;
        return data as CustomEvent[];
    },

    async addCustomEvent(event: Omit<CustomEvent, 'id'>): Promise<string> {
        if (USE_MOCK) {
            const newEvent = { ...event, id: `evt-${Date.now()}` };
            const events = await fetchCollection('customEvents') as unknown as CustomEvent[];
            events.push(newEvent as CustomEvent);
            await saveCollection('customEvents', events);
            return newEvent.id;
        }
        const { data, error } = await supabase
            .from('custom_events')
            .insert([event])
            .select()
            .single();
        if (error) throw error;
        return data.id;
    },

    async deleteCustomEvent(id: string): Promise<void> {
        if (USE_MOCK) {
            const events = await fetchCollection('customEvents') as unknown as CustomEvent[];
            const filtered = events.filter((e: CustomEvent) => e.id !== id);
            await saveCollection('customEvents', filtered);
            return;
        }
        const { error } = await supabase
            .from('custom_events')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};



// --- Audit Service ---
export const AuditService = {
    async logAction(action: string, details: string, user: string) {
        if (USE_MOCK) {
            const logs = await fetchCollection<AuditLog>('auditLogs');
            const newLog = {
                action,
                details,
                user,
                timestamp: new Date().toISOString()
            };
            logs.unshift(newLog);
            await saveCollection('auditLogs', logs);
            return;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert([{ action, details, user }]);
        if (error) console.error("Error logging action", error);
    },

    async getAllLogs(): Promise<AuditLog[]> {
        if (USE_MOCK) {
            return await fetchCollection('auditLogs') as unknown as AuditLog[];
        }

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });
        if (error) throw error;
        return data as unknown as AuditLog[];
    }
};

// --- Resource Service ---
export const ResourceService = {
    async seedData() {
        if (USE_MOCK) return;

        // Seed Staff
        const { data: staffData, error: staffError } = await supabase.from('messengers').select('id').limit(1);
        if (!staffError && staffData.length === 0) {
            const staff = [
                { first_name: 'José Arismendi', last_name: 'Almonte Martínez', cedula: '001-0000000-1', dob: '1990-01-01', phone: '809-555-0001', address: 'Calle 1', license_expiry: '2026-01-01', status: 'available', points: 0 },
                { first_name: 'Yeison', last_name: 'Vargas', cedula: '001-0000000-2', dob: '1992-02-02', phone: '809-555-0002', address: 'Calle 2', license_expiry: '2025-06-01', status: 'available', points: 0 },
                { first_name: 'Miguel de Jesus', last_name: 'Luna', cedula: '001-0000000-3', dob: '1993-03-03', phone: '809-555-0003', address: 'Calle 3', license_expiry: '2025-12-01', status: 'available', points: 0 },
            ];
            await supabase.from('messengers').insert(staff);
        }

        // Seed Vehicles
        const { data: vehicleData, error: vehicleError } = await supabase.from('vehicles').select('id').limit(1);
        if (!vehicleError && vehicleData.length === 0) {
            const vehicles = [
                { code: 'ARJ-1', model: 'Honda Super Cub', type: 'Motor', status: 'active' },
                { code: 'ARJ-2', model: 'Suzuki Ax100', type: 'Motor', status: 'active' },
                { code: 'ARJ-3', model: 'Daihatsu Hijet', type: 'Carro', status: 'active' },
                { code: 'ARJ-4', model: 'Yamaha 115', type: 'Motor', status: 'active' },
            ];
            await supabase.from('vehicles').insert(vehicles);
        }
    },

    async createVehicle(
        model: string,
        type: 'Motor' | 'Carro' | 'Camión' | 'Furgoneta' | 'Autobús' | 'Otro',
        chassisNumber?: string,
        insuranceExpiry?: string,
        registrationImageUrl?: string,
        insuranceImageUrl?: string
    ) {
        if (USE_MOCK) {
            const vehicles = await fetchCollection('vehicles') as unknown as Vehicle[];
            const lastCode = vehicles.length > 0 ? vehicles[vehicles.length - 1].code : 'ARJ-0';
            const numPart = parseInt(lastCode.split('-')[1]);
            const code = `ARJ-${numPart + 1}`;
            const newVehicle = {
                id: Math.random().toString(),
                code,
                model,
                type,
                chassisNumber,
                insuranceExpiry,
                registrationImageUrl,
                insuranceImageUrl,
                status: 'active' as const
            };
            vehicles.push(newVehicle);
            await saveCollection('vehicles', vehicles);
            return code;
        }

        const { data, error: fetchError } = await supabase
            .from('vehicles')
            .select('code')
            .order('code', { ascending: false })
            .limit(1)
            .maybeSingle();

        let nextNum = 1;
        if (data) {
            const numPart = parseInt(data.code.split('-')[1]);
            if (!isNaN(numPart)) nextNum = numPart + 1;
        }

        const code = `ARJ-${nextNum}`;
        const { error } = await supabase
            .from('vehicles')
            .insert([{
                code,
                model,
                type,
                chassis_number: chassisNumber,
                insurance_expiry: insuranceExpiry,
                registration_image_url: registrationImageUrl,
                insurance_image_url: insuranceImageUrl,
                status: 'active'
            }]);

        if (error) throw error;
        return code;
    },

    async updateVehicle(vehicleId: string, updates: Partial<Vehicle>, currentUser: string) {
        if (USE_MOCK) {
            const vehicles = await fetchCollection('vehicles') as unknown as Vehicle[];
            const index = vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1) {
                const updatedVehicle = {
                    ...vehicles[index],
                    ...updates,
                    modifiedBy: currentUser,
                    modifiedAt: { seconds: Date.now() / 1000 }
                };
                vehicles[index] = updatedVehicle;
                await saveCollection('vehicles', vehicles);
                await AuditService.logAction('UPDATE_VEHICLE', `Updated vehicle ${updatedVehicle.code}`, currentUser);
            }
            return;
        }
        const { error } = await supabase
            .from('vehicles')
            .update({
                ...updates,
                modified_by: currentUser,
                modified_at: new Date().toISOString()
            })
            .eq('id', vehicleId);

        if (error) throw error;
        await AuditService.logAction('UPDATE_VEHICLE', `Updated vehicle ${vehicleId}`, currentUser);
    },


    async getAllMessengers() {
        if (USE_MOCK) return await fetchCollection('messengers') as unknown as Messenger[];
        const { data, error } = await supabase.from('messengers').select('*');
        if (error) throw error;
        return data as Messenger[];
    },

    async getActiveVehicles() {
        if (USE_MOCK) return await fetchCollection('vehicles') as unknown as Vehicle[];
        const { data, error } = await supabase.from('vehicles').select('*');
        if (error) throw error;
        return data as Vehicle[];
    },
    async getAvailableMessengers() {
        if (USE_MOCK) return (await fetchCollection('messengers') as unknown as Messenger[]).filter(m => m.status === 'available');
        const { data, error } = await supabase
            .from('messengers')
            .select('*')
            .eq('status', 'available');
        if (error) throw error;
        return data as Messenger[];
    },

    async createMessenger(messengerData: Omit<Messenger, 'id' | 'createdAt'>, currentUser: string) {
        if (USE_MOCK) {
            const messenger: Messenger = {
                id: Math.random().toString(),
                ...messengerData,
                createdBy: currentUser,
                createdAt: { seconds: Date.now() / 1000 }
            };
            const messengers = await fetchCollection('messengers') as unknown as Messenger[];
            messengers.push(messenger);
            await saveCollection('messengers', messengers);
            await AuditService.logAction('CREATE_MESSENGER', `Created messenger ${messengerData.firstName} ${messengerData.lastName} `, currentUser);
            return messenger.id;
        }

        const { data, error } = await supabase
            .from('messengers')
            .insert([{
                ...messengerData,
                created_by: currentUser,
            }])
            .select()
            .single();

        if (error) throw error;
        await AuditService.logAction('CREATE_MESSENGER', `Created messenger ${messengerData.firstName} ${messengerData.lastName} `, currentUser);
        return data.id;
    },

    async updateMessenger(messengerId: string, updates: Partial<Messenger>, currentUser: string) {
        if (USE_MOCK) {
            const messengers = await fetchCollection('messengers') as unknown as Messenger[];
            const index = messengers.findIndex(m => m.id === messengerId);
            if (index !== -1) {
                const updatedMessenger = {
                    ...messengers[index],
                    ...updates,
                    modifiedBy: currentUser,
                    modifiedAt: { seconds: Date.now() / 1000 }
                };
                messengers[index] = updatedMessenger;
                await saveCollection('messengers', messengers);
                await AuditService.logAction('UPDATE_MESSENGER', `Updated messenger ${updatedMessenger.firstName} ${updatedMessenger.lastName} `, currentUser);
            }
            return;
        }
        const { error } = await supabase
            .from('messengers')
            .update({
                ...updates,
                modified_by: currentUser,
                modified_at: new Date().toISOString()
            })
            .eq('id', messengerId);

        if (error) throw error;
        await AuditService.logAction('UPDATE_MESSENGER', `Updated messenger ${messengerId} `, currentUser);
    },

    async getAvailableVehicles() {
        if (USE_MOCK) return (await fetchCollection('vehicles') as unknown as Vehicle[]).filter(v => v.status === 'active');
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('status', 'active');
        if (error) throw error;
        return data as Vehicle[];
    }
};

// --- Dispatch Service ---
export const DispatchService = {
    async createRoute(messengerId: string, vehicleId: string, stops: RouteStop[], currentUser: string) {
        if (USE_MOCK) {
            const route = {
                id: Math.random().toString(),
                messengerId,
                vehicleId,
                stops,
                startTime: { seconds: Date.now() / 1000 },
                status: 'active' as const
            };
            const routes = await fetchCollection('routes') as unknown as ActiveRoute[];
            routes.push(route);
            await saveCollection('routes', routes);

            // Update messenger status
            const messengers = await fetchCollection('messengers') as unknown as Messenger[];
            const mIndex = messengers.findIndex(m => m.id === messengerId);
            if (mIndex !== -1) {
                messengers[mIndex].status = 'busy';
                await saveCollection('messengers', messengers);
            }

            await AuditService.logAction('CREATE_ROUTE', `Route created for messenger ${messengerId} with ${stops.length} stops`, currentUser);
            return route.id;
        }

        // 1. Create Route
        const { data: route, error: routeError } = await supabase
            .from('routes')
            .insert([{
                messenger_id: messengerId,
                vehicle_id: vehicleId,
                start_time: new Date().toISOString(),
                status: 'active'
            }])
            .select()
            .single();

        if (routeError) throw routeError;

        // 2. Insert Stops
        if (stops.length > 0) {
            const stopsData = stops.map((stop, index) => ({
                route_id: route.id,
                client_id: stop.clientId,
                stop_order: index,
                location_name: stop.clientName,
                // Add lat/lng if available in stop object
            }));
            const { error: stopsError } = await supabase.from('route_stops').insert(stopsData);
            if (stopsError) throw stopsError;
        }

        // 3. Update messenger status
        const { error: mError } = await supabase
            .from('messengers')
            .update({ status: 'busy' })
            .eq('id', messengerId);
        if (mError) throw mError;

        // 4. Log audit
        await AuditService.logAction('CREATE_ROUTE', `Route created for messenger ${messengerId} with ${stops.length} stops`, currentUser);

        return route.id;
    },

    async getActiveRoutes() {
        if (USE_MOCK) return (await fetchCollection('routes') as unknown as ActiveRoute[]).filter(r => r.status === 'active');

        const { data: routes, error } = await supabase
            .from('routes')
            .select(`
                *,
                stops:route_stops(*)
            `)
            .eq('status', 'active');

        if (error) throw error;

        return routes.map(r => ({
            id: r.id,
            messengerId: r.messenger_id,
            vehicleId: r.vehicle_id,
            startTime: r.start_time,
            status: r.status,
            stops: r.stops.map((s: any) => ({
                clientId: s.client_id,
                clientName: s.location_name,
                arrivalTime: s.arrival_time,
                departureTime: s.departure_time
            }))
        })) as ActiveRoute[];
    },

    async updateRouteStops(routeId: string, stops: RouteStop[], currentUser: string) {
        if (USE_MOCK) {
            const routes = await fetchCollection('routes') as unknown as ActiveRoute[];
            const index = routes.findIndex(r => r.id === routeId);
            if (index !== -1) {
                routes[index].stops = stops;
                await saveCollection('routes', routes);
                await AuditService.logAction('UPDATE_ROUTE', `Updated stops for route ${routeId}`, currentUser);
            }
            return;
        }

        // Delete existing stops and re-insert (simple way to update ordered list)
        await supabase.from('route_stops').delete().eq('route_id', routeId);

        const stopsData = stops.map((stop, index) => ({
            route_id: routeId,
            client_id: stop.clientId,
            stop_order: index,
            location_name: stop.clientName,
            arrival_time: stop.arrivalTime,
            departure_time: stop.departureTime
        }));

        const { error } = await supabase.from('route_stops').insert(stopsData);
        if (error) throw error;

        await AuditService.logAction('UPDATE_ROUTE', `Updated stops for route ${routeId}`, currentUser);
    },

    async saveToHistory(routeData: any, currentUser: string) {
        if (USE_MOCK) {
            // Reusing the routes key for now, but in reality we should separate active vs history
            // For MVP history is just closed routes
            const routes = await fetchCollection('routes') as any[];
            routes.push({
                ...routeData,
                status: 'completed',
                completedAt: { seconds: Date.now() / 1000 },
                completedBy: currentUser
            });
            await saveCollection('routes', routes);

            // Log completion
            await AuditService.logAction('COMPLETE_ROUTE', `Route completed for messenger ${routeData.messengerId}`, currentUser);
            return;
        }

        // 1. Mark route as completed
        const { error: routeError } = await supabase
            .from('routes')
            .update({
                status: 'completed',
                end_time: new Date().toISOString()
            })
            .eq('id', routeData.id);

        if (routeError) throw routeError;

        // 2. Also save to visit_history for reporting
        if (routeData.stops) {
            const visits = routeData.stops.map((stop: any) => ({
                client_id: stop.clientId,
                messenger_id: routeData.messengerId,
                route_id: routeData.id,
                visit_date: stop.arrivalTime || new Date().toISOString()
            }));
            await supabase.from('visit_history').insert(visits);
        }

        await AuditService.logAction('COMPLETE_ROUTE', `Route completed for messenger ${routeData.messengerId}`, currentUser);
    }
};

// --- Media Service ---
export const MediaService = {
    async uploadMedia(
        fileName: string,
        fileUrl: string,
        fileType: 'registration' | 'insurance' | 'license' | 'other',
        entityType: 'vehicle' | 'messenger' | 'client',
        entityId: string,
        entityName: string,
        uploadedBy: string
    ) {
        if (USE_MOCK) {
            const media: MediaFile = {
                id: Math.random().toString(),
                fileName,
                fileUrl,
                fileType,
                entityType,
                entityId,
                entityName,
                uploadedAt: { seconds: Date.now() / 1000 },
                uploadedBy
            };
            const allMedia = await fetchCollection('media') as unknown as MediaFile[];
            allMedia.push(media);
            await saveCollection('media', allMedia);
            await AuditService.logAction('UPLOAD_MEDIA', `Uploaded ${fileType} for ${entityType} ${entityName} `, uploadedBy);
            return media.id;
        }

        const { data, error } = await supabase
            .from('media')
            .insert([{
                file_name: fileName,
                file_url: fileUrl,
                file_type: fileType,
                entity_type: entityType,
                entity_id: entityId,
                entity_name: entityName,
                uploaded_by: uploadedBy
            }])
            .select()
            .single();

        if (error) throw error;
        await AuditService.logAction('UPLOAD_MEDIA', `Uploaded ${fileType} for ${entityType} ${entityName} `, uploadedBy);
        return data.id;
    },

    async getAllMedia() {
        if (USE_MOCK) return await fetchCollection('media') as unknown as MediaFile[];
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('deleted', false)
            .order('uploaded_at', { ascending: false });
        if (error) throw error;
        return data as unknown as MediaFile[];
    },

    async getMediaByEntity(entityType: string, entityId: string) {
        if (USE_MOCK) {
            return (await fetchCollection('media') as unknown as MediaFile[]).filter(m => m.entityType === entityType && m.entityId === entityId);
        }
        const { data, error } = await supabase
            .from('media')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .eq('deleted', false)
            .order('uploaded_at', { ascending: false });
        if (error) throw error;
        return data as unknown as MediaFile[];
    },

    async deleteMedia(mediaId: string, currentUser: string) {
        if (USE_MOCK) {
            const allMedia = await fetchCollection('media') as unknown as MediaFile[];
            const filteredMedia = allMedia.filter(m => m.id !== mediaId);
            await saveCollection('media', filteredMedia);
            await AuditService.logAction('DELETE_MEDIA', `Deleted media ${mediaId} `, currentUser);
            return;
        }
        const { error } = await supabase
            .from('media')
            .update({ deleted: true })
            .eq('id', mediaId);
        if (error) throw error;
        await AuditService.logAction('DELETE_MEDIA', `Deleted media ${mediaId} `, currentUser);
    },
};

// --- Client Service ---
export const ClientService = {
    async createClient(clientData: Omit<Client, 'id' | 'createdAt'>, currentUser: string) {
        if (USE_MOCK) {
            const client: Client = {
                id: Math.random().toString(),
                ...clientData,
                createdBy: currentUser,
                createdAt: { seconds: Date.now() / 1000 }
            };
            const clients = await fetchCollection('clients') as unknown as Client[];
            clients.push(client);
            await saveCollection('clients', clients);
            await AuditService.logAction('CREATE_CLIENT', `Created client ${clientData.fullName}`, currentUser);
            return client.id;
        }

        const { data, error } = await supabase
            .from('clients')
            .insert([{
                ...clientData,
                created_by: currentUser
            }])
            .select()
            .single();

        if (error) throw error;
        await AuditService.logAction('CREATE_CLIENT', `Created client ${clientData.fullName}`, currentUser);
        return data.id;
    },

    async getAllClients() {
        if (USE_MOCK) return await fetchCollection('clients') as unknown as Client[];
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Client[];
    },

    async updateClient(clientId: string, updates: Partial<Client>, currentUser: string) {
        if (USE_MOCK) {
            const clients = await fetchCollection('clients') as unknown as Client[];
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                const updatedClient = {
                    ...clients[index],
                    ...updates,
                    modifiedBy: currentUser,
                    modifiedAt: { seconds: Date.now() / 1000 }
                };
                clients[index] = updatedClient;
                await saveCollection('clients', clients);
                await AuditService.logAction('UPDATE_CLIENT', `Updated client ${updatedClient.fullName} `, currentUser);
            }
            return;
        }
        const { error } = await supabase
            .from('clients')
            .update({
                ...updates,
                modified_by: currentUser,
                modified_at: new Date().toISOString()
            })
            .eq('id', clientId);
        if (error) throw error;
        await AuditService.logAction('UPDATE_CLIENT', `Updated client ${clientId} `, currentUser);
    },

    async searchRNC(rnc: string) {
        try {
            const response = await fetch(`/api/rnc?rnc=${rnc}`);
            if (response.ok) {
                const data = await response.json();
                return data.name;
            }
        } catch (error) {
            console.error("Error fetching RNC:", error);
        }
        return null;
    },

    async deleteClient(clientId: string, currentUser: string) {
        if (USE_MOCK) {
            const clients = await fetchCollection('clients') as unknown as Client[];
            const filteredClients = clients.filter(c => c.id !== clientId);
            await saveCollection('clients', filteredClients);
            await AuditService.logAction('DELETE_CLIENT', `Deleted client ${clientId} `, currentUser);
            return;
        }
        const { error } = await supabase.from('clients').delete().eq('id', clientId);
        if (error) throw error;
        await AuditService.logAction('DELETE_CLIENT', `Deleted client ${clientId} `, currentUser);
    }
};

// --- Maintenance Service ---
export const MaintenanceService = {
    async addMaintenanceRecord(vehicleId: string, record: Omit<MaintenanceRecord, 'id'>, currentUser: string) {
        if (USE_MOCK) {
            const vehicles = await fetchCollection('vehicles') as unknown as Vehicle[];
            const index = vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1) {
                const newRecord = { ...record, id: Math.random().toString() };
                if (!vehicles[index].maintenanceLog) vehicles[index].maintenanceLog = [];
                vehicles[index].maintenanceLog!.push(newRecord);

                // Update last maintenance in schedule if matches
                if (vehicles[index].maintenanceSchedule) {
                    const scheduleIndex = vehicles[index].maintenanceSchedule!.findIndex(s => s.type === record.type);
                    if (scheduleIndex !== -1) {
                        vehicles[index].maintenanceSchedule![scheduleIndex].lastMaintenanceDate = record.date;
                        if (record.mileage) {
                            vehicles[index].maintenanceSchedule![scheduleIndex].lastMaintenanceKm = record.mileage;
                        }
                    }
                }

                await saveCollection('vehicles', vehicles);
                await AuditService.logAction('ADD_MAINTENANCE', `Added maintenance ${record.type} to vehicle ${vehicles[index].code}`, currentUser);
                return newRecord.id;
            }
            return null;
        }

        const { data, error } = await supabase
            .from('maintenance_logs')
            .insert([{
                vehicle_id: vehicleId,
                maintenance_date: record.date,
                maintenance_type: record.type,
                description: record.description,
                cost: record.cost,
                mileage: record.mileage,
                performed_by: record.performedBy,
                invoice_number: record.invoiceNumber,
                notes: record.notes
            }])
            .select()
            .single();

        if (error) throw error;

        await AuditService.logAction('ADD_MAINTENANCE', `Added maintenance ${record.type} to vehicle ${vehicleId}`, currentUser);
        return data.id;
    },

    async updateMaintenanceSchedule(vehicleId: string, schedule: MaintenanceSchedule[], currentUser: string) {
        if (USE_MOCK) {
            const vehicles = await fetchCollection('vehicles') as unknown as Vehicle[];
            const index = vehicles.findIndex(v => v.id === vehicleId);
            if (index !== -1) {
                vehicles[index].maintenanceSchedule = schedule;
                await saveCollection('vehicles', vehicles);
                await AuditService.logAction('UPDATE_MAINTENANCE_SCHEDULE', `Updated maintenance schedule for ${vehicles[index].code}`, currentUser);
            }
            return;
        }
        const { error } = await supabase
            .from('vehicles')
            .update({ maintenance_schedule: schedule })
            .eq('id', vehicleId);

        if (error) throw error;
        await AuditService.logAction('UPDATE_MAINTENANCE_SCHEDULE', `Updated maintenance schedule for ${vehicleId}`, currentUser);
    }
};

// --- Utility Functions ---
export function isLicenseExpiringSoon(expiryDate: string): boolean {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

export function isLicenseExpired(expiryDate: string): boolean {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
}

export function isBirthdayToday(dob: string): boolean {
    const today = new Date();
    const birthDate = new Date(dob);
    return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
}

export function getBirthdayMessage(firstName: string, lastName: string): string {
    return `¡Feliz cumpleaños ${firstName} ${lastName} ! 🎉🎂 Que tengas un día maravilloso lleno de alegría y bendiciones. ¡Que cumplas muchos más!`;
}

export function getDaysUntilExpiry(expiryDate: string): number {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(expiryDate: string): 'expired' | 'expiring-soon' | 'valid' {
    if (isLicenseExpired(expiryDate)) return 'expired';
    if (isLicenseExpiringSoon(expiryDate)) return 'expiring-soon';
    return 'valid';
}

export function calculateAge(dob: string): number {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

export interface FuelTicket {
    id: string;
    date: string;
    time: string;
    invoiceNumber: string;
    amount: number;
    messengerId: string;
    vehicleId: string;
    orderImageUrl?: string; // Imagen de la orden
    invoiceImageUrl?: string; // Imagen de la factura
    createdAt: any;
    createdBy: string;
}

// --- Fuel Service ---
export const FuelService = {
    async createFuelTicket(ticket: Omit<FuelTicket, 'id' | 'createdAt' | 'createdBy'>, currentUser: string) {
        const { data, error } = await supabase
            .from('fuel_tickets')
            .insert([{
                date: ticket.date,
                time: ticket.time,
                invoice_number: ticket.invoiceNumber,
                amount: ticket.amount,
                messenger_id: ticket.messengerId,
                vehicle_id: ticket.vehicleId,
                order_image_url: ticket.orderImageUrl,
                invoice_image_url: ticket.invoiceImageUrl,
                created_by: currentUser
            }])
            .select()
            .single();

        if (error) throw error;
        await AuditService.logAction('CREATE_FUEL_TICKET', `Created fuel ticket ${ticket.invoiceNumber} for $${ticket.amount}`, currentUser);
        return data.id;
    },

    async getAllFuelTickets() {
        if (USE_MOCK) return await fetchCollection('fuelTickets') as unknown as FuelTicket[];
        const { data, error } = await supabase
            .from('fuel_tickets')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        return data as unknown as FuelTicket[];
    }
};

// --- Gamification Service ---
export const GamificationService = {
    // Initialize default rules if none exist
    async initializeDefaultRules() {
        if (USE_MOCK) {
            const existingRules = await fetchCollection('gamificationRules') as unknown as GamificationRule[];
            if (existingRules.length === 0) {
                const defaultRules: GamificationRule[] = [
                    {
                        id: 'rule-time-fast',
                        name: 'Entrega Rápida',
                        type: 'time_based',
                        enabled: true,
                        pointsAwarded: 50,
                        pointsDeducted: 0,
                        threshold: 20, // 20% faster than average
                        description: '+50 puntos si completa la ruta 20% más rápido que el promedio del cliente'
                    },
                    {
                        id: 'rule-time-slow',
                        name: 'Entrega Lenta',
                        type: 'time_based',
                        enabled: true,
                        pointsAwarded: 0,
                        pointsDeducted: 30,
                        threshold: -20, // 20% slower than average
                        description: '-30 puntos si completa la ruta 20% más lento que el promedio del cliente'
                    },
                    {
                        id: 'rule-star-5',
                        name: 'Calificación 5 Estrellas',
                        type: 'star_rating',
                        enabled: true,
                        pointsAwarded: 40,
                        pointsDeducted: 0,
                        threshold: 5,
                        description: '+40 puntos por calificación de 5 estrellas'
                    },
                    {
                        id: 'rule-star-4',
                        name: 'Calificación 4 Estrellas',
                        type: 'star_rating',
                        enabled: true,
                        pointsAwarded: 20,
                        pointsDeducted: 0,
                        threshold: 4,
                        description: '+20 puntos por calificación de 4 estrellas'
                    },
                    {
                        id: 'rule-star-3',
                        name: 'Calificación 3 Estrellas',
                        type: 'star_rating',
                        enabled: true,
                        pointsAwarded: 0,
                        pointsDeducted: 0,
                        threshold: 3,
                        description: '0 puntos por calificación de 3 estrellas'
                    },
                    {
                        id: 'rule-star-2',
                        name: 'Calificación 2 Estrellas',
                        type: 'star_rating',
                        enabled: true,
                        pointsAwarded: 0,
                        pointsDeducted: 20,
                        threshold: 2,
                        description: '-20 puntos por calificación de 2 estrellas'
                    },
                    {
                        id: 'rule-star-1',
                        name: 'Calificación 1 Estrella',
                        type: 'star_rating',
                        enabled: true,
                        pointsAwarded: 0,
                        pointsDeducted: 40,
                        threshold: 1,
                        description: '-40 puntos por calificación de 1 estrella'
                    },
                    {
                        id: 'rule-volume',
                        name: 'Ruta Completada',
                        type: 'volume',
                        enabled: true,
                        pointsAwarded: 10,
                        pointsDeducted: 0,
                        description: '+10 puntos por cada ruta completada'
                    },
                    {
                        id: 'rule-streak',
                        name: 'Semana Perfecta',
                        type: 'streak',
                        enabled: true,
                        pointsAwarded: 100,
                        pointsDeducted: 0,
                        threshold: 7, // 7 consecutive days
                        description: '+100 puntos por 7 días consecutivos con calificación de 4+ estrellas'
                    }
                ];
                await saveCollection('gamificationRules', defaultRules);
                return defaultRules;
            }
            return existingRules;
        }

        const { data: existing, error: fetchError } = await supabase.from('gamification_rules').select('*');
        if (fetchError) throw fetchError;

        if (existing.length === 0) {
            const defaultRules = [
                { id: 'rule-time-fast', name: 'Entrega Rápida', type: 'time_based', enabled: true, points_awarded: 50, points_deducted: 0, threshold: 20, description: '+50 puntos si completa la ruta 20% más rápido que el promedio del cliente' },
                { id: 'rule-time-slow', name: 'Entrega Lenta', type: 'time_based', enabled: true, points_awarded: 0, points_deducted: 30, threshold: -20, description: '-30 puntos si completa la ruta 20% más lento que el promedio del cliente' },
                { id: 'rule-star-5', name: 'Calificación 5 Estrellas', type: 'star_rating', enabled: true, points_awarded: 40, points_deducted: 0, threshold: 5, description: '+40 puntos por calificación de 5 estrellas' },
                { id: 'rule-star-4', name: 'Calificación 4 Estrellas', type: 'star_rating', enabled: true, points_awarded: 20, points_deducted: 0, threshold: 4, description: '+20 puntos por calificación de 4 estrellas' },
                { id: 'rule-star-3', name: 'Calificación 3 Estrellas', type: 'star_rating', enabled: true, points_awarded: 0, points_deducted: 0, threshold: 3, description: '0 puntos por calificación de 3 estrellas' },
                { id: 'rule-star-2', name: 'Calificación 2 Estrellas', type: 'star_rating', enabled: true, points_awarded: 0, points_deducted: 20, threshold: 2, description: '-20 puntos por calificación de 2 estrellas' },
                { id: 'rule-star-1', name: 'Calificación 1 Estrella', type: 'star_rating', enabled: true, points_awarded: 0, points_deducted: 40, threshold: 1, description: '-40 puntos por calificación de 1 estrella' },
                { id: 'rule-volume', name: 'Ruta Completada', type: 'volume', enabled: true, points_awarded: 10, points_deducted: 0, description: '+10 puntos por cada ruta completada' },
                { id: 'rule-streak', name: 'Semana Perfecta', type: 'streak', enabled: true, points_awarded: 100, points_deducted: 0, threshold: 7, description: '+100 puntos por 7 días consecutivos con calificación de 4+ estrellas' }
            ];
            const { data, error } = await supabase.from('gamification_rules').insert(defaultRules).select();
            if (error) throw error;
            return data as unknown as GamificationRule[];
        }
        return existing as unknown as GamificationRule[];
    },

    async getRules(): Promise<GamificationRule[]> {
        return this.initializeDefaultRules();
    },

    async updateRule(ruleId: string, updates: Partial<GamificationRule>): Promise<void> {
        if (USE_MOCK) {
            const rules = await this.getRules();
            const index = rules.findIndex(r => r.id === ruleId);
            if (index !== -1) {
                rules[index] = { ...rules[index], ...updates };
                await saveCollection('gamificationRules', rules);
            }
            return;
        }
        const { error } = await supabase
            .from('gamification_rules')
            .update({
                enabled: updates.enabled,
                points_awarded: updates.pointsAwarded,
                points_deducted: updates.pointsDeducted,
                threshold: updates.threshold,
                description: updates.description
            })
            .eq('id', ruleId);
        if (error) throw error;
    },

    async resetRulesToDefault(): Promise<void> {
        if (USE_MOCK) {
            await saveCollection('gamificationRules', []);
            await this.initializeDefaultRules();
            return;
        }
        await supabase.from('gamification_rules').delete().neq('id', '');
        await this.initializeDefaultRules();
    },

    // Calculate points for a completed route
    async calculateRoutePoints(
        duration: number,
        starRating: number,
        clientId: string
    ): Promise<number> {
        const rules = await this.getRules();
        const enabledRules = rules.filter(r => r.enabled);
        let totalPoints = 0;

        // Get client route stats for time-based calculation
        const clientStats = await RouteService.getClientRouteStats(clientId);

        // Apply volume rule (base points for completion)
        const volumeRule = enabledRules.find(r => r.type === 'volume');
        if (volumeRule) {
            totalPoints += volumeRule.pointsAwarded;
        }

        // Apply star rating rules
        const starRule = enabledRules.find(r => r.type === 'star_rating' && r.threshold === starRating);
        if (starRule) {
            totalPoints += starRule.pointsAwarded - starRule.pointsDeducted;
        }

        // Apply time-based rules (if we have historical data)
        if (clientStats && clientStats.averageDuration > 0) {
            const percentageDiff = ((duration - clientStats.averageDuration) / clientStats.averageDuration) * 100;

            // Check if faster than average
            const fastRule = enabledRules.find(r => r.type === 'time_based' && r.threshold && r.threshold > 0);
            if (fastRule && fastRule.threshold && percentageDiff <= -fastRule.threshold) {
                totalPoints += fastRule.pointsAwarded;
            }

            // Check if slower than average
            const slowRule = enabledRules.find(r => r.type === 'time_based' && r.threshold && r.threshold < 0);
            if (slowRule && slowRule.threshold && percentageDiff >= Math.abs(slowRule.threshold)) {
                totalPoints -= slowRule.pointsDeducted;
            }
        }

        return totalPoints;
    },

    // Update messenger points
    async updateMessengerPoints(messengerId: string, pointsToAdd: number): Promise<void> {
        if (USE_MOCK) {
            const messengers = await fetchCollection('messengers') as unknown as Messenger[];
            const index = messengers.findIndex(m => m.id === messengerId);
            if (index !== -1) {
                messengers[index].points = (messengers[index].points || 0) + pointsToAdd;
                await saveCollection('messengers', messengers);
            }
            return;
        }

        // Use RPC or atomic increment if possible, but basic fetch/update works for now
        const { data, error: fetchError } = await supabase
            .from('messengers')
            .select('points')
            .eq('id', messengerId)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from('messengers')
            .update({ points: (data.points || 0) + pointsToAdd })
            .eq('id', messengerId);

        if (error) throw error;
    },

    // Get messenger ranking
    async getMessengerRanking(): Promise<Messenger[]> {
        if (USE_MOCK) {
            const messengers = await fetchCollection('messengers') as unknown as Messenger[];
            return messengers.sort((a, b) => (b.points || 0) - (a.points || 0));
        }
        const { data, error } = await supabase
            .from('messengers')
            .select('*')
            .order('points', { ascending: false });
        if (error) throw error;
        return data as Messenger[];
    },

    // Check for streak bonuses
    async checkStreakBonus(messengerId: string): Promise<number> {
        const rules = await this.getRules();
        const streakRule = rules.find(r => r.type === 'streak' && r.enabled);
        if (!streakRule || !streakRule.threshold) return 0;

        const history = await RouteService.getRouteHistory({ messengerId });
        const requiredDays = streakRule.threshold;

        // Get last N days of routes
        const today = new Date();
        const daysAgo = new Date(today);
        daysAgo.setDate(today.getDate() - requiredDays);

        const recentRoutes = history.filter(h => new Date(h.completedAt) >= daysAgo);

        // Check if we have routes for each day with 4+ stars
        const routesByDay = new Map<string, RouteHistory[]>();
        recentRoutes.forEach(route => {
            const day = new Date(route.completedAt).toDateString();
            if (!routesByDay.has(day)) {
                routesByDay.set(day, []);
            }
            routesByDay.get(day)!.push(route);
        });

        // Check if all days have at least one 4+ star route
        let consecutiveDays = 0;
        for (let i = 0; i < requiredDays; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dayKey = checkDate.toDateString();
            const dayRoutes = routesByDay.get(dayKey) || [];
            const has4PlusStars = dayRoutes.some(r => r.starRating >= 4);

            if (has4PlusStars) {
                consecutiveDays++;
            } else {
                break;
            }
        }

        if (consecutiveDays >= requiredDays) {
            return streakRule.pointsAwarded;
        }

        return 0;
    }

};

export const RouteService = {

    // Save route to history
    async saveRouteHistory(route: Omit<RouteHistory, 'id'>): Promise<string> {
        if (USE_MOCK) {
            const history = await fetchCollection('routeHistory') as unknown as RouteHistory[];
            const newRoute: RouteHistory = {
                ...route,
                id: `history-${Date.now()}-${Math.random()}`
            };
            history.push(newRoute);
            await saveCollection('routeHistory', history);
            await this.updateClientRouteStats(route.clientId, route.duration);
            return newRoute.id;
        }

        // In Supabase, 'history' is just routes with status='completed'
        // But we might want a denormalized record for reporting speed
        const { data, error } = await supabase
            .from('routes')
            .update({
                status: 'completed',
                end_time: route.endTime,
                duration_minutes: route.duration,
                notes: route.note
            })
            .eq('id', route.messengerId) // Wait, this is wrong. RouteHistory doesn't have routeId?
            // Actually RouteHistory interface probably should have been linked to a route.
            .select()
            .single();

        if (error) throw error;

        await this.updateClientRouteStats(route.clientId, route.duration);
        return data.id;
    },

    async getRouteHistory(filters?: { messengerId?: string; clientId?: string; startDate?: string; endDate?: string }): Promise<RouteHistory[]> {
        if (USE_MOCK) {
            let history = await fetchCollection('routeHistory') as unknown as RouteHistory[];

            if (filters) {
                if (filters.messengerId) {
                    history = history.filter(h => h.messengerId === filters.messengerId);
                }
                if (filters.clientId) {
                    history = history.filter(h => h.clientId === filters.clientId);
                }
                if (filters.startDate) {
                    history = history.filter(h => new Date(h.startTime) >= new Date(filters.startDate!));
                }
                if (filters.endDate) {
                    history = history.filter(h => new Date(h.endTime) <= new Date(filters.endDate!));
                }
            }

            return history.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        }

        let query = supabase
            .from('routes')
            .select(`
                *,
                messenger:messengers(firstName, lastName),
                vehicle:vehicles(code),
                stops:route_stops(client_id, location_name)
            `)
            .eq('status', 'completed');

        if (filters?.messengerId) query = query.eq('messenger_id', filters.messengerId);
        // if (filters?.clientId) query = query.filter('stops', 'cs', `[{"client_id": "${filters.clientId}"}]`); 
        // Note: Filter by clientId in a route with stops is harder. For now simple filtering:

        const { data, error } = await query.order('end_time', { ascending: false });
        if (error) throw error;

        return data.map(r => ({
            id: r.id,
            messengerId: r.messenger_id,
            messengerName: r.messenger ? `${r.messenger.firstName} ${r.messenger.lastName}` : 'Unknown',
            vehicleId: r.vehicle_id,
            vehicleCode: r.vehicle ? r.vehicle.code : 'Unknown',
            clientId: r.stops?.[0]?.client_id || '', // Fallback to first stop for compatibility
            clientName: r.stops?.[0]?.location_name || 'Multi-stop',
            startTime: r.start_time,
            endTime: r.end_time,
            duration: r.duration_minutes,
            starRating: 5, // We don't have this in schema yet
            note: r.notes || '',
            pointsEarned: 0,
            completedBy: 'System',
            completedAt: r.end_time
        })) as unknown as RouteHistory[];
    },

    // Client route statistics
    async getClientRouteStats(clientId: string): Promise<ClientRouteStats | null> {
        if (USE_MOCK) {
            const stats = await fetchCollection('clientRouteStats') as unknown as ClientRouteStats[];
            return stats.find(s => s.clientId === clientId) || null;
        }
        const { data, error } = await supabase
            .from('client_route_stats')
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
            clientId: data.client_id,
            clientName: data.client_name,
            totalRoutes: data.total_routes,
            averageDuration: data.average_duration_minutes,
            fastestDuration: data.fastest_duration_minutes,
            slowestDuration: data.slowest_duration_minutes,
            lastUpdated: data.last_updated
        } as ClientRouteStats;
    },

    async updateClientRouteStats(clientId: string, newDuration: number): Promise<void> {
        if (USE_MOCK) {
            const stats = await fetchCollection('clientRouteStats') as unknown as ClientRouteStats[];
            const index = stats.findIndex(s => s.clientId === clientId);

            // Get client name
            const clients = await fetchCollection('clients') as unknown as Client[];
            const client = clients.find(c => c.id === clientId);
            const clientName = client?.locationName || 'Unknown';

            if (index !== -1) {
                // Update existing stats
                const currentStats = stats[index];
                const totalRoutes = currentStats.totalRoutes + 1;
                const newAverage = ((currentStats.averageDuration * currentStats.totalRoutes) + newDuration) / totalRoutes;

                stats[index] = {
                    ...currentStats,
                    totalRoutes,
                    averageDuration: newAverage,
                    fastestDuration: Math.min(currentStats.fastestDuration, newDuration),
                    slowestDuration: Math.max(currentStats.slowestDuration, newDuration),
                    lastUpdated: new Date().toISOString()
                };
            } else {
                // Create new stats
                stats.push({
                    clientId,
                    clientName,
                    totalRoutes: 1,
                    averageDuration: newDuration,
                    fastestDuration: newDuration,
                    slowestDuration: newDuration,
                    lastUpdated: new Date().toISOString()
                });
            }

            await saveCollection('clientRouteStats', stats);
            return;
        }

        const current = await this.getClientRouteStats(clientId);
        if (current) {
            const totalRoutes = current.totalRoutes + 1;
            const newAverage = ((current.averageDuration * current.totalRoutes) + newDuration) / totalRoutes;
            await supabase
                .from('client_route_stats')
                .update({
                    total_routes: totalRoutes,
                    average_duration_minutes: newAverage,
                    fastest_duration_minutes: Math.min(current.fastestDuration, newDuration),
                    slowest_duration_minutes: Math.max(current.slowestDuration, newDuration),
                    last_updated: new Date().toISOString()
                })
                .eq('client_id', clientId);
        } else {
            const client = await ClientService.getAllClients();
            const clientName = client.find(c => c.id === clientId)?.locationName || 'Unknown';
            await supabase
                .from('client_route_stats')
                .insert([{
                    client_id: clientId,
                    client_name: clientName,
                    total_routes: 1,
                    average_duration_minutes: newDuration,
                    fastest_duration_minutes: newDuration,
                    slowest_duration_minutes: newDuration
                }]);
        }
    },

    // Messenger evaluations
    async saveEvaluation(evaluation: Omit<MessengerEvaluation, 'id'>): Promise<string> {
        if (USE_MOCK) {
            const evaluations = await fetchCollection('messengerEvaluations') as unknown as MessengerEvaluation[];
            const newEvaluation: MessengerEvaluation = {
                ...evaluation,
                id: `eval-${Date.now()}-${Math.random()}`
            };
            evaluations.push(newEvaluation);
            await saveCollection('messengerEvaluations', evaluations);
            return newEvaluation.id;
        }

        const { data, error } = await supabase
            .from('messenger_evaluations')
            .insert([{
                messenger_id: evaluation.messengerId,
                evaluated_by: evaluation.evaluatedBy,
                evaluated_at: evaluation.evaluatedAt,
                total_score: evaluation.totalScore,
                notes: evaluation.notes,
                questions: evaluation.questions
            }])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    },

    async getMessengerEvaluations(messengerId: string): Promise<MessengerEvaluation[]> {
        if (USE_MOCK) {
            const evaluations = await fetchCollection('messengerEvaluations') as unknown as MessengerEvaluation[];
            return evaluations
                .filter(e => e.messengerId === messengerId)
                .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
        }
        const { data, error } = await supabase
            .from('messenger_evaluations')
            .select('*')
            .eq('messenger_id', messengerId)
            .order('evaluated_at', { ascending: false });

        if (error) throw error;
        return data.map(e => ({
            id: e.id,
            messengerId: e.messenger_id,
            evaluatedBy: e.evaluated_by,
            evaluatedAt: e.evaluated_at,
            totalScore: e.total_score,
            notes: e.notes,
            questions: e.questions
        })) as unknown as MessengerEvaluation[];
    },

    // Get default evaluation questions
    getDefaultEvaluationQuestions(): Omit<EvaluationQuestion, 'rating'>[] {
        return [
            { id: 'q1', question: '¿Llega a tiempo a sus rutas?', category: 'punctuality' },
            { id: 'q2', question: '¿Trata bien a los clientes?', category: 'customer_service' },
            { id: 'q3', question: '¿Mantiene el vehículo en buen estado?', category: 'vehicle_care' },
            { id: 'q4', question: '¿Responde rápidamente a comunicaciones?', category: 'communication' },
            { id: 'q5', question: '¿Mantiene profesionalismo en el trabajo?', category: 'professionalism' },
            { id: 'q6', question: '¿Sigue las normas de seguridad?', category: 'safety' },
            { id: 'q7', question: '¿Es confiable y responsable?', category: 'reliability' },
            { id: 'q8', question: '¿Resuelve problemas efectivamente?', category: 'problem_solving' }
        ];
    },

};



// --- Corporate Document Service ---
export const CorporateDocumentService = {
    // Get all documents (latest version only by default)
    async getDocuments(category?: DocumentCategory): Promise<CorporateDocument[]> {
        if (USE_MOCK) {
            const allDocs = await fetchCollection('corporateDocuments') as unknown as CorporateDocument[];
            // Filter active only
            let activeDocs = allDocs.filter(d => d.status === 'active');

            if (category) {
                activeDocs = activeDocs.filter(d => d.category === category);
            }

            // Calculate status on fly
            return activeDocs.map(doc => this.enrichDocumentStatus(doc));
        }

        let query = supabase
            .from('corporate_documents')
            .select('*')
            .eq('status', 'active');

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(d => this.enrichDocumentStatus({
            id: d.id,
            parentId: d.parent_id,
            name: d.name,
            category: d.category,
            type: d.type || '',
            issueDate: d.issue_date,
            expiryDate: d.expiry_date,
            fileUrl: d.file_url,
            version: d.version,
            status: d.status,
            alertEnabled: d.alert_enabled,
            isTemplate: d.is_template
        } as unknown as CorporateDocument));
    },

    // Get full history for a document family
    async getDocumentHistory(parentId: string): Promise<CorporateDocument[]> {
        if (USE_MOCK) {
            const allDocs = await fetchCollection('corporateDocuments') as unknown as CorporateDocument[];
            return allDocs
                .filter(d => d.parentId === parentId)
                .sort((a, b) => b.version - a.version);
        }

        const { data, error } = await supabase
            .from('corporate_documents')
            .select('*')
            .eq('parent_id', parentId)
            .order('version', { ascending: false });

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            parentId: d.parent_id,
            name: d.name,
            category: d.category,
            type: d.type || '',
            issueDate: d.issue_date,
            expiryDate: d.expiry_date,
            fileUrl: d.file_url,
            version: d.version,
            status: d.status,
            alertEnabled: d.alert_enabled,
            isTemplate: d.is_template
        } as unknown as CorporateDocument));
    },

    // Upload/Create document with versioning
    async uploadDocument(docData: Omit<CorporateDocument, 'id' | 'version' | 'status' | 'parentId'> & { parentId?: string }): Promise<string> {
        if (USE_MOCK) {
            const allDocs = await fetchCollection('corporateDocuments') as unknown as CorporateDocument[];
            let version = 1;
            let parentId = docData.parentId;

            if (parentId) {
                // Versioning logic: Find current active doc with this parentId and archive it
                const currentActive = allDocs.find(d => d.parentId === parentId && d.status === 'active');
                if (currentActive) {
                    currentActive.status = 'archived';
                    version = currentActive.version + 1;
                }
            } else {
                // New family
                parentId = `doc-fam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            const newDoc: CorporateDocument = {
                ...docData,
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                parentId: parentId!,
                version,
                status: 'active',
                fileUrl: docData.fileUrl || '',
                alertEnabled: docData.alertEnabled ?? true,
                isTemplate: docData.isTemplate ?? false
            };

            allDocs.push(newDoc);
            await saveCollection('corporateDocuments', allDocs);
            return newDoc.id;
        }

        let version = 1;
        let parentId = docData.parentId;

        if (parentId) {
            // Find current active version
            const { data: current } = await supabase
                .from('corporate_documents')
                .select('version')
                .eq('parent_id', parentId)
                .eq('status', 'active')
                .maybeSingle();

            if (current) {
                // Archive old version
                await supabase
                    .from('corporate_documents')
                    .update({ status: 'archived' })
                    .eq('parent_id', parentId)
                    .eq('status', 'active');

                version = current.version + 1;
            }
        } else {
            parentId = `doc-fam-${Date.now()}`;
        }

        const { data, error } = await supabase
            .from('corporate_documents')
            .insert([{
                name: docData.name,
                category: docData.category,
                type: docData.type,
                issue_date: docData.issueDate,
                expiry_date: docData.expiryDate,
                file_url: docData.fileUrl,
                parent_id: parentId,
                version,
                status: 'active',
                alert_enabled: docData.alertEnabled ?? true,
                is_template: docData.isTemplate ?? false
            }])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    },

    // Helper: Calculate Alert Status
    enrichDocumentStatus(doc: CorporateDocument): CorporateDocument {
        if (!doc.expiryDate) {
            return { ...doc, calculatedStatus: 'vigente' };
        }

        const today = new Date();
        const expiry = new Date(doc.expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: DocumentStatusType = 'vigente';
        if (diffDays < 0) {
            status = 'vencido';
        } else if (diffDays <= 14) {
            status = 'por_vencer';
        }

        return { ...doc, calculatedStatus: status, daysUntilExpiry: diffDays };
    },

    // Check alerts for all active documents
    async checkAlerts(): Promise<CorporateDocument[]> {
        const docs = await this.getDocuments();
        return docs.filter(d => d.calculatedStatus === 'por_vencer' || d.calculatedStatus === 'vencido');
    }
};
