
export interface Review {
  id: string;
  author: string;
  ratings: {
    quality: number;
    punctuality: number;
    price: number;
    communication: number;
  };
  comment: string;
  date: string;
}

export interface Artisan {
  id: string;
  name: string;
  trade: string;
  experience: number; // years
  bio: string;
  services: string[];
  city: string;
  phone: string;
  location: string;
  gallery: string[]; // array of base64 strings
  tags: string[];
  reviews: Review[];
}
