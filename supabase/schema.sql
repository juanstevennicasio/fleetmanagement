-- Fleet Management System Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSENGERS TABLE
-- ============================================
CREATE TABLE messengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  photo_url TEXT,
  address TEXT,
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(50),
  assigned_vehicle_id UUID,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, on_leave
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL, -- e.g., "Motor 3", "Camión Hijet"
  type VARCHAR(100), -- motorcycle, truck, van
  plate_number VARCHAR(50),
  model VARCHAR(100),
  year INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  mileage INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE (for messengers)
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  messenger_id UUID NOT NULL REFERENCES messengers(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- license, insurance, id_card, etc.
  document_number VARCHAR(100),
  file_url TEXT,
  issue_date DATE,
  expiration_date DATE,
  status VARCHAR(50) DEFAULT 'valid', -- valid, expiring_soon, expired
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE LOGS TABLE
-- ============================================
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL, -- oil_change, tire_rotation, repair, inspection
  description TEXT,
  cost DECIMAL(10, 2),
  service_date DATE NOT NULL,
  mileage_at_service INTEGER,
  next_service_date DATE,
  performed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROUTES TABLE
-- ============================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  messenger_id UUID NOT NULL REFERENCES messengers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- calculated on completion
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROUTE STOPS TABLE (multi-destination support)
-- ============================================
CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  stop_order INTEGER NOT NULL, -- sequence in the route
  stop_type VARCHAR(50) DEFAULT 'client', -- client, special_delivery
  special_delivery_number VARCHAR(100), -- Ficha/Envío number for non-client stops
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  arrival_time TIMESTAMP WITH TIME ZONE,
  departure_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VISIT HISTORY TABLE
-- ============================================
CREATE TABLE visit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  messenger_id UUID REFERENCES messengers(id),
  route_id UUID REFERENCES routes(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(100) NOT NULL, -- route_irregularity, document_expiration, maintenance_due
  severity VARCHAR(50) DEFAULT 'info', -- info, warning, critical
  title VARCHAR(255) NOT NULL,
  description TEXT,
  related_entity_type VARCHAR(50), -- messenger, vehicle, route, document
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- GAMIFICATION RULES TABLE
-- ============================================
CREATE TABLE gamification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(100) NOT NULL, -- time_based, volume_based, streak_based
  criteria JSONB NOT NULL, -- flexible JSON for rule conditions
  points_value INTEGER NOT NULL,
  active_from DATE,
  active_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example criteria structure:
-- {
--   "min_routes": 10,
--   "max_avg_duration_minutes": 45,
--   "month": "2026-01"
-- }

-- ============================================
-- MESSENGER POINTS TABLE
-- ============================================
CREATE TABLE messenger_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  messenger_id UUID NOT NULL REFERENCES messengers(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES gamification_rules(id),
  points INTEGER NOT NULL,
  earned_date DATE NOT NULL,
  period VARCHAR(50), -- e.g., "2026-01" for monthly tracking
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_routes_messenger ON routes(messenger_id);
CREATE INDEX idx_routes_vehicle ON routes(vehicle_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_route_stops_route ON route_stops(route_id);
CREATE INDEX idx_documents_messenger ON documents(messenger_id);
CREATE INDEX idx_documents_expiration ON documents(expiration_date);
CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messenger_points_period ON messenger_points(period, messenger_id);

-- ============================================
-- FOREIGN KEY for vehicle assignment
-- ============================================
ALTER TABLE messengers 
  ADD CONSTRAINT fk_messenger_vehicle 
  FOREIGN KEY (assigned_vehicle_id) 
  REFERENCES vehicles(id) 
  ON DELETE SET NULL;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messengers_updated_at BEFORE UPDATE ON messengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate route duration on completion
CREATE OR REPLACE FUNCTION calculate_route_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_duration_on_route_complete 
  BEFORE UPDATE ON routes
  FOR EACH ROW 
  WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
  EXECUTE FUNCTION calculate_route_duration();

-- Auto-update document status based on expiration
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status = 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status = 'expiring_soon';
    ELSE
      NEW.status = 'valid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_status_trigger 
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW 
  EXECUTE FUNCTION update_document_status();
