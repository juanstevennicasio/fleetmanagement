'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, FileText, Filter, AlertTriangle, Download, History } from "lucide-react";
import { CorporateDocument, DocumentCategory } from '../../lib/types';
import { CorporateDocumentService } from '../services';
import DocumentUploadModal from "@/components/documents/DocumentUploadModal";
import StatusBadge from "@/components/documents/StatusBadge";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<CorporateDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<DocumentCategory | 'all'>('all');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<CorporateDocument | undefined>(undefined);
    const [alertCount, setAlertCount] = useState(0);

    const categories: { id: DocumentCategory | 'all', label: string }[] = [
        { id: 'all', label: 'Todos' },
        { id: 'legal', label: 'Legal' },
        { id: 'fiscal', label: 'Fiscal' },
        { id: 'laboral', label: 'Laboral' },
        { id: 'financiero', label: 'Financiero' },
        { id: 'compras', label: 'Compras' },
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const docs = await CorporateDocumentService.getDocuments(activeTab === 'all' ? undefined : activeTab);
            setDocuments(docs);
            
            // Check alerts
            const alerts = docs.filter(d => d.calculatedStatus === 'por_vencer' || d.calculatedStatus === 'vencido');
            setAlertCount(alerts.length);
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleUploadClick = () => {
        setSelectedDoc(undefined);
        setIsUploadModalOpen(true);
    };

    const handleVersionClick = (doc: CorporateDocument) => {
        setSelectedDoc(doc);
        setIsUploadModalOpen(true);
    };

    return (
        <div className="space-y-8 p-8 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documentos Corporativos</h1>
                    <p className="text-muted-foreground">Gestión centralizada de documentación legal y fiscal.</p>
                </div>
                <div className="flex gap-2">
                    {alertCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">{alertCount} alertas de vencimiento</span>
                        </div>
                    )}
                    <Button onClick={handleUploadClick}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Documento
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-6">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === cat.id 
                                ? 'border-primary text-primary' 
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Document List */}
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Documentos</CardTitle>
                    <CardDescription>
                        Mostrando {documents.length} documentos {activeTab !== 'all' ? `de ${activeTab}` : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando documentos...</div>
                    ) : documents.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed rounded-lg">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium">No hay documentos</h3>
                            <p className="text-muted-foreground mb-4">No se han encontrado documentos en esta categoría.</p>
                            <Button variant="outline" onClick={handleUploadClick}>Subir el primero</Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left border-b">
                                        <th className="h-10 px-4 font-medium text-muted-foreground">Nombre / Tipo</th>
                                        <th className="h-10 px-4 font-medium text-muted-foreground">Versión</th>
                                        <th className="h-10 px-4 font-medium text-muted-foreground">Emisión</th>
                                        <th className="h-10 px-4 font-medium text-muted-foreground">Vencimiento</th>
                                        <th className="h-10 px-4 font-medium text-muted-foreground">Estado</th>
                                        <th className="h-10 px-4 font-medium text-muted-foreground text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="border-b hover:bg-muted/50 transition-colors">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-700 rounded">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{doc.type}</div>
                                                        <div className="text-xs text-muted-foreground capitalize">{doc.category}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                    v{doc.version}.0
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">{new Date(doc.issueDate).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle">
                                                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <StatusBadge status={doc.calculatedStatus || 'vigente'} daysRemaining={doc.daysUntilExpiry} />
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    {doc.isTemplate && (
                                                        <Button variant="outline" size="sm" onClick={() => alert("Completar plantilla...")}>
                                                            Completar
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" title="Nueva Versión" onClick={() => handleVersionClick(doc)}>
                                                        <History className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" title="Descargar">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DocumentUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={loadData}
                previousDoc={selectedDoc}
            />
        </div>
    );
}
