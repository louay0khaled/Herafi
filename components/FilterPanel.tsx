import React from 'react';
import { SearchIcon } from './icons';
import { TRADES, CITIES } from '../constants';

interface FilterState {
  trade: string;
  minExperience: string;
  city: string;
  minRating: string;
}

interface FilterPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-navy/5 p-4 rounded-2xl mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative lg:col-span-3">
          <input
            type="text"
            placeholder="ابحث بالاسم أو الموقع أو الوسوم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 ps-12 bg-ivory border-2 border-transparent focus:border-gold focus:ring-gold rounded-xl text-lg text-navy placeholder-slate"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <SearchIcon className="h-6 w-6 text-slate" />
          </div>
        </div>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-navy font-semibold hover:text-gold transition-colors">خيارات تصفية متقدمة</summary>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {/* Filters */}
          <select name="trade" value={filters.trade} onChange={handleFilterChange} className="p-3 bg-ivory border-transparent rounded-xl text-navy">
            <option value="">كل الحرف</option>
            {TRADES.map(trade => <option key={trade} value={trade}>{trade}</option>)}
          </select>
          <select name="minExperience" value={filters.minExperience} onChange={handleFilterChange} className="p-3 bg-ivory border-transparent rounded-xl text-navy">
            <option value="">كل الخبرات</option>
            <option value="5">5+ سنوات</option>
            <option value="10">10+ سنوات</option>
            <option value="15">15+ سنوات</option>
          </select>
          <select name="city" value={filters.city} onChange={handleFilterChange} className="p-3 bg-ivory border-transparent rounded-xl text-navy">
            <option value="">كل المدن</option>
            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <select name="minRating" value={filters.minRating} onChange={handleFilterChange} className="p-3 bg-ivory border-transparent rounded-xl text-navy">
            <option value="">أي تقييم</option>
            <option value="4">4+</option>
            <option value="3">3+</option>
            <option value="2">2+</option>
          </select>
        </div>
      </details>
    </div>
  );
};
