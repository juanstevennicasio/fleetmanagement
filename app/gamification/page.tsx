'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Trophy, Award, TrendingUp, Star, Settings2 } from "lucide-react";
import { GamificationService, Messenger } from '../services';
import { StorageService } from '../storage';
import RulesConfig from '@/components/gamification/RulesConfig';
import Button from '@/components/ui/Button';

export default function GamificationPage() {
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRulesConfig, setShowRulesConfig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const ranking = await GamificationService.getMessengerRanking();
      setMessengers(ranking);
    } catch (error) {
      console.error('Error loading messenger ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (index: number, points: number) => {
    // Simple trend logic - could be enhanced with historical data
    if (points > 500) return <TrendingUp className="w-5 h-5 text-success" />;
    if (points < 100) return <TrendingUp className="w-5 h-5 text-error rotate-180" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '⭐';
  };

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Clasificación y Logros</h1>
          <p className="text-muted-foreground">Gamificación y seguimiento de rendimiento</p>
        </div>
        <Button
          variant={showRulesConfig ? "primary" : "outline"}
          onClick={() => setShowRulesConfig(!showRulesConfig)}
        >
          <Settings2 className="w-4 h-4 mr-2" />
          {showRulesConfig ? 'Ver Clasificación' : 'Configurar Reglas'}
        </Button>
      </div>

      {showRulesConfig ? (
        <RulesConfig />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-warning" />
                  Clasificación Mensual
                </CardTitle>
                <CardDescription>Rankings de {new Date().toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</CardDescription>
              </CardHeader>
              <CardContent>
                {messengers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de clasificación aún</p>
                    <p className="text-sm mt-2">Completa rutas para comenzar a ganar puntos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messengers.map((messenger, index) => {
                      const rank = index + 1;
                      const points = messenger.points || 0;
                      return (
                        <div
                          key={messenger.id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-smooth ${rank <= 3 ? 'bg-gradient-to-r from-warning/10 to-transparent border border-warning/20' : 'bg-muted/50'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{getRankBadge(rank)}</span>
                            <div className="flex items-center gap-3">
                              {messenger.photoUrl ? (
                                <img
                                  src={messenger.photoUrl}
                                  alt={messenger.firstName}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                                  <span className="text-lg font-bold text-primary">
                                    {messenger.firstName[0]}{messenger.lastName[0]}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-lg">{messenger.firstName} {messenger.lastName}</p>
                                <p className="text-sm text-muted-foreground">Puesto #{rank}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{points}</p>
                              <p className="text-xs text-muted-foreground">puntos</p>
                            </div>
                            {getTrendIcon(index, points)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-accent" />
                  Estadísticas
                </CardTitle>
                <CardDescription>Resumen del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Total Mensajeros</p>
                    <p className="text-2xl font-bold text-primary">{messengers.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-xs text-muted-foreground mb-1">Puntos Totales</p>
                    <p className="text-2xl font-bold text-success">
                      {messengers.reduce((sum, m) => sum + (m.points || 0), 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-xs text-muted-foreground mb-1">Promedio de Puntos</p>
                    <p className="text-2xl font-bold text-warning">
                      {messengers.length > 0
                        ? Math.round(messengers.reduce((sum, m) => sum + (m.points || 0), 0) / messengers.length)
                        : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Points System Info */}
          <Card className="bg-accent/10 border-accent/30">
            <CardHeader>
              <CardTitle className="text-lg">Cómo Funcionan los Puntos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">⏱️ Basado en Tiempo</p>
                  <p className="text-muted-foreground">Gana puntos por entregas rápidas vs. promedio del cliente</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">⭐ Calificación de Estrellas</p>
                  <p className="text-muted-foreground">1-3 estrellas resta puntos, 4-5 estrellas suma puntos</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">🎯 Bonificación por Racha</p>
                  <p className="text-muted-foreground">Puntos extra por días consecutivos con 4+ estrellas</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-accent/30">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Consejo:</strong> Haz clic en "Configurar Reglas" para personalizar los valores de puntos y umbrales
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
