'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { GamificationService, Messenger, EvaluationQuestion , RouteService } from '@/app/services';
import StarRating from '@/components/gamification/StarRating';
import { ClipboardCheck } from 'lucide-react';

interface EvaluationFormProps {
    messenger: Messenger;
    isOpen: boolean;
    onClose: () => void;
    evaluatedBy: string;
}

export default function EvaluationForm({ messenger, isOpen, onClose, evaluatedBy }: EvaluationFormProps) {
    const defaultQuestions = RouteService.getDefaultEvaluationQuestions();
    const [questions, setQuestions] = useState<EvaluationQuestion[]>(
        defaultQuestions.map(q => ({ ...q, rating: 0 }))
    );
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const updateRating = (questionId: string, rating: number) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, rating } : q
        ));
    };

    const calculateTotalScore = () => {
        const totalRating = questions.reduce((sum, q) => sum + q.rating, 0);
        return questions.length > 0 ? (totalRating / questions.length).toFixed(1) : '0.0';
    };

    const handleSubmit = async () => {
        // Validate all questions are answered
        const unanswered = questions.filter(q => q.rating === 0);
        if (unanswered.length > 0) {
            alert('Por favor califica todas las preguntas antes de enviar');
            return;
        }

        setSaving(true);
        try {
            await RouteService.saveEvaluation({
                messengerId: messenger.id!,
                messengerName: `${messenger.firstName} ${messenger.lastName}`,
                evaluatedBy,
                evaluatedAt: new Date().toISOString(),
                questions,
                totalScore: parseFloat(calculateTotalScore()),
                notes: notes.trim() || undefined
            });

            alert('Evaluación guardada exitosamente');
            onClose();

            // Reset form
            setQuestions(defaultQuestions.map(q => ({ ...q, rating: 0 })));
            setNotes('');
        } catch (error) {
            console.error('Error saving evaluation:', error);
            alert('Error al guardar la evaluación');
        } finally {
            setSaving(false);
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            punctuality: 'Puntualidad',
            customer_service: 'Servicio al Cliente',
            vehicle_care: 'Cuidado del Vehículo',
            communication: 'Comunicación',
            professionalism: 'Profesionalismo',
            safety: 'Seguridad',
            reliability: 'Confiabilidad',
            problem_solving: 'Resolución de Problemas'
        };
        return labels[category] || category;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            punctuality: '⏰',
            customer_service: '😊',
            vehicle_care: '🚗',
            communication: '💬',
            professionalism: '👔',
            safety: '🛡️',
            reliability: '✅',
            problem_solving: '🧩'
        };
        return icons[category] || '📋';
    };

    const totalScore = calculateTotalScore();
    const scoreColor = parseFloat(totalScore) >= 4 ? 'text-success' :
        parseFloat(totalScore) >= 3 ? 'text-warning' : 'text-error';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Evaluar Desempeño: ${messenger.firstName} ${messenger.lastName}`}
        >
            <div className="flex flex-col max-h-[85vh]">
                {/* Header with Score */}
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {messenger.photoUrl ? (
                                <img
                                    src={messenger.photoUrl}
                                    alt={messenger.firstName}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                                    <span className="text-2xl font-bold text-primary">
                                        {messenger.firstName[0]}{messenger.lastName[0]}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg">{messenger.firstName} {messenger.lastName}</h3>
                                <p className="text-sm text-muted-foreground">Cédula: {messenger.cedula}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Puntuación Total</p>
                            <p className={`text-4xl font-bold ${scoreColor}`}>{totalScore}</p>
                            <p className="text-xs text-muted-foreground">de 5.0</p>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold">Criterios de Evaluación</h4>
                    </div>

                    {questions.map((question) => (
                        <div
                            key={question.id}
                            className="p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{getCategoryIcon(question.category)}</span>
                                        <div>
                                            <p className="font-medium">{question.question}</p>
                                            <p className="text-xs text-muted-foreground">{getCategoryLabel(question.category)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <StarRating
                                        rating={question.rating}
                                        onChange={(rating) => updateRating(question.id, rating)}
                                        size="md"
                                        showLabel
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notas Adicionales (Opcional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-3 rounded-lg border border-input bg-background"
                            placeholder="Agrega comentarios adicionales sobre el desempeño del mensajero..."
                            rows={4}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={saving}
                        disabled={questions.some(q => q.rating === 0)}
                    >
                        Guardar Evaluación
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
