
import React from 'react';
import { StarIcon } from './icons';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  size?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 'h-6 w-6' }) => {
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating && setRating(star)}
          className={`cursor-${setRating ? 'pointer' : 'default'} transition-transform duration-200 ${setRating ? 'hover:scale-125' : ''}`}
          aria-label={`تقييم ${star} من 5`}
        >
          <StarIcon
            className={`${size} ${rating >= star ? 'text-gold' : 'text-gray-300'}`}
            filled={rating >= star}
          />
        </button>
      ))}
    </div>
  );
};
