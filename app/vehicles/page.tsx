'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Wrench, RefreshCw, FileText, Printer, Eye, Upload, X, Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { ResourceService, Vehicle, MaintenanceService, MaintenanceRecord, MaintenanceSchedule } from '../services';

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [newVehicleType, setNewVehicleType] = useState<'Motor' | 'Carro' | 'Camión' | 'Furgoneta' | 'Autobús' | 'Otro'>('Motor');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [registrationImage, setRegistrationImage] = useState<string>('');
  const [insuranceImage, setInsuranceImage] = useState<string>('');
  const [vehiclePhoto, setVehiclePhoto] = useState<string>(''); // Vehicle photo
  const [creating, setCreating] = useState(false);

  // Maintenance Form
  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceMileage, setMaintenanceMileage] = useState('');
  const [maintenancePerformedBy, setMaintenancePerformedBy] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      await ResourceService.seedData();
      const data = await ResourceService.getAvailableVehicles();
      setVehicles(data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'registration' | 'insurance') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'registration') {
          setRegistrationImage(base64);
        } else {
          setInsuranceImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVehicle = async () => {
    if (!newVehicleModel.trim()) {
      alert('Por favor ingrese el modelo del vehículo');
      return;
    }

    setCreating(true);
    try {
      if (isEditing && editingId) {
        await ResourceService.updateVehicle(editingId, {
          model: newVehicleModel,
          type: newVehicleType,
          chassisNumber,
          insuranceExpiry,
          registrationImageUrl: registrationImage,
          insuranceImageUrl: insuranceImage,
          photoUrl: vehiclePhoto
        }, user?.username || 'admin');
      } else {
        await ResourceService.createVehicle(
          newVehicleModel,
          newVehicleType,
          chassisNumber,
          insuranceExpiry,
          registrationImage,
          insuranceImage
        );
      }
      await loadVehicles();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving vehicle:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingId(vehicle.id!);
    setIsEditing(true);
    setNewVehicleModel(vehicle.model);
    setNewVehicleType(vehicle.type);
    setChassisNumber(vehicle.chassisNumber || '');
    setInsuranceExpiry(vehicle.insuranceExpiry || '');
    setRegistrationImage(vehicle.registrationImageUrl || '');
    setInsuranceImage(vehicle.insuranceImageUrl || '');
    setVehiclePhoto(vehicle.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleAddMaintenance = async () => {
    if (!selectedVehicle || !maintenanceType || !maintenanceCost) return;

    try {
      await MaintenanceService.addMaintenanceRecord(selectedVehicle.id!, {
        date: maintenanceDate,
        type: maintenanceType,
        description: maintenanceDescription,
        cost: Number(maintenanceCost),
        mileage: Number(maintenanceMileage),
        performedBy: maintenancePerformedBy,
        notes: ''
      }, user?.username || 'admin');

      // Refresh vehicle data
      const updatedVehicles = await ResourceService.getAvailableVehicles();
      const updatedSelected = updatedVehicles.find(v => v.id === selectedVehicle.id);
      if (updatedSelected) setSelectedVehicle(updatedSelected);
      setVehicles(updatedVehicles);

      // Reset form
      setMaintenanceType('');
      setMaintenanceCost('');
      setMaintenanceDescription('');
      setMaintenanceMileage('');
      setMaintenancePerformedBy('');
    } catch (error) {
      console.error("Error adding maintenance:", error);
    }
  };

  const resetForm = () => {
    setNewVehicleModel('');
    setChassisNumber('');
    setInsuranceExpiry('');
    setRegistrationImage('');
    setInsuranceImage('');
    setVehiclePhoto('');
    setIsEditing(false);
    setEditingId(null);
    setNewVehicleType('Motor');
  };

  const openDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveTab('details');
    setIsDetailModalOpen(true);
  };

  const printDocument = (imageUrl: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="${title}" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const getInsuranceStatus = (expiry?: string) => {
    if (!expiry) return 'gray';
    const today = new Date();
    const expDate = new Date(expiry);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'red';
    if (diffDays < 30) return 'yellow';
    return 'green';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Flotilla (ARJ)</h1>
          <p className="text-muted-foreground">Gestión de vehículos con códigos automáticos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadVehicles} isLoading={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando flotilla...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id || vehicle.code} hover>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-mono">{vehicle.code}</CardTitle>
                  <div className="flex gap-2">
                    {vehicle.insuranceExpiry && (
                      <div className={`w-3 h-3 rounded-full ${getInsuranceStatus(vehicle.insuranceExpiry) === 'green' ? 'bg-success' :
                        getInsuranceStatus(vehicle.insuranceExpiry) === 'yellow' ? 'bg-warning' : 'bg-error'
                        }`} title="Estado de seguro" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                      {vehicle.status === 'active' ? 'Activo' : 'Mantenimiento'}
                    </span>
                  </div>
                </div>
                <CardDescription>{vehicle.type} • {vehicle.model}</CardDescription>
                {vehicle.chassisNumber && (
                  <p className="text-xs text-muted-foreground font-mono">Chasis: {vehicle.chassisNumber}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Vehicle Photo */}
                {vehicle.photoUrl && (
                  <div className="w-full h-40 rounded-lg overflow-hidden">
                    <img
                      src={vehicle.photoUrl}
                      alt={`${vehicle.code} - ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openDetails(vehicle)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Detalles
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditVehicle(vehicle)}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  setSelectedVehicle(vehicle);
                  setActiveTab('maintenance');
                  setIsDetailModalOpen(true);
                }}>
                  <Wrench className="w-4 h-4" />
                  Mantenimiento
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={isEditing ? `Editar Vehículo` : "Registrar Nuevo Vehículo"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {!isEditing && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                El código <strong>ARJ-{'{N}'}</strong> se generará automáticamente.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modelo *</label>
              <input
                type="text"
                value={newVehicleModel}
                onChange={(e) => setNewVehicleModel(e.target.value)}
                className="w-full p-2 rounded-lg border border-input bg-background"
                placeholder="Ej: Honda Super Cub"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <select
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-input bg-background"
              >
                <option value="Motor">Motor</option>
                <option value="Carro">Carro</option>
                <option value="Camión">Camión</option>
                <option value="Furgoneta">Furgoneta</option>
                <option value="Autobús">Autobús</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Foto del Vehículo</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setVehiclePhoto(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="vehicle-photo-upload"
              />
              <label
                htmlFor="vehicle-photo-upload"
                className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {vehiclePhoto ? 'Imagen cargada' : 'Subir foto'}
              </label>
              {vehiclePhoto && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setVehiclePhoto('')}>
                    <X className="w-4 h-4" />
                  </Button>
                  <img src={vehiclePhoto} alt="Vehicle" className="w-10 h-10 rounded object-cover" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Número de Chasis</label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              className="w-full p-2 rounded-lg border border-input bg-background"
              placeholder="Ej: 1HGBH41JXMN109186"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vencimiento de Póliza de Seguro</label>
            <input
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              className="w-full p-2 rounded-lg border border-input bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Matrícula (Imagen)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'registration')}
                className="hidden"
                id="registration-upload"
              />
              <label
                htmlFor="registration-upload"
                className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {registrationImage ? 'Imagen cargada' : 'Subir matrícula'}
              </label>
              {registrationImage && (
                <Button variant="ghost" size="sm" onClick={() => setRegistrationImage('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Póliza de Seguro (Imagen)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'insurance')}
                className="hidden"
                id="insurance-upload"
              />
              <label
                htmlFor="insurance-upload"
                className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {insuranceImage ? 'Imagen cargada' : 'Subir póliza'}
              </label>
              {insuranceImage && (
                <Button variant="ghost" size="sm" onClick={() => setInsuranceImage('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveVehicle} isLoading={creating}>
              {isEditing ? 'Guardar Cambios' : 'Generar Código y Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalles - ${selectedVehicle?.code}`}
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('details')}
              >
                Detalles
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'maintenance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('maintenance')}
              >
                Mantenimiento
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Código</p>
                    <p className="font-mono font-bold text-lg">{selectedVehicle.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{selectedVehicle.type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Modelo</p>
                    <p className="font-medium">{selectedVehicle.model}</p>
                  </div>
                  {selectedVehicle.chassisNumber && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Número de Chasis</p>
                      <p className="font-mono text-sm">{selectedVehicle.chassisNumber}</p>
                    </div>
                  )}
                  {selectedVehicle.insuranceExpiry && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Vencimiento de Seguro</p>
                      <p className="font-medium">{new Date(selectedVehicle.insuranceExpiry).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {(selectedVehicle.registrationImageUrl || selectedVehicle.insuranceImageUrl) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Documentos</h3>

                    {selectedVehicle.registrationImageUrl && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Matrícula</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printDocument(selectedVehicle.registrationImageUrl!, 'Matrícula - ' + selectedVehicle.code)}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                        </div>
                        <img
                          src={selectedVehicle.registrationImageUrl}
                          alt="Matrícula"
                          className="w-full rounded border"
                        />
                      </div>
                    )}

                    {selectedVehicle.insuranceImageUrl && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Póliza de Seguro</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printDocument(selectedVehicle.insuranceImageUrl!, 'Póliza - ' + selectedVehicle.code)}
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </Button>
                        </div>
                        <img
                          src={selectedVehicle.insuranceImageUrl}
                          alt="Póliza de Seguro"
                          className="w-full rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Add Maintenance Form */}
                <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Registrar Mantenimiento
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Tipo</label>
                      <select
                        className="w-full p-2 rounded border text-sm"
                        value={maintenanceType}
                        onChange={e => setMaintenanceType(e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Cambio de Aceite">Cambio de Aceite</option>
                        <option value="Frenos">Frenos</option>
                        <option value="Neumáticos">Neumáticos</option>
                        <option value="Batería">Batería</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Fecha</label>
                      <input
                        type="date"
                        className="w-full p-2 rounded border text-sm"
                        value={maintenanceDate}
                        onChange={e => setMaintenanceDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Costo</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded border text-sm"
                        placeholder="0.00"
                        value={maintenanceCost}
                        onChange={e => setMaintenanceCost(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Kilometraje</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded border text-sm"
                        placeholder="Km actual"
                        value={maintenanceMileage}
                        onChange={e => setMaintenanceMileage(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Realizado por</label>
                      <input
                        type="text"
                        className="w-full p-2 rounded border text-sm"
                        placeholder="Taller o mecánico"
                        value={maintenancePerformedBy}
                        onChange={e => setMaintenancePerformedBy(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Descripción</label>
                      <textarea
                        className="w-full p-2 rounded border text-sm"
                        placeholder="Detalles del trabajo realizado..."
                        rows={2}
                        value={maintenanceDescription}
                        onChange={e => setMaintenanceDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={handleAddMaintenance}>
                    Guardar Registro
                  </Button>
                </div>

                {/* Maintenance History */}
                <div>
                  <h3 className="font-semibold mb-3">Historial</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {selectedVehicle.maintenanceLog && selectedVehicle.maintenanceLog.length > 0 ? (
                      selectedVehicle.maintenanceLog.slice().reverse().map((record) => (
                        <div key={record.id} className="border rounded-lg p-3 text-sm bg-background">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{record.type}</span>
                            <span className="text-muted-foreground text-xs">{record.date}</span>
                          </div>
                          <p className="text-muted-foreground mb-2">{record.description}</p>
                          <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                            <span>Costo: ${record.cost}</span>
                            {record.mileage && <span>Km: {record.mileage}</span>}
                            <span>Por: {record.performedBy}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No hay registros de mantenimiento.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
