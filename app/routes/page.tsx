'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, Copy, Save, Archive, X } from "lucide-react";
import { DispatchService, ResourceService, ClientService, Client, Messenger, Vehicle, GamificationService, RouteService } from '../services';
import { StorageService } from '../storage';
import { useAuth } from '../context/AuthContext';
import StarRating from '@/components/gamification/StarRating';

interface RouteStop {
  id: string;
  clientId: string;
}

interface RouteCard {
  id: string;
  stops: RouteStop[]; // Multiple stops instead of single clientId
  messengerId: string;
  vehicleId: string;
  departureTime: Date | null;
  arrivalTime: Date | null;
  note: string;
  isRunning: boolean;
  starRating: number; // 0-5, 0 means not rated yet
}

export default function RoutesPage() {
  const { user } = useAuth();
  const [routeCards, setRouteCards] = useState<RouteCard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimes, setCurrentTimes] = useState<Map<string, number>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [clientSearchTerms, setClientSearchTerms] = useState<Map<string, string>>(new Map()); // Search terms per stop

  useEffect(() => {
    loadData();
  }, []);

  // Save to localStorage whenever cards change (Auto-save)
  useEffect(() => {
    if (isLoaded) {
      StorageService.setActiveDashboardCards(routeCards);
    }
  }, [routeCards, isLoaded]);

  // Update chronometers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes = new Map<string, number>();
      routeCards.forEach(card => {
        if (card.isRunning && card.departureTime && !card.arrivalTime) {
          const elapsed = Date.now() - card.departureTime.getTime();
          newTimes.set(card.id, elapsed);
        } else if (card.departureTime && card.arrivalTime) {
          const elapsed = card.arrivalTime.getTime() - card.departureTime.getTime();
          newTimes.set(card.id, elapsed);
        }
      });
      setCurrentTimes(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [routeCards]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientData, messengerData, vehicleData] = await Promise.all([
        ClientService.getAllClients(),
        ResourceService.getAvailableMessengers(),
        ResourceService.getAvailableVehicles()
      ]);
      setClients(clientData);
      setMessengers(messengerData);
      setVehicles(vehicleData);

      // Load active cards from storage
      const savedCards = StorageService.getActiveDashboardCards() as any[];
      if (savedCards && savedCards.length > 0) {
        // Re-hydrate Date objects and ensure stops array exists
        const hydratedCards = savedCards.map(card => ({
          ...card,
          departureTime: card.departureTime ? new Date(card.departureTime) : null,
          arrivalTime: card.arrivalTime ? new Date(card.arrivalTime) : null,
          starRating: card.starRating || 0,
          stops: card.stops || [] // Ensure stops array exists for backward compatibility
        }));
        setRouteCards(hydratedCards);
      } else {
        addNewRouteCard(); // Add initial card if empty
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const addNewRouteCard = () => {
    const newCard: RouteCard = {
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stops: [],
      messengerId: '',
      vehicleId: '',
      departureTime: null,
      arrivalTime: null,
      note: '',
      isRunning: false,
      starRating: 0
    };
    setRouteCards(prev => [...prev, newCard]);
  };

  // Get available messengers (excluding those already in active routes)
  const getAvailableMessengers = () => {
    const busyMessengerIds = routeCards
      .filter(card => card.departureTime && !card.arrivalTime) // Active routes only
      .map(card => card.messengerId)
      .filter(id => id); // Remove empty IDs

    return messengers.filter(m => !busyMessengerIds.includes(m.id!));
  };

  const removeCard = (id: string) => {
    setRouteCards(cards => cards.filter(c => c.id !== id));
  };

  const updateCard = (id: string, updates: Partial<RouteCard>) => {
    setRouteCards(cards => cards.map(card =>
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const addStop = (cardId: string) => {
    const card = routeCards.find(c => c.id === cardId);
    if (card && card.stops.length < 10) {
      const newStop: RouteStop = {
        id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientId: ''
      };
      updateCard(cardId, { stops: [...card.stops, newStop] });
    }
  };

  const removeStop = (cardId: string, stopId: string) => {
    const card = routeCards.find(c => c.id === cardId);
    if (card) {
      updateCard(cardId, { stops: card.stops.filter(s => s.id !== stopId) });
    }
  };

  const updateStop = (cardId: string, stopId: string, clientId: string) => {
    const card = routeCards.find(c => c.id === cardId);
    if (card) {
      const updatedStops = card.stops.map(stop =>
        stop.id === stopId ? { ...stop, clientId } : stop
      );
      updateCard(cardId, { stops: updatedStops });
    }
  };

  const markDeparture = (id: string) => {
    updateCard(id, {
      departureTime: new Date(),
      isRunning: true
    });
  };

  const markArrival = async (id: string) => {
    const card = routeCards.find(c => c.id === id);
    if (!card || !card.departureTime || card.stops.length === 0) return;

    const arrivalTime = new Date();
    const durationMs = arrivalTime.getTime() - card.departureTime.getTime();
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    // Use default 3-star rating if not rated
    const effectiveRating = card.starRating || 3;

    // Update local state first
    updateCard(id, {
      arrivalTime,
      isRunning: false,
      starRating: effectiveRating // Set default if not already rated
    });

    // Distribute time equitably among stops
    const timePerStop = Math.round(durationMinutes / card.stops.length);
    let totalPoints = 0;

    try {
      const messenger = messengers.find(m => m.id === card.messengerId);
      const vehicle = vehicles.find(v => v.id === card.vehicleId);

      // Calculate points for each stop
      for (const stop of card.stops) {
        if (!stop.clientId) continue;

        const points = await GamificationService.calculateRoutePoints(
          timePerStop,
          effectiveRating,
          stop.clientId
        );

        totalPoints += points;

        // Get client name
        const client = clients.find(c => c.id === stop.clientId);

        // Save to route history for each stop
        await RouteService.saveRouteHistory({
          messengerId: card.messengerId,
          messengerName: messenger ? `${messenger.firstName} ${messenger.lastName}` : 'Unknown',
          vehicleId: card.vehicleId,
          vehicleCode: vehicle?.code || 'Unknown',
          clientId: stop.clientId,
          clientName: client?.locationName || 'Unknown',
          startTime: card.departureTime.toISOString(),
          endTime: arrivalTime.toISOString(),
          duration: timePerStop,
          starRating: effectiveRating,
          note: card.note,
          pointsEarned: points,
          completedBy: user?.username || 'system',
          completedAt: new Date().toISOString()
        });
      }

      // Update messenger points with total
      await GamificationService.updateMessengerPoints(card.messengerId, totalPoints);

      // Check for streak bonus
      const streakBonus = await GamificationService.checkStreakBonus(card.messengerId);
      if (streakBonus > 0) {
        await GamificationService.updateMessengerPoints(card.messengerId, streakBonus);
        alert(`¡Bonificación de racha! +${streakBonus} puntos adicionales`);
      }

      // Show points earned
      if (totalPoints !== 0) {
        const ratingMsg = card.starRating === 0 ? ' (calificación por defecto: 3★)' : '';
        alert(`Ruta completada. ${totalPoints > 0 ? '+' : ''}${totalPoints} puntos (${card.stops.length} paradas, ${timePerStop} min c/u)${ratingMsg}`);
      }
    } catch (e) {
      console.error("Failed to save route history and calculate points", e);
    }
  };

  const copyLocation = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const url = `https://www.google.com/maps?q=${client.latitude},${client.longitude}`;
      navigator.clipboard.writeText(url);
      alert('¡Ubicación copiada!');
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '--:-- --';
    return date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessengerVehicles = (messengerId: string): Vehicle[] => {
    const messenger = messengers.find(m => m.id === messengerId);
    if (!messenger || !messenger.assignedVehicles) return [];
    return vehicles.filter(v => messenger.assignedVehicles.includes(v.id!));
  };

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Monitor de Despacho</h1>
          <p className="text-muted-foreground">Control de rutas en tiempo real</p>
        </div>
        <Button variant="primary" onClick={addNewRouteCard}>
          <Plus className="w-4 h-4" />
          Nueva Ruta
        </Button>
      </div>

      {/* Route Cards */}
      <div className="space-y-4">
        {routeCards.map((card) => {
          const messenger = messengers.find(m => m.id === card.messengerId);
          const vehicle = vehicles.find(v => v.id === card.vehicleId);
          const messengerVehicles = card.messengerId ? getMessengerVehicles(card.messengerId) : [];
          const duration = currentTimes.get(card.id) || 0;
          const isCompleted = !!card.arrivalTime;

          return (
            <Card key={card.id} className={`border-2 ${isCompleted ? 'bg-muted/30 border-green-200' : ''}`}>
              <CardContent className="p-6">
                {/* Main Row */}
                <div className="grid grid-cols-6 gap-3 items-start mb-4">
                  {/* Stops Section - Takes 2 columns */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Paradas ({card.stops.length}/10)</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addStop(card.id)}
                        disabled={card.stops.length >= 10 || card.isRunning || isCompleted}
                        className="h-6 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-background">
                      {card.stops.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Sin paradas. Haz clic en "Agregar"
                        </p>
                      ) : (
                        card.stops.map((stop, index) => (
                          <div key={stop.id} className="flex gap-1 items-center">
                            <span className="text-xs font-bold text-muted-foreground w-4">{index + 1}.</span>
                            <select
                              value={stop.clientId}
                              onChange={(e) => updateStop(card.id, stop.id, e.target.value)}
                              className="flex-1 p-1 rounded text-xs border border-input"
                              disabled={card.isRunning || isCompleted}
                            >
                              <option value="">Seleccionar...</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.locationName}</option>
                              ))}
                            </select>
                            {!card.isRunning && !isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStop(card.id, stop.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messenger */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mensajero</p>
                    <div className="flex gap-2 items-center">
                      {/* Messenger Photo */}
                      {messenger?.photoUrl && (
                        <img
                          src={messenger.photoUrl}
                          alt={messenger.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <select
                        value={card.messengerId}
                        onChange={(e) => updateCard(card.id, { messengerId: e.target.value, vehicleId: '' })}
                        className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
                        disabled={card.isRunning || isCompleted}
                      >
                        <option value="">N/A</option>
                        {getAvailableMessengers().map(m => (
                          <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Vehículo</p>
                    <select
                      value={card.vehicleId}
                      onChange={(e) => updateCard(card.id, { vehicleId: e.target.value })}
                      className="w-full p-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
                      disabled={!card.messengerId || card.isRunning || isCompleted}
                    >
                      <option value="">Seleccionar...</option>
                      {messengerVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.code}</option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Time */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Salida</p>
                    {card.departureTime ? (
                      <div className="text-sm font-semibold p-2 bg-muted rounded-lg text-center">
                        {formatTime(card.departureTime)}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markDeparture(card.id)}
                        disabled={card.stops.length === 0 || !card.stops.some(s => s.clientId) || !card.messengerId || !card.vehicleId}
                        className="w-full"
                      >
                        Marcar hora
                      </Button>
                    )}
                  </div>

                  {/* Arrival Time */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Llegada</p>
                    {card.arrivalTime ? (
                      <div className="text-sm font-semibold p-2 bg-green-100 text-green-700 rounded-lg text-center border border-green-200">
                        {formatTime(card.arrivalTime)}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markArrival(card.id)}
                        disabled={!card.departureTime}
                        className="w-full"
                      >
                        Marcar hora
                      </Button>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duración</p>
                    <div className="text-sm font-bold font-mono p-2 bg-muted rounded-lg text-center">
                      {formatDuration(duration)}
                    </div>
                  </div>
                </div>

                {/* Notes Section and Action */}
                <div className="space-y-3">
                  {/* Notes */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Nota de envío (siempre editable y salvable)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={card.note}
                        onChange={(e) => updateCard(card.id, { note: e.target.value })}
                        className="flex-1 p-2 rounded-lg border border-input bg-background text-sm"
                        placeholder="Agregar nota de envío..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alert(`Nota guardada: ${card.note}`)}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Star Rating */}
                  {card.departureTime && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Calificación de Desempeño</p>
                        <p className="text-xs text-muted-foreground">
                          {isCompleted ? 'Calificación final' : 'Califica antes de marcar llegada'}
                        </p>
                      </div>
                      <StarRating
                        rating={card.starRating}
                        onChange={(rating) => updateCard(card.id, { starRating: rating })}
                        readonly={isCompleted}
                        size="lg"
                        showLabel
                      />
                    </div>
                  )}

                  {/* Archive Button */}
                  {isCompleted && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeCard(card.id)}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archivar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
