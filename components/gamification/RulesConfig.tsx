'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Settings, RotateCcw, Save, Check, X } from "lucide-react";
import { GamificationService, GamificationRule } from '@/app/services';

export default function RulesConfig() {
    const [rules, setRules] = useState<GamificationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        try {
            const rulesData = await GamificationService.getRules();
            setRules(rulesData);
        } catch (error) {
            console.error('Error loading rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateRule = (ruleId: string, updates: Partial<GamificationRule>) => {
        setRules(prev => prev.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
        ));
        setHasChanges(true);
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            for (const rule of rules) {
                await GamificationService.updateRule(rule.id, rule);
            }
            setHasChanges(false);
            alert('Reglas guardadas exitosamente');
        } catch (error) {
            console.error('Error saving rules:', error);
            alert('Error al guardar las reglas');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = async () => {
        if (confirm('¿Estás seguro de que quieres restablecer las reglas a los valores predeterminados?')) {
            try {
                await GamificationService.resetRulesToDefault();
                await loadRules();
                setHasChanges(false);
                alert('Reglas restablecidas a valores predeterminados');
            } catch (error) {
                console.error('Error resetting rules:', error);
                alert('Error al restablecer las reglas');
            }
        }
    };

    const getRuleTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            time_based: 'Basado en Tiempo',
            star_rating: 'Calificación de Estrellas',
            volume: 'Volumen',
            streak: 'Racha',
            custom: 'Personalizado'
        };
        return labels[type] || type;
    };

    if (loading) {
        return <div className="text-center py-10">Cargando reglas...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-6 h-6 text-primary" />
                            Configuración de Reglas
                        </CardTitle>
                        <CardDescription>
                            Personaliza las reglas de puntuación para el sistema de gamificación
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetToDefaults}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restablecer
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={saveChanges}
                            disabled={!hasChanges}
                            isLoading={saving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {rules.map((rule) => (
                        <div
                            key={rule.id}
                            className={`p-4 rounded-lg border transition-all ${rule.enabled ? 'bg-background border-border' : 'bg-muted/50 border-muted opacity-60'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Enable/Disable Toggle */}
                                <button
                                    onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                                    className={`mt-1 w-12 h-6 rounded-full transition-colors relative ${rule.enabled ? 'bg-success' : 'bg-muted-foreground'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>

                                {/* Rule Details */}
                                <div className="flex-1 space-y-3">
                                    {/* Header */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg">{rule.name}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                                {getRuleTypeLabel(rule.type)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                                    </div>

                                    {/* Configuration */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Points Awarded */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Puntos Otorgados
                                            </label>
                                            <input
                                                type="number"
                                                value={rule.pointsAwarded}
                                                onChange={(e) => updateRule(rule.id, { pointsAwarded: parseInt(e.target.value) || 0 })}
                                                disabled={!rule.enabled}
                                                className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                                                min="0"
                                            />
                                        </div>

                                        {/* Points Deducted */}
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Puntos Deducidos
                                            </label>
                                            <input
                                                type="number"
                                                value={rule.pointsDeducted}
                                                onChange={(e) => updateRule(rule.id, { pointsDeducted: parseInt(e.target.value) || 0 })}
                                                disabled={!rule.enabled}
                                                className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                                                min="0"
                                            />
                                        </div>

                                        {/* Threshold (if applicable) */}
                                        {rule.threshold !== undefined && (
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    {rule.type === 'time_based' ? 'Umbral (%)' :
                                                        rule.type === 'streak' ? 'Días Consecutivos' :
                                                            'Umbral'}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={Math.abs(rule.threshold)}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        // Keep the sign for time-based rules
                                                        const signedValue = rule.type === 'time_based' && rule.id.includes('slow')
                                                            ? -value
                                                            : value;
                                                        updateRule(rule.id, { threshold: signedValue });
                                                    }}
                                                    disabled={!rule.enabled}
                                                    className="w-full p-2 rounded-lg border border-input bg-background text-sm"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Visual Indicator */}
                                    <div className="flex items-center gap-2 text-sm">
                                        {rule.enabled ? (
                                            <>
                                                <Check className="w-4 h-4 text-success" />
                                                <span className="text-success font-medium">Activa</span>
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Desactivada</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <h4 className="font-semibold text-sm mb-2">ℹ️ Información</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Las reglas desactivadas no se aplicarán al calcular puntos</li>
                        <li>• Los cambios se aplicarán a todas las rutas futuras</li>
                        <li>• Las rutas completadas anteriormente mantienen sus puntos originales</li>
                        <li>• El umbral de tiempo se basa en el promedio histórico por cliente</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
