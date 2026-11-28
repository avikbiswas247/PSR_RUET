export interface PublicPhotographer {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_available: boolean;
  device: string | null;
  photography_genre: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string | Date;
}

export interface PublicPortfolio {
  id: string;
  photographer_id: string;
  title: string | null;
  slug: string;
  description: string | null;
  theme: string | null;
  is_public: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  photographer_name?: string | null;
  photographer_avatar_url?: string | null;
}

export interface CommunityProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  roles: string[];
  title: string | null;
  is_available: boolean | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  device: string | null;
  photography_genre: string | null;
  created_at: string | Date;
  photo_count: number;
  portfolio_count: number;
}

export interface CommunityProfilePhoto {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  created_at: string | Date;
}

export interface CommunityProfileDetail extends CommunityProfile {
  photos: CommunityProfilePhoto[];
}

export interface PublicPhoto {
  id: string;
  photographer_id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  visibility: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface PublicEvent {
  id: string;
  created_by: string;
  title: string | null;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  start_at: string | Date | null;
  end_at: string | Date | null;
  status: string;
  registration_enabled: boolean;
  published_at: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface PublicBooking {
  id: string;
  booking_number: string;
  client_id: string;
  photographer_id: string;
  title: string | null;
  description: string | null;
  photography_type: string | null;
  location: string | null;
  booking_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
  budget: string | number | null;
  status: string;
  photographer_profile?: {
    id: string;
    user_id: string | null;
    full_name: string | null;
    avatar_url: string | null;
    title: string | null;
    location: string | null;
    photography_genre: string | null;
  } | null;
  client_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
    phone: string | null;
    organization_name: string | null;
    created_at: string | Date;
  } | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ClientDashboardData {
  summary: { total: number; pending: number; accepted: number; upcoming_confirmed: number; completed: number };
  upcoming: PublicBooking[];
  recent: PublicBooking[];
}

export interface ClientProfileData {
  organization_name: string | null;
  billing_address: string | null;
  preferred_services: string[];
  preferred_contact_method: string | null;
  booking_notes: string | null;
}

export interface PublicNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string | null;
  link_url: string | null;
  is_read: boolean;
  read_at: string | Date | null;
  created_at: string | Date;
}

export type PhotographerProfileMe = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_available: boolean;
  device: string | null;
  photography_genre: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string | Date;
};

export interface PublicExhibition {
  id: string;
  created_by: string;
  title: string | null;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  venue: string | null;
  start_date: string | Date | null;
  end_date: string | Date | null;
  status: string;
  created_at: string | Date;
}
