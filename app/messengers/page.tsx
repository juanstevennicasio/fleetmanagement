'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Search, User, Upload, X, RefreshCw, Eye, Edit, Copy, AlertTriangle, Camera, Cake, ClipboardCheck } from "lucide-react";
import { ResourceService, Messenger, Vehicle, MediaService, isLicenseExpired, isLicenseExpiringSoon, isBirthdayToday, getBirthdayMessage, getDaysUntilExpiry, getExpiryStatus, calculateAge } from '../services';
import { useAuth } from '../context/AuthContext';
import EvaluationForm from '@/components/messengers/EvaluationForm';

export default function MessengersPage() {
  const { user } = useAuth();
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredMessengers, setFilteredMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedMessenger, setSelectedMessenger] = useState<Messenger | null>(null);
  const [editingMessenger, setEditingMessenger] = useState<Messenger | null>(null);
  const [evaluatingMessenger, setEvaluatingMessenger] = useState<Messenger | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [cedula, setCedula] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idFrontImage, setIdFrontImage] = useState('');
  const [idBackImage, setIdBackImage] = useState('');
  const [licenseImage, setLicenseImage] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [assignedVehicles, setAssignedVehicles] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredMessengers(
        messengers.filter(m =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.cedula.includes(searchTerm)
        )
      );
    } else {
      setFilteredMessengers(messengers);
    }
  }, [searchTerm, messengers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [messengerData, vehicleData] = await Promise.all([
        ResourceService.getAvailableMessengers(),
        ResourceService.getAvailableVehicles()
      ]);
      setMessengers(messengerData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'idFront' | 'idBack' | 'license') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'photo') setPhotoUrl(base64);
        else if (type === 'idFront') setIdFrontImage(base64);
        else if (type === 'idBack') setIdBackImage(base64);
        else if (type === 'license') setLicenseImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMessenger = async () => {
    if (!firstName.trim() || !lastName.trim() || !cedula.trim() || !licenseExpiry) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      const messengerData = {
        firstName,
        lastName,
        photoUrl,
        cedula,
        dob,
        phone,
        address,
        idFrontImageUrl: idFrontImage,
        idBackImageUrl: idBackImage,
        licenseImageUrl: licenseImage,
        licenseExpiry,
        assignedVehicles,
        status: 'available' as const,
        points: 0
      };

      const messengerId = await ResourceService.createMessenger(messengerData, user.username);

      // Upload images to media library
      if (photoUrl) {
        await MediaService.uploadMedia(
          `foto_mensajero_${cedula}.jpg`,
          photoUrl,
          'other',
          'messenger',
          messengerId!,
          `${firstName} ${lastName}`,
          user.username
        );
      }

      if (idFrontImage) {
        await MediaService.uploadMedia(
          `cedula_frontal_${cedula}.jpg`,
          idFrontImage,
          'other',
          'messenger',
          messengerId!,
          `${firstName} ${lastName}`,
          user.username
        );
      }

      if (idBackImage) {
        await MediaService.uploadMedia(
          `cedula_reverso_${cedula}.jpg`,
          idBackImage,
          'other',
          'messenger',
          messengerId!,
          `${firstName} ${lastName}`,
          user.username
        );
      }

      if (licenseImage) {
        await MediaService.uploadMedia(
          `licencia_${cedula}.jpg`,
          licenseImage,
          'license',
          'messenger',
          messengerId!,
          `${firstName} ${lastName}`,
          user.username
        );
      }

      await loadData();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating messenger:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhotoUrl('');
    setCedula('');
    setDob('');
    setPhone('');
    setAddress('');
    setIdFrontImage('');
    setIdBackImage('');
    setLicenseImage('');
    setLicenseExpiry('');
    setAssignedVehicles([]);
  };

  const viewDetails = (messenger: Messenger) => {
    setSelectedMessenger(messenger);
    setIsDetailModalOpen(true);
  };

  const copyBirthdayMessage = (messenger: Messenger) => {
    const message = getBirthdayMessage(messenger.firstName, messenger.lastName);
    navigator.clipboard.writeText(message);
    alert('¡Mensaje de cumpleaños copiado al portapapeles!');
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.code} (${vehicle.model})` : vehicleId;
  };

  const hasExpiredDocuments = (messenger: Messenger) => {
    return isLicenseExpired(messenger.licenseExpiry);
  };

  const openEditModal = (messenger: Messenger) => {
    setEditingMessenger(messenger);
    setFirstName(messenger.firstName);
    setLastName(messenger.lastName);
    setPhotoUrl(messenger.photoUrl || '');
    setCedula(messenger.cedula);
    setDob(messenger.dob);
    setPhone(messenger.phone);
    setAddress(messenger.address);
    setIdFrontImage(messenger.idFrontImageUrl || '');
    setIdBackImage(messenger.idBackImageUrl || '');
    setLicenseImage(messenger.licenseImageUrl || '');
    setLicenseExpiry(messenger.licenseExpiry);
    setAssignedVehicles(messenger.assignedVehicles || []);
    setIsEditModalOpen(true);
  };

  const handleUpdateMessenger = async () => {
    if (!firstName.trim() || !lastName.trim() || !cedula.trim() || !licenseExpiry || !editingMessenger) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (!user) return;

    setEditing(true);
    try {
      const updatedData = {
        firstName,
        lastName,
        photoUrl,
        cedula,
        dob,
        phone,
        address,
        idFrontImageUrl: idFrontImage,
        idBackImageUrl: idBackImage,
        licenseImageUrl: licenseImage,
        licenseExpiry,
        assignedVehicles
      };

      await ResourceService.updateMessenger(editingMessenger.id!, updatedData, user.username);

      await loadData();
      resetForm();
      setIsEditModalOpen(false);
      setEditingMessenger(null);
    } catch (error) {
      console.error("Error updating messenger:", error);
    } finally {
      setEditing(false);
    }
  };

  const openEvaluationModal = (messenger: Messenger) => {
    setEvaluatingMessenger(messenger);
    setIsEvaluationModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mensajeros</h1>
          <p className="text-muted-foreground">Gestión de personal de entrega</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} isLoading={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Mensajero
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 rounded-lg border border-input bg-background"
              placeholder="Buscar por nombre o cédula..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Birthday Alerts */}
      {messengers.filter(m => isBirthdayToday(m.dob)).length > 0 && (
        <Card className="border-success bg-success/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Cake className="w-5 h-5" />
              ¡Cumpleaños Hoy!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {messengers.filter(m => isBirthdayToday(m.dob)).map(messenger => (
                <div key={messenger.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    {messenger.photoUrl ? (
                      <img src={messenger.photoUrl} alt={messenger.firstName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{messenger.firstName} {messenger.lastName}</p>
                      <p className="text-sm text-muted-foreground">¡Feliz cumpleaños! 🎉</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyBirthdayMessage(messenger)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Mensaje
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Expiry Alerts */}
      {messengers.filter(m => isLicenseExpiringSoon(m.licenseExpiry) || isLicenseExpired(m.licenseExpiry)).length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Licencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {messengers.filter(m => isLicenseExpiringSoon(m.licenseExpiry) || isLicenseExpired(m.licenseExpiry)).map(messenger => {
                const daysLeft = getDaysUntilExpiry(messenger.licenseExpiry);
                const isExpired = isLicenseExpired(messenger.licenseExpiry);
                return (
                  <div key={messenger.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      {messenger.photoUrl ? (
                        <img src={messenger.photoUrl} alt={messenger.firstName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{messenger.firstName} {messenger.lastName}</p>
                        <p className={`text-sm ${isExpired ? 'text-error' : 'text-warning'}`}>
                          {isExpired ? '¡Licencia vencida!' : `Licencia vence en ${daysLeft} días`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}`}>
                      {new Date(messenger.licenseExpiry).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messengers Grid */}
      {loading ? (
        <div className="text-center py-10">Cargando mensajeros...</div>
      ) : filteredMessengers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron mensajeros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMessengers.map((messenger) => {
            const hasExpired = hasExpiredDocuments(messenger);
            const isBirthday = isBirthdayToday(messenger.dob);

            return (
              <Card
                key={messenger.id}
                hover
                className={hasExpired ? 'border-error bg-error/5' : ''}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {messenger.photoUrl ? (
                      <img
                        src={messenger.photoUrl}
                        alt={messenger.firstName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {messenger.firstName} {messenger.lastName}
                        {isBirthday && <Cake className="w-4 h-4 text-success" />}
                      </CardTitle>
                      <CardDescription>{messenger.cedula}</CardDescription>
                      {messenger.dob && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(messenger.dob).toLocaleDateString()} ({calculateAge(messenger.dob)} años)
                        </p>
                      )}
                      {hasExpired && (
                        <span className="text-xs text-error flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Documentos vencidos
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* License Status */}
                  <div className={`p-2 rounded-lg border ${isLicenseExpired(messenger.licenseExpiry) ? 'bg-error/20 border-error' :
                    isLicenseExpiringSoon(messenger.licenseExpiry) ? 'bg-warning/20 border-warning' :
                      'bg-success/20 border-success'
                    }`}>
                    <p className="text-xs text-muted-foreground">Licencia</p>
                    <p className={`text-sm font-medium ${isLicenseExpired(messenger.licenseExpiry) ? 'text-error' :
                      isLicenseExpiringSoon(messenger.licenseExpiry) ? 'text-warning' :
                        'text-success'
                      }`}>
                      Vence: {new Date(messenger.licenseExpiry).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Assigned Vehicles */}
                  {messenger.assignedVehicles && messenger.assignedVehicles.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vehículos Asignados:</p>
                      <div className="flex flex-wrap gap-1">
                        {messenger.assignedVehicles.map(vehicleId => (
                          <span key={vehicleId} className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                            {getVehicleInfo(vehicleId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => viewDetails(messenger)}>
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(messenger)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => openEvaluationModal(messenger)}
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Evaluar Desempeño
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Messenger Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Nuevo Mensajero"
      >
        <div className="flex flex-col max-h-[85vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-6">
            {/* Photo Upload */}
            <div className="flex justify-center">
              <div className="relative">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-border" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e, 'photo')}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="Ej: Juan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Apellido *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="Ej: Pérez"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cédula *</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="001-0000000-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="809-555-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimiento Licencia *</label>
                <input
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 rounded-lg border border-input bg-background"
                placeholder="Calle, número, sector..."
                rows={2}
              />
            </div>

            {/* Document Uploads */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Documentos</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Cédula (Frontal)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'idFront')}
                    className="hidden"
                    id="id-front"
                  />
                  <label
                    htmlFor="id-front"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {idFrontImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Cédula (Reverso)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'idBack')}
                    className="hidden"
                    id="id-back"
                  />
                  <label
                    htmlFor="id-back"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {idBackImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Licencia</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'license')}
                    className="hidden"
                    id="license"
                  />
                  <label
                    htmlFor="license"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {licenseImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>
              </div>
            </div>

            {/* Vehicle Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehículos Asignados</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vehicles.map(vehicle => (
                  <label key={vehicle.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedVehicles.includes(vehicle.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedVehicles([...assignedVehicles, vehicle.id!]);
                        } else {
                          setAssignedVehicles(assignedVehicles.filter(id => id !== vehicle.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{vehicle.code} - {vehicle.model}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateMessenger} isLoading={creating}>
              Guardar Mensajero
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Messenger Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); resetForm(); setEditingMessenger(null); }}
        title="Editar Mensajero"
      >
        <div className="flex flex-col max-h-[85vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-6">
            {/* Photo Upload */}
            <div className="flex justify-center">
              <div className="relative">
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto" className="w-32 h-32 rounded-full object-cover border-4 border-border" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e, 'photo')}
                  className="hidden"
                  id="photo-upload-edit"
                />
                <label
                  htmlFor="photo-upload-edit"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="Ej: Juan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Apellido *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="Ej: Pérez"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cédula *</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="001-0000000-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="809-555-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimiento Licencia *</label>
                <input
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 rounded-lg border border-input bg-background"
                placeholder="Calle, número, sector..."
                rows={2}
              />
            </div>

            {/* Document Uploads */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Documentos</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Cédula (Frontal)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'idFront')}
                    className="hidden"
                    id="id-front-edit"
                  />
                  <label
                    htmlFor="id-front-edit"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {idFrontImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Cédula (Reverso)</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'idBack')}
                    className="hidden"
                    id="id-back-edit"
                  />
                  <label
                    htmlFor="id-back-edit"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {idBackImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Licencia</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, 'license')}
                    className="hidden"
                    id="license-edit"
                  />
                  <label
                    htmlFor="license-edit"
                    className="block p-3 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted text-center"
                  >
                    {licenseImage ? '✓ Cargada' : <Camera className="w-6 h-6 mx-auto" />}
                  </label>
                </div>
              </div>
            </div>

            {/* Vehicle Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vehículos Asignados</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vehicles.map(vehicle => (
                  <label key={vehicle.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedVehicles.includes(vehicle.id!)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedVehicles([...assignedVehicles, vehicle.id!]);
                        } else {
                          setAssignedVehicles(assignedVehicles.filter(id => id !== vehicle.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{vehicle.code} - {vehicle.model}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsEditModalOpen(false); resetForm(); setEditingMessenger(null); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateMessenger} isLoading={editing}>
              Actualizar Mensajero
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedMessenger ? `${selectedMessenger.firstName} ${selectedMessenger.lastName}` : 'Detalles'}
      >
        {selectedMessenger && (
          <div className="space-y-4">
            {/* Photo and Basic Info */}
            <div className="flex items-start gap-4">
              {selectedMessenger.photoUrl ? (
                <img src={selectedMessenger.photoUrl} alt={selectedMessenger.firstName} className="w-24 h-24 rounded-full object-cover border-4 border-border" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-border">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold">{selectedMessenger.firstName} {selectedMessenger.lastName}</h3>
                <p className="text-sm text-muted-foreground">{selectedMessenger.cedula}</p>
                {isBirthdayToday(selectedMessenger.dob) && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => copyBirthdayMessage(selectedMessenger)}>
                      <Cake className="w-4 h-4 mr-2" />
                      Copiar Mensaje de Cumpleaños
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium">{new Date(selectedMessenger.dob).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium">{selectedMessenger.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-medium">{selectedMessenger.address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Licencia - Vencimiento</p>
                <p className={`font-medium ${isLicenseExpired(selectedMessenger.licenseExpiry) ? 'text-error' :
                  isLicenseExpiringSoon(selectedMessenger.licenseExpiry) ? 'text-warning' :
                    'text-success'
                  }`}>
                  {new Date(selectedMessenger.licenseExpiry).toLocaleDateString()}
                  {isLicenseExpired(selectedMessenger.licenseExpiry) && ' (VENCIDA)'}
                  {isLicenseExpiringSoon(selectedMessenger.licenseExpiry) && ` (Vence en ${getDaysUntilExpiry(selectedMessenger.licenseExpiry)} días)`}
                </p>
              </div>
            </div>

            {/* Assigned Vehicles */}
            {selectedMessenger.assignedVehicles && selectedMessenger.assignedVehicles.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Vehículos Asignados</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMessenger.assignedVehicles.map(vehicleId => (
                    <span key={vehicleId} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                      {getVehicleInfo(vehicleId)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {(selectedMessenger.idFrontImageUrl || selectedMessenger.idBackImageUrl || selectedMessenger.licenseImageUrl) && (
              <div className="space-y-3">
                <h4 className="font-semibold">Documentos</h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedMessenger.idFrontImageUrl && (
                    <div className="border rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Cédula Frontal</p>
                      <img src={selectedMessenger.idFrontImageUrl} alt="Cédula Frontal" className="w-full rounded" />
                    </div>
                  )}
                  {selectedMessenger.idBackImageUrl && (
                    <div className="border rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Cédula Reverso</p>
                      <img src={selectedMessenger.idBackImageUrl} alt="Cédula Reverso" className="w-full rounded" />
                    </div>
                  )}
                  {selectedMessenger.licenseImageUrl && (
                    <div className="border rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Licencia</p>
                      <img src={selectedMessenger.licenseImageUrl} alt="Licencia" className="w-full rounded" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Evaluation Modal */}
      {evaluatingMessenger && (
        <EvaluationForm
          messenger={evaluatingMessenger}
          isOpen={isEvaluationModalOpen}
          onClose={() => {
            setIsEvaluationModalOpen(false);
            setEvaluatingMessenger(null);
            loadData(); // Reload to show updated data
          }}
          evaluatedBy={user?.username || 'system'}
        />
      )}
    </div>
  );
}
