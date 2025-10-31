import React, { useState, useCallback } from 'react';
import type { Artisan, Review } from '../types';
import { StarRating } from './StarRating';
// FIX: Removed unused `UserIcon` import which is not exported from './icons`.
import { ChevronRightIcon, ChevronLeftIcon, CloseIcon, BriefcaseIcon, LocationIcon, PhoneIcon } from './icons';
import { DEFAULT_ARTISAN_IMAGE_BASE64 } from '../constants';

interface ArtisanProfileModalProps {
  artisan: Artisan | null;
  onClose: () => void;
  onAddReview: (artisanId: string, review: Omit<Review, 'id' | 'date'>) => void;
}

// Define component outside to prevent re-creation on re-renders
const ReviewForm: React.FC<{ artisanId: string, onAddReview: (artisanId: string, review: Omit<Review, 'id'|'date'>) => void }> = ({ artisanId, onAddReview }) => {
    const [newReviewer, setNewReviewer] = useState('');
    const [newRatings, setNewRatings] = useState({ quality: 0, punctuality: 0, price: 0, communication: 0 });
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    
    const handleRatingChange = (criterion: keyof typeof newRatings, value: number) => {
        setNewRatings(prev => ({ ...prev, [criterion]: value }));
    };

    const handleAddReview = () => {
        if (!newReviewer || !newComment || Object.values(newRatings).some(r => r === 0)) {
            setError('الرجاء تعبئة جميع الحقول وتقديم تقييم لجميع المعايير.');
            return;
        }
        setError('');
        onAddReview(artisanId, {
            author: newReviewer,
            ratings: newRatings,
            comment: newComment,
        });
        setNewReviewer('');
        setNewRatings({ quality: 0, punctuality: 0, price: 0, communication: 0 });
        setNewComment('');
    };

    const ratingCriteria: { key: keyof typeof newRatings; label: string }[] = [
        { key: 'quality', label: 'جودة العمل' },
        { key: 'punctuality', label: 'الالتزام بالوقت' },
        { key: 'price', label: 'السعر مقابل الخدمة' },
        { key: 'communication', label: 'التواصل والتعامل' },
    ];

    return (
        <div className="mt-8 pt-6 border-t border-navy/20">
            <h4 className="text-xl font-bold text-navy mb-4">أضف مراجعتك</h4>
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</p>}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="اسمك"
                    value={newReviewer}
                    onChange={(e) => setNewReviewer(e.target.value)}
                    className="w-full p-3 bg-ivory border border-navy/20 rounded-lg text-navy placeholder-slate focus:ring-2 focus:ring-gold focus:outline-none"
                />
                <div className="space-y-3">
                    {ratingCriteria.map(criterion => (
                         <div key={criterion.key} className="flex items-center justify-between gap-4">
                             <p className="text-slate">{criterion.label}:</p>
                             <StarRating rating={newRatings[criterion.key]} setRating={(r) => handleRatingChange(criterion.key, r)} size="h-7 w-7" />
                        </div>
                    ))}
                </div>
                <textarea
                    placeholder="اكتب تعليقك هنا..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-ivory border border-navy/20 rounded-lg text-navy placeholder-slate focus:ring-2 focus:ring-gold focus:outline-none"
                ></textarea>
                <button
                    onClick={handleAddReview}
                    className="w-full bg-navy text-ivory font-bold py-3 px-6 rounded-lg hover:bg-navy/90 transition-colors duration-300"
                >
                    إرسال المراجعة
                </button>
            </div>
        </div>
    );
};

export const ArtisanProfileModal: React.FC<ArtisanProfileModalProps> = ({ artisan, onClose, onAddReview }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = useCallback(() => {
    if (!artisan) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % artisan.gallery.length);
  }, [artisan]);

  const prevImage = useCallback(() => {
    if (!artisan) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + artisan.gallery.length) % artisan.gallery.length);
  }, [artisan]);

  // Reset image index when artisan changes
  React.useEffect(() => {
    setCurrentImageIndex(0);
  }, [artisan]);

  if (!artisan) return null;

  const getArtisanAverageRating = (artisan: Artisan): number => {
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

  const getReviewAverageRating = (review: Review): number => {
      const { quality, punctuality, price, communication } = review.ratings;
      return (quality + punctuality + price + communication) / 4;
  }

  const averageRating = getArtisanAverageRating(artisan).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-ivory text-navy rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-slate hover:text-navy transition-colors">
          <CloseIcon className="h-8 w-8" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-2">
                <div className="relative">
                    <img src={artisan.gallery[currentImageIndex] || DEFAULT_ARTISAN_IMAGE_BASE64} alt={`صورة ${currentImageIndex + 1}`} className="w-full h-80 object-cover rounded-2xl bg-slate/20"/>
                    {artisan.gallery.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute top-1/2 -translate-y-1/2 right-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                            <ChevronRightIcon className="h-6 w-6" />
                        </button>
                         <button onClick={nextImage} className="absolute top-1/2 -translate-y-1/2 left-2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    </>
                    )}
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-3 flex flex-col">
                <div className="mb-auto">
                    <h2 className="text-4xl font-bold text-navy">{artisan.name}</h2>
                    <div className="flex items-center gap-3 mt-2 text-gold text-xl">
                        <BriefcaseIcon className="h-6 w-6" />
                        <span>{artisan.trade}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-lg">
                        <StarRating rating={parseFloat(averageRating)} />
                        <span className="text-slate">({averageRating} / {artisan.reviews.length} مراجعات)</span>
                    </div>

                    <div className="mt-8 space-y-5 text-lg">
                        <p className="text-slate leading-relaxed">{artisan.bio}</p>
                        
                        <div>
                            <h4 className="font-bold text-navy mb-2">الخدمات المقدمة:</h4>
                            <div className="flex flex-wrap gap-2">
                                {artisan.services.map(s => <span key={s} className="bg-navy/10 text-navy px-3 py-1 rounded-full text-sm">{s}</span>)}
                            </div>
                        </div>

                        <p><strong className="font-bold text-navy ml-2">الخبرة:</strong> {artisan.experience} سنوات</p>
                        
                        <div className="flex items-center gap-2">
                            <LocationIcon className="h-6 w-6 text-slate" />
                            <span>{artisan.city}، {artisan.location}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                     <a href={`tel:${artisan.phone}`} className="w-full flex items-center justify-center gap-3 bg-gold text-navy font-bold py-4 px-6 rounded-xl hover:bg-gold/90 transition-colors duration-300 text-xl">
                        <PhoneIcon className="h-6 w-6"/>
                        <span>اتصل الآن ({artisan.phone})</span>
                     </a>
                </div>
            </div>
        </div>
        
        {/* Reviews Section at the bottom */}
        <div className="mt-10 pt-6 border-t border-navy/20">
            <h3 className="text-2xl font-bold text-navy mb-4">المراجعات ({artisan.reviews.length})</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {artisan.reviews.length > 0 ? artisan.reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-lg border border-navy/10">
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-navy">{review.author}</p>
                            <StarRating rating={getReviewAverageRating(review)} />
                        </div>
                        <p className="text-slate mt-2">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-2 text-left">{review.date}</p>
                    </div>
                )) : <p className="text-slate">لا توجد مراجعات حتى الآن.</p>}
            </div>
            <ReviewForm artisanId={artisan.id} onAddReview={onAddReview} />
        </div>
      </div>
    </div>
  );
};
