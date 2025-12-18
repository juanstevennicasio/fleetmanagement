// Storage utility for persistent data management
// Uses localStorage for easy, fast, and exportable data storage

const STORAGE_KEYS = {
    CLIENTS: 'logitrack_clients',
    MESSENGERS: 'logitrack_messengers',
    VEHICLES: 'logitrack_vehicles',
    ROUTES: 'logitrack_routes',
    AUDIT_LOGS: 'logitrack_audit_logs',
    MEDIA: 'logitrack_media',
    SETTINGS: 'logitrack_settings',
    FUEL_TICKETS: 'logitrack_fuel_tickets',
    SYSTEM_CONFIG: 'fleet_system_config',
    PLATFORM_USERS: 'fleet_platform_users',
    CUSTOM_EVENTS: 'fleet_custom_events',
    GAMIFICATION_RULES: 'fleet_gamification_rules',
    ROUTE_HISTORY: 'fleet_route_history',
    MESSENGER_EVALUATIONS: 'fleet_messenger_evaluations',
    CLIENT_ROUTE_STATS: 'fleet_client_route_stats'
};

export class StorageService {
    // Generic get/set methods
    static get<T>(key: string): T[] {
        if (typeof window === 'undefined') return [];
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return [];
        }
    }

    static set<T>(key: string, data: T[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    }

    // Specific getters
    static getClients() {
        return this.get(STORAGE_KEYS.CLIENTS);
    }

    static getMessengers() {
        return this.get(STORAGE_KEYS.MESSENGERS);
    }

    static getVehicles() {
        return this.get(STORAGE_KEYS.VEHICLES);
    }

    static getRoutes() {
        return this.get(STORAGE_KEYS.ROUTES);
    }

    static getAuditLogs() {
        return this.get(STORAGE_KEYS.AUDIT_LOGS);
    }

    static getMedia() {
        return this.get(STORAGE_KEYS.MEDIA);
    }

    static getSettings() {
        const settings = this.get(STORAGE_KEYS.SETTINGS);
        return settings[0] || {};
    }

    // Specific setters
    static setClients(data: any[]) {
        this.set(STORAGE_KEYS.CLIENTS, data);
    }

    static setMessengers(data: any[]) {
        this.set(STORAGE_KEYS.MESSENGERS, data);
    }

    static setVehicles(data: any[]) {
        this.set(STORAGE_KEYS.VEHICLES, data);
    }

    static setRoutes(data: any[]) {
        this.set(STORAGE_KEYS.ROUTES, data);
    }

    static setAuditLogs(data: any[]) {
        this.set(STORAGE_KEYS.AUDIT_LOGS, data);
    }

    static setMedia(data: any[]) {
        this.set(STORAGE_KEYS.MEDIA, data);
    }

    static setSettings(data: any) {
        this.set(STORAGE_KEYS.SETTINGS, [data]);
    }

    static getFuelTickets() {
        return this.get(STORAGE_KEYS.FUEL_TICKETS);
    }

    static setFuelTickets(data: any[]) {
        this.set(STORAGE_KEYS.FUEL_TICKETS, data);
    }

    static getPlatformUsers() {
        return this.get(STORAGE_KEYS.PLATFORM_USERS);
    }

    static setPlatformUsers(data: any[]) {
        this.set(STORAGE_KEYS.PLATFORM_USERS, data);
    }

    static getActiveDashboardCards() {
        return this.get('logitrack_active_dashboard_cards'); // hardcoded string or add to STORAGE_KEYS
    }

    static setActiveDashboardCards(data: any[]) {
        this.set('logitrack_active_dashboard_cards', data);
    }

    static getCustomEvents() {
        return this.get(STORAGE_KEYS.CUSTOM_EVENTS);
    }

    static setCustomEvents(data: any[]) {
        this.set(STORAGE_KEYS.CUSTOM_EVENTS, data);
    }

    static getGamificationRules() {
        return this.get(STORAGE_KEYS.GAMIFICATION_RULES);
    }

    static setGamificationRules(data: any[]) {
        this.set(STORAGE_KEYS.GAMIFICATION_RULES, data);
    }

    static getRouteHistory() {
        return this.get(STORAGE_KEYS.ROUTE_HISTORY);
    }

    static setRouteHistory(data: any[]) {
        this.set(STORAGE_KEYS.ROUTE_HISTORY, data);
    }

    static getMessengerEvaluations() {
        return this.get(STORAGE_KEYS.MESSENGER_EVALUATIONS);
    }

    static setMessengerEvaluations(data: any[]) {
        this.set(STORAGE_KEYS.MESSENGER_EVALUATIONS, data);
    }

    static getClientRouteStats() {
        return this.get(STORAGE_KEYS.CLIENT_ROUTE_STATS);
    }

    static setClientRouteStats(data: any[]) {
        this.set(STORAGE_KEYS.CLIENT_ROUTE_STATS, data);
    }

    // Add audit log entry
    static addAuditLog(action: string, details: string, user: string) {
        const logs = this.getAuditLogs();
        const newLog = {
            id: `audit-${Date.now()}-${Math.random()}`,
            action,
            details,
            user,
            timestamp: new Date().toISOString(),
            timestampSeconds: Date.now() / 1000
        };
        logs.unshift(newLog); // Add to beginning
        this.setAuditLogs(logs);
        return newLog;
    }

    // Export all data
    static exportAllData() {
        const allData = {
            clients: this.getClients(),
            messengers: this.getMessengers(),
            vehicles: this.getVehicles(),
            routes: this.getRoutes(),
            auditLogs: this.getAuditLogs(),
            media: this.getMedia(),
            settings: this.getSettings(),
            fuelTickets: this.getFuelTickets(),
            customEvents: this.getCustomEvents(),
            gamificationRules: this.getGamificationRules(),
            routeHistory: this.getRouteHistory(),
            messengerEvaluations: this.getMessengerEvaluations(),
            clientRouteStats: this.getClientRouteStats(),
            exportDate: new Date().toISOString(),
            version: '6.0.0'
        };
        return JSON.stringify(allData, null, 2);
    }

    // Import data
    static importData(jsonString: string) {
        try {
            const data = JSON.parse(jsonString);
            if (data.clients) this.setClients(data.clients);
            if (data.messengers) this.setMessengers(data.messengers);
            if (data.vehicles) this.setVehicles(data.vehicles);
            if (data.routes) this.setRoutes(data.routes);
            if (data.auditLogs) this.setAuditLogs(data.auditLogs);
            if (data.media) this.setMedia(data.media);
            if (data.settings) this.setSettings(data.settings);
            if (data.fuelTickets) this.setFuelTickets(data.fuelTickets);
            if (data.customEvents) this.setCustomEvents(data.customEvents);
            if (data.gamificationRules) this.setGamificationRules(data.gamificationRules);
            if (data.routeHistory) this.setRouteHistory(data.routeHistory);
            if (data.messengerEvaluations) this.setMessengerEvaluations(data.messengerEvaluations);
            if (data.clientRouteStats) this.setClientRouteStats(data.clientRouteStats);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (with confirmation)
    static clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Initialize with seed data if empty
    static initializeIfEmpty() {
        if (typeof window === 'undefined') return;

        // Check if we have any data
        const hasData = this.getClients().length > 0 ||
            this.getMessengers().length > 0 ||
            this.getVehicles().length > 0;

        if (!hasData) {
            // Initialize with Sandro Rotonda client
            const today = new Date();
            const initialClient = {
                id: 'client-1',
                locationName: 'Farmacia Sandro',
                fullName: 'Sandro Rotonda',
                cedula: '001-1234567-8',
                dob: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                address: 'Calle Principal, Zona Colonial, Santo Domingo',
                latitude: 19.4934167,
                longitude: -70.7390556,
                annualVisits: 12,
                createdBy: 'system',
                createdAt: { seconds: Date.now() / 1000 }
            };

            this.setClients([initialClient]);
            this.addAuditLog('SYSTEM_INIT', 'Sistema inicializado con datos de ejemplo', 'system');
        }
    }
}
