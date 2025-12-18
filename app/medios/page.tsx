'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Image, Trash2, Eye, FileText, RefreshCw, Filter } from "lucide-react";
import { MediaService, MediaFile } from '../services';
import { useAuth } from '../context/AuthContext';

export default function MediaLibraryPage() {
    const { user } = useAuth();
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadMedia();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [media, filterType, filterEntity, searchTerm]);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const data = await MediaService.getAllMedia();
            setMedia(data);
        } catch (error) {
            console.error("Error loading media:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...media];

        if (filterType !== 'all') {
            filtered = filtered.filter(m => m.fileType === filterType);
        }

        if (filterEntity !== 'all') {
            filtered = filtered.filter(m => m.entityType === filterEntity);
        }

        if (searchTerm) {
            filtered = filtered.filter(m =>
                m.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.entityName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredMedia(filtered);
    };

    const handleDelete = async (mediaId: string) => {
        if (!user || !confirm('¿Está seguro de eliminar este archivo?')) return;

        try {
            await MediaService.deleteMedia(mediaId, user.username);
            await loadMedia();
        } catch (error) {
            console.error("Error deleting media:", error);
        }
    };

    const viewMedia = (mediaFile: MediaFile) => {
        setSelectedMedia(mediaFile);
        setIsViewModalOpen(true);
    };

    const getFileTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            registration: 'Matrícula',
            insurance: 'Póliza de Seguro',
            license: 'Licencia',
            other: 'Otro'
        };
        return labels[type] || type;
    };

    const getEntityTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            vehicle: 'Vehículo',
            messenger: 'Mensajero',
            client: 'Cliente'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Biblioteca de Medios</h1>
                    <p className="text-muted-foreground">Gestión centralizada de documentos e imágenes</p>
                </div>
                <Button variant="outline" onClick={loadMedia} isLoading={loading}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                                placeholder="Nombre de archivo o entidad..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Documento</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                            >
                                <option value="all">Todos</option>
                                <option value="registration">Matrícula</option>
                                <option value="insurance">Póliza de Seguro</option>
                                <option value="license">Licencia</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Entidad</label>
                            <select
                                value={filterEntity}
                                onChange={(e) => setFilterEntity(e.target.value)}
                                className="w-full p-2 rounded-lg border border-input bg-background"
                            >
                                <option value="all">Todos</option>
                                <option value="vehicle">Vehículos</option>
                                <option value="messenger">Mensajeros</option>
                                <option value="client">Clientes</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{media.length}</p>
                            <p className="text-sm text-muted-foreground">Total Archivos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-success">{media.filter(m => m.entityType === 'vehicle').length}</p>
                            <p className="text-sm text-muted-foreground">Vehículos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-secondary">{media.filter(m => m.entityType === 'messenger').length}</p>
                            <p className="text-sm text-muted-foreground">Mensajeros</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-warning">{media.filter(m => m.entityType === 'client').length}</p>
                            <p className="text-sm text-muted-foreground">Clientes</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="text-center py-10">Cargando medios...</div>
            ) : filteredMedia.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron archivos</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMedia.map((mediaFile) => (
                        <Card key={mediaFile.id} hover>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <CardTitle className="text-sm truncate">{getFileTypeLabel(mediaFile.fileType)}</CardTitle>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                        {getEntityTypeLabel(mediaFile.entityType)}
                                    </span>
                                </div>
                                <CardDescription className="text-xs truncate">{mediaFile.entityName}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img
                                        src={mediaFile.fileUrl}
                                        alt={mediaFile.fileName}
                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => viewMedia(mediaFile)}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <p className="truncate">{mediaFile.fileName}</p>
                                    <p>Por: {mediaFile.uploadedBy}</p>
                                    <p>{new Date(mediaFile.uploadedAt.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => viewMedia(mediaFile)}>
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(mediaFile.id!)}>
                                        <Trash2 className="w-4 h-4 text-error" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedMedia?.fileName || 'Vista Previa'}
            >
                {selectedMedia && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Tipo de Documento</p>
                                <p className="font-medium">{getFileTypeLabel(selectedMedia.fileType)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Entidad</p>
                                <p className="font-medium">{getEntityTypeLabel(selectedMedia.entityType)}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Nombre de Entidad</p>
                                <p className="font-medium">{selectedMedia.entityName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Subido por</p>
                                <p className="font-medium">{selectedMedia.uploadedBy}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fecha</p>
                                <p className="font-medium">{new Date(selectedMedia.uploadedAt.seconds * 1000).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <img
                                src={selectedMedia.fileUrl}
                                alt={selectedMedia.fileName}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
