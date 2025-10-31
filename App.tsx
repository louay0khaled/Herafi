import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Artisan, Review } from './types';
import { TRADES, CITIES } from './constants';
import { ArtisanCard } from './components/ArtisanCard';
import { ArtisanProfileModal } from './components/ArtisanProfileModal';
import { FilterPanel } from './components/FilterPanel';
import { BriefcaseIcon, CloseIcon, WhatsAppIcon } from './components/icons';

// --- API Simulation Service ---
const api = {
  async fetchArtisans(): Promise<Artisan[]> {
    console.log("API: Fetching artisans...");
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedArtisans = localStorage.getItem('artisans');
        resolve(storedArtisans ? JSON.parse(storedArtisans) : []);
        console.log("API: Artisans fetched.");
      }, 500);
    });
  },

  async addArtisan(newArtisanData: Omit<Artisan, 'id' | 'reviews'>): Promise<Artisan> {
     console.log("API: Adding new artisan...");
     return new Promise(async (resolve) => {
        const artisans = await this.fetchArtisans();
        const newArtisan: Artisan = {
            ...newArtisanData,
            id: `artisan-${Date.now()}`,
            reviews: [],
        };
        const updatedArtisans = [...artisans, newArtisan];
        localStorage.setItem('artisans', JSON.stringify(updatedArtisans));
        setTimeout(() => {
          console.log("API: Artisan added.");
          resolve(newArtisan);
        }, 500);
     });
  },
  
  async updateArtisan(updatedArtisan: Artisan): Promise<Artisan> {
    console.log(`API: Updating artisan ${updatedArtisan.id}...`);
    return new Promise(async (resolve) => {
       const artisans = await this.fetchArtisans();
       const updatedArtisans = artisans.map(a => a.id === updatedArtisan.id ? updatedArtisan : a);
       localStorage.setItem('artisans', JSON.stringify(updatedArtisans));
       setTimeout(() => {
         console.log("API: Artisan updated.");
         resolve(updatedArtisan);
       }, 500);
    });
  },

  async deleteArtisan(artisanId: string): Promise<void> {
    console.log(`API: Deleting artisan ${artisanId}...`);
    return new Promise(async (resolve) => {
       const artisans = await this.fetchArtisans();
       const updatedArtisans = artisans.filter(a => a.id !== artisanId);
       localStorage.setItem('artisans', JSON.stringify(updatedArtisans));
       setTimeout(() => {
         console.log("API: Artisan deleted.");
         resolve();
       }, 500);
    });
  },
  
  async addReview(artisanId: string, reviewData: Omit<Review, 'id' | 'date'>): Promise<Review> {
     console.log(`API: Adding review for artisan ${artisanId}...`);
     return new Promise(async (resolve) => {
        const artisans = await this.fetchArtisans();
         const newReview: Review = {
            ...reviewData,
            id: `r${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
        };
        const updatedArtisans = artisans.map(artisan => 
          artisan.id === artisanId ? { ...artisan, reviews: [...artisan.reviews, newReview] } : artisan
        );
        localStorage.setItem('artisans', JSON.stringify(updatedArtisans));
        setTimeout(() => {
            console.log("API: Review added.");
            resolve(newReview);
        }, 500);
     });
  }
};

// --- In-App Components ---

interface AdminLoginModalProps {
    onClose: () => void;
    onSuccess: () => void;
}
const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const correctPassword = "أنا لؤي";

    const handleSubmit = () => {
        if (password === correctPassword) {
            onSuccess();
        } else {
            setError('كلمة المرور غير صحيحة.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-ivory p-8 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-navy mb-4">دخول المسؤول</h2>
                <p className="text-slate mb-6">الرجاء إدخال كلمة المرور للوصول إلى لوحة التحكم.</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-3 bg-white border border-navy/20 rounded-lg text-navy placeholder-slate focus:ring-2 focus:ring-gold focus:outline-none"
                    placeholder="كلمة المرور"
                />
                <button
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-navy text-ivory font-bold py-3 px-6 rounded-lg hover:bg-navy/90 transition-colors duration-300"
                >
                    دخول
                </button>
            </div>
        </div>
    );
};

const initialArtisanState: Omit<Artisan, 'id' | 'reviews'> = {
    name: '', trade: TRADES[0], experience: 5, bio: '', services: [],
    city: CITIES[0], phone: '', location: '', gallery: [], tags: [],
};

interface ArtisanFormModalProps {
    onClose: () => void;
    onSave: (artisan: Artisan | Omit<Artisan, 'id' | 'reviews'>) => void;
    onDelete?: (artisanId: string) => void;
    artisanToEdit: Artisan | null;
}
const ArtisanFormModal: React.FC<ArtisanFormModalProps> = ({ onClose, onSave, onDelete, artisanToEdit }) => {
    const [artisan, setArtisan] = useState(artisanToEdit || initialArtisanState);
    const [formError, setFormError] = useState('');
    const isEditMode = !!artisanToEdit;

    useEffect(() => {
        setArtisan(artisanToEdit || initialArtisanState);
    }, [artisanToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setArtisan(prev => ({...prev, [name]: name === 'experience' ? parseInt(value) : value}));
    };

    const handleArrayChange = (field: 'tags' | 'services', value: string) => {
        const arr = value.split(',').map(item => item.trim()).filter(Boolean);
        setArtisan(prev => ({...prev, [field]: arr}));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const base64Promises = files.map((file: File) => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            });
            Promise.all(base64Promises).then(base64Images => {
                setArtisan(prev => ({ ...prev, gallery: [...prev.gallery, ...base64Images] }));
            });
        }
    };
    
    const removeImage = (index: number) => {
        setArtisan(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
    };

    const handleSubmit = () => {
        if (!artisan.name || !artisan.phone || !artisan.location || !artisan.bio) {
            setFormError('الرجاء تعبئة الحقول الأساسية: الاسم، الهاتف، الموقع، والنبذة التعريفية.');
            return;
        }
        setFormError('');
        onSave(artisan);
        onClose();
    };
    
    const handleDelete = () => {
        if (isEditMode && onDelete && window.confirm(`هل أنت متأكد من حذف ${artisan.name}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
            onDelete(artisanToEdit.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <div className="bg-ivory text-navy rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 text-slate hover:text-navy transition-colors"><CloseIcon className="h-8 w-8" /></button>
                <h2 className="text-3xl font-bold text-navy mb-6">{isEditMode ? 'تعديل بيانات الحرفي' : 'إضافة حرفي جديد'}</h2>
                {isEditMode && <p className="text-xs text-slate bg-navy/10 py-1 px-2 rounded-md mb-4 inline-block">معرّف الحرفي: {artisanToEdit.id}</p>}
                {formError && <p className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{formError}</p>}
                <div className="space-y-4">
                    <input name="name" placeholder="الاسم الكامل" value={artisan.name} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    <select name="trade" value={artisan.trade} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg">
                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                     <select name="city" value={artisan.city} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg">
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input name="experience" type="number" placeholder="سنوات الخبرة" value={artisan.experience} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    <textarea name="bio" placeholder="نبذة تعريفية" rows={4} value={artisan.bio} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg"></textarea>
                    <input placeholder="الخدمات (مفصولة بفاصلة)" defaultValue={artisan.services.join(', ')} onChange={e => handleArrayChange('services', e.target.value)} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    <input name="phone" type="tel" placeholder="رقم الهاتف" value={artisan.phone} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    <input name="location" placeholder="الحي أو المنطقة" value={artisan.location} onChange={handleChange} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    <input placeholder="الوسوم (مفصولة بفاصلة)" defaultValue={artisan.tags.join(', ')} onChange={e => handleArrayChange('tags', e.target.value)} className="w-full p-3 bg-white border border-navy/20 rounded-lg"/>
                    
                    <div>
                        <label className="block mb-2 font-semibold text-slate">معرض الصور</label>
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold/20 file:text-gold hover:file:bg-gold/30"/>
                        <div className="mt-2 flex gap-2 flex-wrap">
                            {artisan.gallery.map((img, i) => (
                                <div key={i} className="relative">
                                    <img src={img} className="h-20 w-20 object-cover rounded-md" alt="preview"/>
                                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={handleSubmit} className="w-full bg-navy text-ivory font-bold py-3 px-6 rounded-lg hover:bg-navy/90 transition-colors">{isEditMode ? 'حفظ التعديلات' : 'إضافة الحرفي'}</button>
                        {isEditMode && <button onClick={handleDelete} className="w-1/3 bg-red-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-800 transition-colors">حذف</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ trade: '', minExperience: '', city: '', minRating: '' });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [artisanToEdit, setArtisanToEdit] = useState<Artisan | null>(null);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    setStatus('loading');
    api.fetchArtisans()
      .then(data => {
        setArtisans(data);
        setStatus('success');
      })
      .catch(error => {
        console.error("Failed to load artisans:", error);
        setStatus('error');
      });
  }, []);

  const getAverageRating = useCallback((artisan: Artisan): number => {
    if (artisan.reviews.length === 0) return 0;
    let total = 0, count = 0;
    artisan.reviews.forEach(review => {
      const { quality, punctuality, price, communication } = review.ratings;
      total += quality + punctuality + price + communication;
      count += 4;
    });
    return count > 0 ? total / count : 0;
  }, []);

  const filteredArtisans = useMemo(() => {
    return artisans.filter(artisan => {
      const avgRating = getAverageRating(artisan);
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (filters.trade === '' || artisan.trade === filters.trade) &&
        (filters.minExperience === '' || artisan.experience >= parseInt(filters.minExperience)) &&
        (filters.city === '' || artisan.city === filters.city) &&
        (filters.minRating === '' || avgRating >= parseInt(filters.minRating)) &&
        (searchTerm === '' ||
          artisan.name.toLowerCase().includes(searchTermLower) ||
          artisan.location.toLowerCase().includes(searchTermLower) ||
          artisan.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
      );
    });
  }, [artisans, searchTerm, filters, getAverageRating]);

  const handleAddReview = useCallback(async (artisanId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview = await api.addReview(artisanId, reviewData);
    setArtisans(prev => 
      prev.map(artisan => 
        artisan.id === artisanId ? { ...artisan, reviews: [...artisan.reviews, newReview] } : artisan
      )
    );
    setSelectedArtisan(prev => prev && prev.id === artisanId ? artisans.find(a => a.id === artisanId) || null : prev);
  }, [artisans]);

  const handleSaveArtisan = useCallback(async (artisanData: Artisan | Omit<Artisan, 'id' | 'reviews'>) => {
      if ('id' in artisanData) { // Editing existing
          const updatedArtisan = await api.updateArtisan(artisanData);
          setArtisans(prev => prev.map(a => a.id === updatedArtisan.id ? updatedArtisan : a));
      } else { // Adding new
          const newArtisan = await api.addArtisan(artisanData);
          setArtisans(prev => [...prev, newArtisan]);
      }
  }, []);
  
  const handleDeleteArtisan = useCallback(async (artisanId: string) => {
      await api.deleteArtisan(artisanId);
      setArtisans(prev => prev.filter(a => a.id !== artisanId));
  }, []);

  const handleLogoClick = () => {
    if (logoClickTimeoutRef.current) {
      clearTimeout(logoClickTimeoutRef.current);
    }
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount === 3) {
      setShowAdminLogin(true);
      setLogoClickCount(0);
    } else {
      logoClickTimeoutRef.current = window.setTimeout(() => setLogoClickCount(0), 500);
    }
  };
  
  const handleCardClick = (artisan: Artisan) => {
    if (isAdmin) {
      setArtisanToEdit(artisan);
      setIsFormModalOpen(true);
    } else {
      setSelectedArtisan(artisan);
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <p className="text-center text-slate text-lg py-10">جاري تحميل البيانات...</p>;
    }
    if (status === 'error') {
      return <p className="text-center text-red-500 text-lg py-10">حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة مرة أخرى.</p>;
    }
    if (filteredArtisans.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtisans.map(artisan => (
            <ArtisanCard key={artisan.id} artisan={artisan} onClick={() => handleCardClick(artisan)} />
          ))}
        </div>
      );
    }
    return (
      <div className="text-center py-16 px-6 bg-navy/5 rounded-2xl">
        <BriefcaseIcon className="h-16 w-16 mx-auto text-slate/50"/>
        <h3 className="mt-4 text-2xl font-bold text-navy">لا توجد نتائج مطابقة</h3>
        <p className="mt-2 text-slate">حاول تغيير كلمات البحث أو تعديل خيارات التصفية.</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <a
        href="https://wa.me/963992705838?text=أرغب%20في%20الانضمام%20إلى%20منصة%20حِرَفي"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-4 left-4 z-40 flex items-center gap-3 bg-green-500 text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300"
        title="تواصل معنا عبر واتساب"
      >
        <WhatsAppIcon className="h-6 w-6"/>
        <span className="text-sm">قم بالإتصال بنا لإضافة خبراتك للمنصة</span>
      </a>

      <header className="text-center mb-8 pt-16 sm:pt-0">
        <h1 onClick={handleLogoClick} className="text-5xl font-bold text-navy cursor-pointer" title="لوحة تحكم المسؤول (انقر ثلاث مرات)">حِرَفي</h1>
        <p className="text-slate text-xl mt-2">منصة الحرفيين المهرة</p>
         {isAdmin && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => { setArtisanToEdit(null); setIsFormModalOpen(true); }}
                className="bg-gold text-navy font-bold py-2 px-6 rounded-lg hover:bg-gold/90 transition-colors"
              >
                + إضافة حرفي جديد
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                className="bg-slate text-ivory font-bold py-2 px-6 rounded-lg hover:bg-slate/80 transition-colors"
              >
                خروج
              </button>
            </div>
          )}
      </header>

      <main>
        <FilterPanel 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filters={filters} setFilters={setFilters}
        />
        {renderContent()}
      </main>

      { !isAdmin && 
        <ArtisanProfileModal
            artisan={selectedArtisan}
            onClose={() => setSelectedArtisan(null)}
            onAddReview={handleAddReview}
        />
      }
      
      {showAdminLogin && (
        <AdminLoginModal
            onClose={() => setShowAdminLogin(false)}
            onSuccess={() => {
                setIsAdmin(true);
                setShowAdminLogin(false);
            }}
        />
      )}

      {isAdmin && isFormModalOpen && (
        <ArtisanFormModal 
            onClose={() => setIsFormModalOpen(false)}
            onSave={handleSaveArtisan}
            onDelete={handleDeleteArtisan}
            artisanToEdit={artisanToEdit}
        />
      )}
      
      <footer className="text-center mt-12 text-slate/70">
        <p>تم التصميم والتطوير ليناسب احتياجات الحرفيين والعملاء في سوريا.</p>
        <p>
            البيانات حالياً مخزنة بشكل آمن في متصفحك.
        </p>
      </footer>
    </div>
  );
};

export default App;
