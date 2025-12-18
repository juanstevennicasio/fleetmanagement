'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Search, MapPin, Copy, Eye, Edit, Trash2, Upload, Download, X, RefreshCw } from "lucide-react";
import { ClientService, Client, MediaService } from '../services';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';

// Dynamic import for MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
const ClientMap = dynamic(() => import('@/components/ClientMap'), { ssr: false });

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  // Form fields
  const [clientType, setClientType] = useState<'fisica' | 'juridica'>('fisica');
  const [locationName, setLocationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [foundationDate, setFoundationDate] = useState('');
  const [cedula, setCedula] = useState('');
  const [rnc, setRnc] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(19.46305578766469); // Santo Domingo default
  const [longitude, setLongitude] = useState(-70.70945084095003);
  const [idFrontImage, setIdFrontImage] = useState('');
  const [idBackImage, setIdBackImage] = useState('');
  const [clientPhoto, setClientPhoto] = useState(''); // Foto de cliente o logo
  const [locationPhotos, setLocationPhotos] = useState<string[]>([]); // Fotos del local (máx 3)
  const [registroMercantil, setRegistroMercantil] = useState(''); // Registro Mercantil
  const [creating, setCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredClients(
        clients.filter(c =>
          c.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.cedula && c.cedula.includes(searchTerm)) ||
          (c.rnc && c.rnc.includes(searchTerm))
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await ClientService.getAllClients();
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (side === 'front') {
          setIdFrontImage(base64);
        } else {
          setIdBackImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (locationPhotos.length + files.length > 3) {
      alert('Solo puedes subir un máximo de 3 fotos del local');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocationPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeLocationPhoto = (index: number) => {
    setLocationPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegistroMercantilUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegistroMercantil(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClient = async () => {
    if (!locationName.trim() || !fullName.trim()) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (clientType === 'fisica' && !cedula.trim()) {
      alert('La cédula es requerida para personas físicas');
      return;
    }

    if (clientType === 'juridica' && !rnc.trim()) {
      alert('El RNC es requerido para personas jurídicas');
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      const clientData: Partial<Client> = {
        type: clientType,
        locationName,
        fullName,
        address,
        latitude,
        longitude,
        idFrontImageUrl: idFrontImage,
        idBackImageUrl: idBackImage,
        photoUrl: clientPhoto,
        locationPhotos: locationPhotos,
        registroMercantilUrl: clientType === 'juridica' ? registroMercantil : undefined,
      };

      if (clientType === 'fisica') {
        clientData.cedula = cedula;
        clientData.dob = dob;
        clientData.rnc = undefined;
        clientData.foundationDate = undefined;
      } else {
        clientData.rnc = rnc;
        clientData.foundationDate = foundationDate;
        clientData.cedula = undefined;
        clientData.dob = undefined;
      }

      if (isEditing && editingId) {
        await ClientService.updateClient(editingId, clientData, user.username);
      } else {
        const newClient = { ...clientData, annualVisits: 0 } as Omit<Client, 'id' | 'createdAt'>;
        const clientId = await ClientService.createClient(newClient, user.username);

        // Upload images if new
        if (idFrontImage) {
          await MediaService.uploadMedia(`id_front_${clientId}.jpg`, idFrontImage, 'other', 'client', clientId!, locationName, user.username);
        }
        if (idBackImage) {
          await MediaService.uploadMedia(`id_back_${clientId}.jpg`, idBackImage, 'other', 'client', clientId!, locationName, user.username);
        }
      }

      await loadClients();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingId(client.id!);
    setIsEditing(true);
    setClientType(client.type || 'fisica');
    setLocationName(client.locationName);
    setFullName(client.fullName);
    setAddress(client.address || '');
    setLatitude(client.latitude);
    setLongitude(client.longitude);
    setIdFrontImage(client.idFrontImageUrl || '');
    setIdBackImage(client.idBackImageUrl || '');
    setClientPhoto(client.photoUrl || '');
    setLocationPhotos(client.locationPhotos || []);
    setRegistroMercantil(client.registroMercantilUrl || '');

    if (client.type === 'juridica') {
      setRnc(client.rnc || '');
      setFoundationDate(client.foundationDate || '');
      setCedula('');
      setDob('');
    } else {
      setCedula(client.cedula || '');
      setDob(client.dob || '');
      setRnc('');
      setFoundationDate('');
    }
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setClientType('fisica');
    setLocationName('');
    setFullName('');
    setDob('');
    setFoundationDate('');
    setCedula('');
    setRnc('');
    setAddress('');
    setLatitude(19.46305578766469);
    setLongitude(-70.70945084095003);
    setIdFrontImage('');
    setIdBackImage('');
    setClientPhoto('');
    setLocationPhotos([]);
    setRegistroMercantil('');
    setIsEditing(false);
    setEditingId(null);
  };

  const copyGoogleMapsUrl = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    navigator.clipboard.writeText(url);
    alert('¡URL de Google Maps copiada al portapapeles!');
  };

  const viewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };


  const handleDownloadTemplate = () => {
    const headers = "Nombre Completo,Cedula,Direccion,Visitas Anuales,Nombre Local,Tipo Cliente,RNC,Fecha Fundacion,Fecha Nacimiento";
    const example = "\"Juan Perez\",\"001-0000000-1\",\"Calle Falsa 123\",\"12\",\"Tienda Juan\",\"fisica\",\"\",\"\",\"1990-01-01\"";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_clientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      
      setLoading(true);
      let successCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",").map(v => v.replace(/^\"|\"$/g, ""));
        
        try {
          await ClientService.createClient({
            fullName: values[0],
            cedula: values[1],
            address: values[2],
            annualVisits: parseInt(values[3]) || 0,
            locationName: values[4],
            type: (values[5] as any) || 'fisica',
            rnc: values[6] || '',
            foundationDate: values[7] || '',
            dob: values[8] || '',
            latitude: 19.46305578766469, // Default center
            longitude: -70.70945084095003
          }, user?.username || 'admin');
          successCount++;
        } catch (error) {
          console.error("Error importing line", i, error);
        }
      }
      
      alert(`Importación completada. ${successCount} clientes agregados.`);
      loadClients();
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gestión de ubicaciones y clientes</p>
        </div>
        <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2" title="Descargar Plantilla">
            <Download className="w-4 h-4" />
            Plantilla
          </Button>
          <div className="relative">
             <input
                 type="file"
                 accept=".csv"
                 onChange={handleImportCSV}
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 title="Importar CSV"
             />
             <Button variant="outline" className="flex items-center gap-2">
                 <Upload className="w-4 h-4" />
                 Importar
             </Button>
          </div>
          <Button variant="outline" onClick={loadClients} isLoading={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Agregar Cliente
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
              placeholder="Buscar por nombre de ubicación, cliente o cédula..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {loading ? (
        <div className="text-center py-10">Cargando clientes...</div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-start flex-1">
                    {/* Client Photo/Logo */}
                    {client.photoUrl && (
                      <img
                        src={client.photoUrl}
                        alt={client.type === 'fisica' ? 'Foto Cliente' : 'Logo'}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{client.locationName}</CardTitle>
                      <CardDescription className="truncate">{client.fullName}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyGoogleMapsUrl(client.latitude, client.longitude)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Map Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative border">
                  <ClientMap lat={client.latitude} lng={client.longitude} height="100%" />
                  <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs z-[400]">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                  </div>
                </div>

                {/* Location Photos */}
                {client.locationPhotos && client.locationPhotos.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fotos del Lugar</p>
                    <div className="grid grid-cols-3 gap-2">
                      {client.locationPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Local ${index + 1}`}
                          className="w-full h-20 rounded object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-1 text-sm">
                  {client.address && (
                    <p className="text-muted-foreground truncate">{client.address}</p>
                  )}
                  <p className="text-muted-foreground">
                    <strong>Visitas anuales:</strong> {client.annualVisits}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => viewDetails(client)}>
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditClient(client)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={isEditing ? "Editar Cliente" : "Agregar Nuevo Cliente"}
      >
        <div className="flex flex-col max-h-[80vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-2">Tipo de Cliente</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="fisica"
                      checked={clientType === 'fisica'}
                      onChange={() => setClientType('fisica')}
                    />
                    Persona Física
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="juridica"
                      checked={clientType === 'juridica'}
                      onChange={() => setClientType('juridica')}
                    />
                    Persona Jurídica
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de Ubicación *</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder="Ej: Farmacia San Juan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{clientType === 'fisica' ? 'Nombre Completo *' : 'Razón Social *'}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  placeholder={clientType === 'fisica' ? "Ej: Juan Pérez" : "Ej: Farmacia San Juan SRL"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{clientType === 'fisica' ? 'Fecha de Nacimiento' : 'Fecha de Fundación'}</label>
                <input
                  type="date"
                  value={clientType === 'fisica' ? dob : foundationDate}
                  onChange={(e) => clientType === 'fisica' ? setDob(e.target.value) : setFoundationDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{clientType === 'fisica' ? 'Cédula *' : 'RNC *'}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientType === 'fisica' ? cedula : rnc}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (clientType === 'fisica') setCedula(val);
                      else setRnc(val);
                    }}
                    onBlur={async () => {
                      if (clientType === 'juridica' && rnc.length >= 9) {
                        setLoading(true);
                        try {
                          const name = await ClientService.searchRNC(rnc);
                          if (name) {
                            setFullName(name);
                          } else {
                            alert("RNC no encontrado en la base de datos de prueba.");
                          }
                        } catch (error) {
                          console.error("Error searching RNC", error);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                      }
                    }}
                    className="w-full p-2 rounded-lg border border-input bg-background"
                    placeholder={clientType === 'fisica' ? "001-0000000-0" : "1-01-00000-0"}
                  />
                  {loading && clientType === 'juridica' && rnc.length >= 9 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {clientType === 'juridica' && <p className="text-xs text-muted-foreground">Ingrese el RNC para buscar el nombre automáticamente.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección Escrita (Opcional)</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 rounded-lg border border-input bg-background"
                placeholder="Calle, número, sector..."
                rows={2}
              />
            </div>

            {/* ID Card Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cédula (Frontal)</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'front')}
                    className="hidden"
                    id="id-front-upload"
                  />
                  <label
                    htmlFor="id-front-upload"
                    className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {idFrontImage ? 'Cargada' : 'Subir'}
                  </label>
                  {idFrontImage && (
                    <Button variant="ghost" size="sm" onClick={() => setIdFrontImage('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cédula (Reverso)</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'back')}
                    className="hidden"
                    id="id-back-upload"
                  />
                  <label
                    htmlFor="id-back-upload"
                    className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {idBackImage ? 'Cargada' : 'Subir'}
                  </label>
                  {idBackImage && (
                    <Button variant="ghost" size="sm" onClick={() => setIdBackImage('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Client Photo / Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {clientType === 'fisica' ? 'Foto de Cliente' : 'Logo'}
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleClientPhotoUpload}
                  className="hidden"
                  id="client-photo-upload"
                />
                <label
                  htmlFor="client-photo-upload"
                  className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {clientPhoto ? 'Cargada' : 'Subir'}
                </label>
                {clientPhoto && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setClientPhoto('')}>
                      <X className="w-4 h-4" />
                    </Button>
                    <img src={clientPhoto} alt="Preview" className="w-10 h-10 rounded object-cover" />
                  </>
                )}
              </div>
            </div>

            {/* Location Photos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fotos del Local (Máximo 3)</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocationPhotoUpload}
                  className="hidden"
                  id="location-photos-upload"
                  multiple
                />
                <label
                  htmlFor="location-photos-upload"
                  className="w-full p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir Fotos ({locationPhotos.length}/3)
                </label>
                {locationPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {locationPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img src={photo} alt={`Local ${index + 1}`} className="w-full h-20 rounded object-cover" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-6 w-6 p-0 bg-background/80"
                          onClick={() => removeLocationPhoto(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Registro Mercantil - Only for Juridica */}
            {clientType === 'juridica' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Registro Mercantil</label>
                <p className="text-xs text-muted-foreground">Documento en cualquier formato (imagen, PDF, video)</p>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleRegistroMercantilUpload}
                    className="hidden"
                    id="registro-mercantil-upload"
                  />
                  <label
                    htmlFor="registro-mercantil-upload"
                    className="flex-1 p-2 rounded-lg border border-input bg-background cursor-pointer hover:bg-muted flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {registroMercantil ? 'Cargado' : 'Subir Documento'}
                  </label>
                  {registroMercantil && (
                    <Button variant="ghost" size="sm" onClick={() => setRegistroMercantil('')}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación en el Mapa</label>
              <p className="text-xs text-muted-foreground mb-2">
                Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta
              </p>
              <MapPicker
                initialLat={latitude}
                initialLng={longitude}
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                height="300px"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Sticky Footer with Save Button */}
          <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveClient} isLoading={creating}>
              {isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedClient?.locationName || 'Detalles del Cliente'}
      >
        {selectedClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Nombre de Ubicación</p>
                <p className="font-bold text-lg">{selectedClient.locationName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{selectedClient.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cédula</p>
                <p className="font-mono text-sm">{selectedClient.cedula}</p>
              </div>
              {selectedClient.dob && (
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">{new Date(selectedClient.dob).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Visitas Anuales</p>
                <p className="font-medium">{selectedClient.annualVisits}</p>
              </div>
              {selectedClient.address && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="font-medium">{selectedClient.address}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-2">Ubicación</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyGoogleMapsUrl(selectedClient.latitude, selectedClient.longitude)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar URL de Google Maps
                </Button>
              </div>

              {/* Audit Metadata */}
              {(selectedClient.createdBy || selectedClient.modifiedBy) && (
                <div className="col-span-2 pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Información de Auditoría</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedClient.createdBy && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Creado por:</p>
                          <p className="font-medium">{selectedClient.createdBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha de creación:</p>
                          <p className="font-medium">
                            {new Date(selectedClient.createdAt.seconds * 1000).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                    {selectedClient.modifiedBy && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Modificado por:</p>
                          <p className="font-medium">{selectedClient.modifiedBy}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Última modificación:</p>
                          <p className="font-medium">
                            {new Date(selectedClient.modifiedAt.seconds * 1000).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ID Card Images */}
            {(selectedClient.idFrontImageUrl || selectedClient.idBackImageUrl) && (
              <div className="space-y-3">
                <h3 className="font-semibold">Documentos de Identidad</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedClient.idFrontImageUrl && (
                    <div className="border rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Frontal</p>
                      <img
                        src={selectedClient.idFrontImageUrl}
                        alt="Cédula Frontal"
                        className="w-full rounded"
                      />
                    </div>
                  )}
                  {selectedClient.idBackImageUrl && (
                    <div className="border rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Reverso</p>
                      <img
                        src={selectedClient.idBackImageUrl}
                        alt="Cédula Reverso"
                        className="w-full rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
