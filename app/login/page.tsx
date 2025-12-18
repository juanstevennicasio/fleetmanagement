'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Lock, User, AlertTriangle } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    useEffect(() => {
        // Attempt to seed admin on load if DB is empty
        AuthService.seedAdmin();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await AuthService.login(username, password);
            if (user) {
                login(user);
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">LogiTrack Enterprise</CardTitle>
                    <CardDescription>Acceso Seguro a la Plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-error/10 text-error text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Usuario</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="••••"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                            Iniciar Sesión
                        </Button>

                        <div className="text-center text-xs text-muted-foreground mt-4">
                            <p>Acceso de Emergencia: admin / 1234</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
