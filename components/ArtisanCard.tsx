import React from 'react';
import type { Artisan } from '../types';
import { StarRating } from './StarRating';
import { BriefcaseIcon, LocationIcon, StarIcon } from './icons';
import { DEFAULT_ARTISAN_IMAGE_BASE64 } from '../constants';

interface ArtisanCardProps {
  artisan: Artisan;
  onClick: () => void;
}

const getAverageRating = (artisan: Artisan): number => {
    if (artisan.reviews.length === 0) return 0;

    let totalRating = 0;
    let ratingCount = 0;

    artisan.reviews.forEach(review => {
        const { quality, punctuality, price, communication } = review.ratings;
        totalRating += quality + punctuality + price + communication;
        ratingCount += 4;
    });

    return ratingCount > 0 ? totalRating / ratingCount : 0;
};


export const ArtisanCard: React.FC<ArtisanCardProps> = ({ artisan, onClick }) => {
  const averageRating = getAverageRating(artisan);
  
  return (
    <div
      onClick={onClick}
      className="bg-navy rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 group"
    >
      <img
        src={artisan.gallery[0] || DEFAULT_ARTISAN_IMAGE_BASE64}
        alt={`صورة لـ ${artisan.name}`}
        className="w-full h-48 object-cover bg-slate/10"
      />
      <div className="p-5">
        <h3 className="text-2xl font-bold text-ivory">{artisan.name}</h3>
        <div className="flex items-center gap-2 mt-2 text-gold">
          <BriefcaseIcon className="h-5 w-5" />
          <p className="text-lg">{artisan.trade}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-slate">
                <LocationIcon className="h-5 w-5 text-ivory/70"/>
                <span className="text-ivory/70">{artisan.city}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gold font-bold text-lg">{averageRating.toFixed(1)}</span>
                <StarIcon className="h-5 w-5 text-gold" filled />
            </div>
        </div>
      </div>
    </div>
  );
};
