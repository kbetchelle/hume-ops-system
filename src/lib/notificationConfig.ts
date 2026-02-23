import {
  Bell,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Bug,
  Users,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserX,
  Clock,
  BookOpen,
  Package,
  DoorOpen,
  MapPin,
  CreditCard,
} from 'lucide-react';
import type { NotificationType } from '@/hooks/useNotifications';
import { add_color } from '@/lib/constants';

/**
 * Global notification formatting config.
 * Maps every NotificationType → icon, hex color, and labels.
 *
 * Components use the hex value to build inline styles, guaranteeing
 * colors render regardless of Tailwind purging.
 */

export interface NotificationFormatConfig {
  icon: React.ComponentType<{ className?: string }>;
  /** The hex color from add_color palette */
  hex: string;
  /** English label */
  labelEn: string;
  /** Spanish label */
  labelEs: string;
}

/** Helper to build inline style objects from a hex color */
export function solidStyle(hex: string): React.CSSProperties {
  return { backgroundColor: hex, color: '#fff' };
}

export function tintStyle(hex: string): React.CSSProperties {
  return { backgroundColor: `${hex}1A` }; // 1A = ~10% opacity
}

export function tintBorderStyle(hex: string): React.CSSProperties {
  return { borderColor: `${hex}66`, backgroundColor: `${hex}1A` }; // 66 = ~40%
}

export function iconColorStyle(hex: string): React.CSSProperties {
  return { color: hex };
}

export const NOTIFICATION_FORMAT: Record<NotificationType, NotificationFormatConfig> = {
  qa_answered:              { icon: HelpCircle,    hex: add_color.blue,   labelEn: 'Q&A Answered',         labelEs: 'P&R Respondida' },
  qa_new_question:          { icon: HelpCircle,    hex: add_color.purple, labelEn: 'New Question',          labelEs: 'Nueva Pregunta' },
  announcement:             { icon: Megaphone,     hex: add_color.orange, labelEn: 'Announcement',          labelEs: 'Anuncio' },
  message:                  { icon: MessageSquare,  hex: add_color.yellow, labelEn: 'Message',               labelEs: 'Mensaje' },
  bug_report_update:        { icon: Bug,           hex: add_color.green,  labelEn: 'Bug Report Update',     labelEs: 'Actualización de Bug' },
  member_alert:             { icon: Users,         hex: add_color.purple, labelEn: 'Member Alert',          labelEs: 'Alerta de Miembro' },
  class_turnover:           { icon: RefreshCw,     hex: add_color.blue,   labelEn: 'Class Turnover',        labelEs: 'Rotación de Clase' },
  mat_cleaning:             { icon: Sparkles,      hex: add_color.blue,   labelEn: 'Mat Cleaning',          labelEs: 'Limpieza de Colchonetas' },
  account_approval_pending: { icon: Clock,         hex: add_color.orange, labelEn: 'Account Pending',       labelEs: 'Cuenta Pendiente' },
  account_approved:         { icon: UserCheck,     hex: add_color.green,  labelEn: 'Account Approved',      labelEs: 'Cuenta Aprobada' },
  account_rejected:         { icon: UserX,         hex: add_color.red,    labelEn: 'Account Rejected',      labelEs: 'Cuenta Rechazada' },
  resource_outdated:        { icon: BookOpen,      hex: add_color.orange, labelEn: 'Resource Outdated',     labelEs: 'Recurso Desactualizado' },
  package_arrived:          { icon: Package,       hex: add_color.purple, labelEn: 'Package Arrived',       labelEs: 'Paquete Llegó' },
  room_turnover:            { icon: DoorOpen,      hex: add_color.green,  labelEn: 'Room Turnover',         labelEs: 'Rotación de Habitación' },
  tour_alert:               { icon: MapPin,        hex: add_color.blue,   labelEn: 'Tour Alert',            labelEs: 'Alerta de Tour' },
  mastercard_arrival:       { icon: CreditCard,    hex: '#f6821f',        labelEn: 'Mastercard Arrival',    labelEs: 'Llegada Mastercard' },
};

export const FALLBACK_FORMAT: NotificationFormatConfig = {
  icon: Bell,
  hex: '#9ca3af', // muted gray
  labelEn: 'Notification',
  labelEs: 'Notificación',
};

export function getNotificationFormat(type: string): NotificationFormatConfig {
  return NOTIFICATION_FORMAT[type as NotificationType] || FALLBACK_FORMAT;
}

/**
 * Which notification types each role typically receives.
 */
export type AppRole = 'admin' | 'manager' | 'concierge' | 'trainer' | 'female_spa_attendant' | 'male_spa_attendant' | 'floater' | 'cafe';

export const ROLE_LABELS: Record<AppRole, { en: string; es: string }> = {
  admin:                { en: 'Admin',                es: 'Administrador' },
  manager:              { en: 'Manager',              es: 'Gerente' },
  concierge:            { en: 'Concierge',            es: 'Concierge' },
  trainer:              { en: 'Trainer',               es: 'Entrenador' },
  female_spa_attendant: { en: 'Female Spa Attendant', es: 'Asistente Spa (F)' },
  male_spa_attendant:   { en: 'Male Spa Attendant',   es: 'Asistente Spa (M)' },
  floater:              { en: 'Floater',               es: 'Flotador' },
  cafe:                 { en: 'Café',                  es: 'Café' },
};

export const ROLE_NOTIFICATION_TYPES: Record<AppRole, NotificationType[]> = {
  admin: [
    'qa_answered', 'qa_new_question', 'announcement', 'message',
    'bug_report_update', 'member_alert', 'class_turnover', 'mat_cleaning',
    'account_approval_pending', 'account_approved', 'account_rejected',
    'resource_outdated', 'package_arrived', 'room_turnover', 'tour_alert',
  ],
  manager: [
    'qa_answered', 'qa_new_question', 'announcement', 'message',
    'bug_report_update', 'member_alert', 'class_turnover', 'mat_cleaning',
    'account_approval_pending', 'account_approved', 'account_rejected',
    'resource_outdated', 'package_arrived', 'room_turnover', 'tour_alert',
  ],
  concierge: [
    'announcement', 'message', 'member_alert', 'class_turnover',
    'package_arrived', 'tour_alert', 'room_turnover', 'mastercard_arrival',
  ],
  trainer: [
    'announcement', 'message', 'class_turnover', 'mat_cleaning',
    'qa_answered',
  ],
  female_spa_attendant: [
    'announcement', 'message', 'class_turnover', 'mat_cleaning',
    'room_turnover',
  ],
  male_spa_attendant: [
    'announcement', 'message', 'class_turnover', 'mat_cleaning',
    'room_turnover',
  ],
  floater: [
    'announcement', 'message', 'class_turnover', 'mat_cleaning',
    'room_turnover', 'package_arrived',
  ],
  cafe: [
    'announcement', 'message',
  ],
};
