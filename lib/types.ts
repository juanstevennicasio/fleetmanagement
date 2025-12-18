// TypeScript types for Fleet Management System

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  google_maps_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Messenger {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  assigned_vehicle_id?: string;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type?: string;
  plate_number?: string;
  model?: string;
  year?: number;
  status: 'active' | 'maintenance' | 'inactive';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  mileage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  messenger_id: string;
  document_type: string;
  document_number?: string;
  file_url?: string;
  issue_date?: string;
  expiration_date?: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  description?: string;
  cost?: number;
  service_date: string;
  mileage_at_service?: number;
  next_service_date?: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
}

export interface Route {
  id: string;
  messenger_id: string;
  vehicle_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteStop {
  id: string;
  route_id: string;
  client_id?: string;
  stop_order: number;
  stop_type: 'client' | 'special_delivery';
  special_delivery_number?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  created_at: string;
}

export interface VisitHistory {
  id: string;
  client_id: string;
  messenger_id?: string;
  route_id?: string;
  visit_date: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  alert_type: 'route_irregularity' | 'document_expiration' | 'maintenance_due';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface GamificationRule {
  id: string;
  rule_name: string;
  description?: string;
  rule_type: 'time_based' | 'volume_based' | 'streak_based';
  criteria: Record<string, unknown>;
  points_value: number;
  active_from?: string;
  active_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessengerPoints {
  id: string;
  messenger_id: string;
  rule_id?: string;
  points: number;
  earned_date: string;
  period?: string;
  description?: string;
  created_at: string;
}

// Extended types with relations
export interface RouteWithDetails extends Route {
  messenger?: Messenger;
  vehicle?: Vehicle;
  stops?: RouteStop[];
}

export interface MessengerWithDetails extends Messenger {
  vehicle?: Vehicle;
  documents?: Document[];
  total_points?: number;
}

export interface DocumentStatus {
  status: 'valid' | 'expiring_soon' | 'expired';
  color: 'green' | 'yellow' | 'red';
  daysUntilExpiration?: number;
}

// --- Corporate Documents Module Types ---

export type DocumentCategory = 'legal' | 'fiscal' | 'laboral' | 'financiero' | 'compras';

export type DocumentStatusType = 'vigente' | 'por_vencer' | 'vencido';

export interface CorporateDocument {
  id: string;
  parentId: string; // Links versions of the same document family
  name: string; // e.g., "Registro Mercantil"
  category: DocumentCategory;
  type: string; // Specific sub-type from taxonomy
  version: number;
  issueDate: string; // ISO Date
  expiryDate?: string; // ISO Date (optional)
  fileUrl: string;
  status: 'active' | 'archived'; // 'active' = current version, 'archived' = historic
  isTemplate: boolean;
  alertEnabled: boolean;
  
  // Metadata for UI helpers (calculated on fetch)
  calculatedStatus?: DocumentStatusType;
  daysUntilExpiry?: number;
}

export const DOCUMENT_TAXONOMY: Record<DocumentCategory, string[]> = {
  legal: [
    'Registro Mercantil',
    'Estatutos Sociales',
    'Acta de Asamblea Ordinaria',
    'Acta de Asamblea Extraordinaria',
    'Nómina de Accionistas',
    'Informe Comisario',
    'Beneficiario Final',
    'Lista de Suscriptores'
  ],
  fiscal: [
    'Formulario RNC',
    'Declaración Jurada Anual (IR-2)',
    'Declaración Jurada Activos',
    'Declaración Mensual (IT-1)',
    'Declaración Mensual (IR-17)',
    'Certificación Cumplimiento Fiscal',
    'Secuencias NCF'
  ],
  laboral: [
    'Formulario DGT-3',
    'Formulario DGT-4',
    'Certificación TSS',
    'Reglamento Interno',
    'Carta Descargo',
    'Amonestación',
    'Contrato Indefinido',
    'Contrato Temporal',
    'Contrato Obra',
    'Acuerdo Confidencialidad'
  ],
  financiero: [
    'Estados Financieros Auditados',
    'Balance General',
    'Estado de Resultados',
    'Flujo de Efectivo',
    'Conciliación Bancaria',
    'Contrato Préstamo',
    'Presupuesto Anual'
  ],
  compras: [
    'Registro Proveedores Estado (RPE)',
    'Certificación No Inhabilitación',
    'Póliza Seguros',
    'Fianza'
  ]
};
