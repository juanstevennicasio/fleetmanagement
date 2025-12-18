'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Users, UserPlus, Shield, Check, X, Pencil, Trash2, Save } from "lucide-react";
import { AuthService, PlatformUser } from '../services';
import { useAuth } from '../context/AuthContext';

const ALL_SECTIONS = [
    { id: 'dashboard', label: 'Panel Principal' },
    { id: 'routes', label: 'Rutas' },
    { id: 'clients', label: 'Clientes' },
    { id: 'messengers', label: 'Mensajeros' },
    { id: 'vehicles', label: 'Vehículos' },
    { id: 'alerts', label: 'Alertas' },
    { id: 'fuel', label: 'Combustible' },
    { id: 'reports', label: 'Reportes' },
    { id: 'gamification', label: 'Clasificación' },
    { id: 'medios', label: 'Medios' },
    { id: 'auditoria', label: 'Auditoría' },
    { id: 'calendar', label: 'Fechas Importantes' },
    { id: 'documents', label: 'Documentos' },
];

const ROLES = [
    { id: 'admin', label: 'Administrador' },
    { id: 'dispatcher', label: 'Despachador' },
    { id: 'hr', label: 'Recursos Humanos' },
    { id: 'accounting', label: 'Contabilidad' },
    { id: 'cashier', label: 'Caja' },
];

export default function UsersPage() {
    const { user: currentUser, updateUser } = useAuth();
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        role: 'dispatcher' as PlatformUser['role'],
        password: '',
        allowedSections: [] as string[]
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await AuthService.getPlatformUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSection = (sectionId: string) => {
        setFormData(prev => {
            const current = prev.allowedSections || [];
            if (current.includes(sectionId)) {
                return { ...prev, allowedSections: current.filter(id => id !== sectionId) };
            } else {
                return { ...prev, allowedSections: [...current, sectionId] };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUserId) {
                await AuthService.updatePlatformUser(editingUserId, {
                    name: formData.name,
                    role: formData.role,
                    allowedSections: formData.allowedSections
                }, formData.password || undefined);

                // Update current session if editing self
                if (editingUserId === currentUser?.username) {
                    updateUser({
                        name: formData.name,
                        role: formData.role,
                        allowedSections: formData.allowedSections
                    });
                }
            } else {
                await AuthService.createPlatformUser({
                    username: formData.username,
                    name: formData.name,
                    role: formData.role,
                    allowedSections: formData.allowedSections
                }, formData.password);
            }
            setIsEditing(false);
            setEditingUserId(null);
            setFormData({ username: '', name: '', role: 'dispatcher', password: '', allowedSections: [] });
            loadUsers();
        } catch (error: any) {
            alert(error.message || "Error al guardar el usuario");
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (user: PlatformUser) => {
        setEditingUserId(user.username);
        setFormData({
            username: user.username,
            name: user.name,
            role: user.role,
            password: '',
            allowedSections: user.allowedSections || []
        });
        setIsEditing(true);
    }

    const handleDelete = async (username: string) => {
        if (!confirm(`¿Estás seguro de eliminar al usuario ${username}?`)) return;
        setLoading(true);
        try {
            await AuthService.deletePlatformUser(username);
            loadUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            setLoading(false);
        }
    };

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl font-bold">No tienes permisos para acceder a esta sección.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Administra los accesos y roles de la plataforma.</p>
                </div>
                <Button
                    onClick={() => {
                        setIsEditing(true);
                        setEditingUserId(null);
                        setFormData({ username: '', name: '', role: 'dispatcher', password: '', allowedSections: [] });
                    }}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {isEditing && (
                <Card className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre de Usuario (ID)</label>
                                    <input
                                        type="text"
                                        disabled={!!editingUserId}
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-input bg-background disabled:opacity-50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-input bg-background"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Contraseña {editingUserId && '(Opcional para actualizar)'}</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-input bg-background"
                                        required={!editingUserId}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rol</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full p-2 rounded-lg border border-input bg-background"
                                        required
                                    >
                                        {ROLES.map(role => (
                                            <option key={role.id} value={role.id}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold">Secciones Permitidas</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {ALL_SECTIONS.map(section => {
                                        const isSelected = formData.allowedSections.includes(section.id);
                                        return (
                                            <div
                                                key={section.id}
                                                onClick={() => handleToggleSection(section.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                                    : 'bg-card border-border hover:border-primary/50 text-muted-foreground'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className="text-sm font-medium">{section.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    {editingUserId ? 'Actualizar Usuario' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => (
                    <Card key={u.username} className="group hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {u.name.charAt(0)}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(u)} className="p-2 hover:bg-muted rounded-full">
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    {u.username !== 'admin' && (
                                        <button onClick={() => handleDelete(u.username)} className="p-2 hover:bg-destructive/10 rounded-full">
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <CardTitle className="mt-4">{u.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">@{u.username}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {ROLES.find(r => r.id === u.role)?.label || u.role}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Acceso a:</p>
                                <div className="flex flex-wrap gap-1">
                                    {u.allowedSections?.length === 0 ? (
                                        <span className="text-xs text-muted-foreground italic">Sin accesos definidos</span>
                                    ) : u.allowedSections?.includes('all') ? (
                                        <span className="text-xs bg-primary/10 text-primary px-2 rounded">Todos los módulos</span>
                                    ) : (
                                        u.allowedSections?.map(sid => (
                                            <span key={sid} className="text-[10px] bg-secondary px-2 rounded text-secondary-foreground">
                                                {ALL_SECTIONS.find(s => s.id === sid)?.label || sid}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
