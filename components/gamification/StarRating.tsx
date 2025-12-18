'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function StarRating({ rating, onChange, readonly = false, size = 'md', showLabel = false }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const getStarColor = (starNumber: number) => {
        const activeRating = hoverRating || rating;
        if (starNumber <= activeRating) {
            // Color based on rating
            if (activeRating <= 2) return 'text-error fill-error';
            if (activeRating === 3) return 'text-warning fill-warning';
            return 'text-success fill-success';
        }
        return 'text-muted-foreground';
    };

    const handleClick = (starNumber: number) => {
        if (!readonly && onChange) {
            onChange(starNumber);
        }
    };

    const getRatingLabel = () => {
        if (rating === 0) return 'Sin calificar';
        if (rating === 1) return 'Muy malo';
        if (rating === 2) return 'Malo';
        if (rating === 3) return 'Regular';
        if (rating === 4) return 'Bueno';
        if (rating === 5) return 'Excelente';
        return '';
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((starNumber) => (
                    <button
                        key={starNumber}
                        type="button"
                        onClick={() => handleClick(starNumber)}
                        onMouseEnter={() => !readonly && setHoverRating(starNumber)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        disabled={readonly}
                        className={`transition-all ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    >
                        <Star className={`${sizeClasses[size]} ${getStarColor(starNumber)} transition-colors`} />
                    </button>
                ))}
            </div>
            {showLabel && (
                <span className={`text-xs font-medium ${rating <= 2 ? 'text-error' : rating === 3 ? 'text-warning' : rating >= 4 ? 'text-success' : 'text-muted-foreground'
                    }`}>
                    {getRatingLabel()}
                </span>
            )}
        </div>
    );
}
