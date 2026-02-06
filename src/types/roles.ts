// Role types matching Supabase enum
export type AppRole = 
  | 'admin' 
  | 'manager' 
  | 'concierge' 
  | 'trainer' 
  | 'female_spa_attendant' 
  | 'male_spa_attendant' 
  | 'floater'
  | 'cafe';

export interface RoleInfo {
  value: AppRole;
  label: string;
  description: string;
  icon: string;
}

export const ROLES: RoleInfo[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full system access and user management',
    icon: '👑',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Staff management and reporting',
    icon: '📊',
  },
  {
    value: 'concierge',
    label: 'Concierge',
    description: 'Guest services and bookings',
    icon: '🔔',
  },
  {
    value: 'trainer',
    label: 'Trainer',
    description: 'Training sessions and fitness programs',
    icon: '💪',
  },
  {
    value: 'female_spa_attendant',
    label: 'Female Spa Attendant',
    description: 'Spa treatments and services',
    icon: '🌸',
  },
  {
    value: 'male_spa_attendant',
    label: 'Male Spa Attendant',
    description: 'Spa treatments and services',
    icon: '🌿',
  },
  {
    value: 'floater',
    label: 'Floater',
    description: 'Cross-department support',
    icon: '🔄',
  },
  {
    value: 'cafe',
    label: 'Cafe',
    description: 'Cafe operations and service',
    icon: '☕',
  },
];

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  onboarding_completed: boolean;
  preferred_language?: string | null;
  sling_id?: string | null;
  deactivated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: AppRole;
  permission: string;
  created_at: string;
}
