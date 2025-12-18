import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { CorporateDocument, DocumentCategory, DOCUMENT_TAXONOMY } from '../../lib/types';
import { CorporateDocumentService } from '../../app/services'; // Ensure proper import via services or lib

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // If editing/versioning, pass parentId or previous doc
  previousDoc?: CorporateDocument; 
}

export default function DocumentUploadModal({ isOpen, onClose, onSuccess, previousDoc }: DocumentUploadModalProps) {
  const [category, setCategory] = useState<DocumentCategory>('legal');
  const [type, setType] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [isTemplate, setIsTemplate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (previousDoc) {
        setCategory(previousDoc.category);
        setType(previousDoc.type);
        // Pre-fill dates? Maybe not for new version.
        setIssueDate(new Date().toISOString().split('T')[0]);
        setExpiryDate('');
      } else {
        setCategory('legal');
        setType(DOCUMENT_TAXONOMY['legal'][0]);
        setIssueDate(new Date().toISOString().split('T')[0]);
        setExpiryDate('');
        setFile(null);
      }
    }
  }, [isOpen, previousDoc]);

  // Update types when category changes
  useEffect(() => {
    if (!previousDoc) {
        const types = DOCUMENT_TAXONOMY[category];
        if (types && types.length > 0) {
            setType(types[0]);
        }
    }
  }, [category, previousDoc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file && !previousDoc) return; // Must have file for new doc

    setUploading(true);
    try {
        // Mock file upload - in real app, upload to storage first
        const mockFileUrl = file ? URL.createObjectURL(file) : (previousDoc?.fileUrl || '');
        
        await CorporateDocumentService.uploadDocument({
            name: type, // Default name to type, or add name input
            category,
            type,
            issueDate,
            expiryDate: expiryDate || undefined,
            fileUrl: mockFileUrl,
            parentId: previousDoc?.parentId, // If versioning
            isTemplate,
            alertEnabled
        });

        onSuccess();
        onClose();
    } catch (error) {
        console.error("Upload failed", error);
    } finally {
        setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={previousDoc ? "Nueva Versión de Documento" : "Cargar Nuevo Documento"}>
      <div className="space-y-4">
        {/* Category Selector */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <select 
                className="w-full p-2 border rounded-md bg-background"
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                disabled={!!previousDoc}
            >
                <option value="legal">Legal y Corporativo</option>
                <option value="fiscal">Fiscal (DGII)</option>
                <option value="laboral">Laboral (TSS/Min. Trabajo)</option>
                <option value="financiero">Financiero y Contable</option>
                <option value="compras">Compras y Contrataciones</option>
            </select>
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Documento</label>
            <select 
                className="w-full p-2 border rounded-md bg-background"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!!previousDoc}
            >
                {DOCUMENT_TAXONOMY[category].map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
            <label className="text-sm font-medium">Archivo</label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-center">
                    {file ? file.name : "Arrastra un archivo o haz clic para subir"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Imágenes o Word</p>
            </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Emisión</label>
                <input 
                    type="date" 
                    className="w-full p-2 border rounded-md bg-background"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Vencimiento (Opcional)</label>
                <input 
                    type="date" 
                    className="w-full p-2 border rounded-md bg-background"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                />
            </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2 pt-2">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                />
                <span className="text-sm">Activar alerta de vencimiento</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    className="rounded border-gray-300"
                />
                <span className="text-sm">Es una plantilla (requiere completado)</span>
            </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} isLoading={uploading} disabled={!file && !previousDoc}>
                {previousDoc ? 'Guardar Versión' : 'Cargar Documento'}
            </Button>
        </div>
      </div>
    </Modal>
  );
}
