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
} from 'lucide-react';
import type { NotificationType } from '@/hooks/useNotifications';

/**
 * Global notification formatting config.
 * Maps every NotificationType → icon, solid/tint style tokens, and labels.
 * Colors use the add_color palette (green, blue, yellow, orange, red, purple).
 *
 * Style contexts:
 *  - solidBg + solidText  → icon badges & label tags (solid color, white text/icon)
 *  - tintBg + tintText    → banner backgrounds & unread row highlights (10% opacity, foreground text)
 *  - tintBorder           → banner borders (40% opacity)
 *  - iconColor            → icon inside tinted banners
 */

export interface NotificationFormatConfig {
  icon: React.ComponentType<{ className?: string }>;
  /** Solid bg class for icon badge + label tag */
  solidBg: string;
  /** Solid text class (white) for icon badge + label tag */
  solidText: string;
  /** Tint bg class at 10% for banners + unread rows */
  tintBg: string;
  /** Text class for tinted contexts */
  tintText: string;
  /** Border class at 40% for banners */
  tintBorder: string;
  /** Icon color for tinted banners */
  iconColor: string;
  /** English label */
  labelEn: string;
  /** Spanish label */
  labelEs: string;
}

function c(color: string): Omit<NotificationFormatConfig, 'icon' | 'labelEn' | 'labelEs'> {
  return {
    solidBg: `bg-add-${color}`,
    solidText: 'text-white',
    tintBg: `bg-add-${color}/10`,
    tintText: 'text-foreground',
    tintBorder: `border-add-${color}/40`,
    iconColor: `text-add-${color}`,
  };
}

export const NOTIFICATION_FORMAT: Record<NotificationType, NotificationFormatConfig> = {
  qa_answered:              { icon: HelpCircle,   ...c('blue'),   labelEn: 'Q&A Answered',         labelEs: 'P&R Respondida' },
  qa_new_question:          { icon: HelpCircle,   ...c('purple'), labelEn: 'New Question',          labelEs: 'Nueva Pregunta' },
  announcement:             { icon: Megaphone,    ...c('orange'), labelEn: 'Announcement',          labelEs: 'Anuncio' },
  message:                  { icon: MessageSquare,...c('yellow'), labelEn: 'Message',               labelEs: 'Mensaje' },
  bug_report_update:        { icon: Bug,          ...c('green'),  labelEn: 'Bug Report Update',     labelEs: 'Actualización de Bug' },
  member_alert:             { icon: Users,        ...c('purple'), labelEn: 'Member Alert',          labelEs: 'Alerta de Miembro' },
  class_turnover:           { icon: RefreshCw,    ...c('blue'),   labelEn: 'Class Turnover',        labelEs: 'Rotación de Clase' },
  mat_cleaning:             { icon: Sparkles,     ...c('blue'),   labelEn: 'Mat Cleaning',          labelEs: 'Limpieza de Colchonetas' },
  account_approval_pending: { icon: Clock,        ...c('orange'), labelEn: 'Account Pending',       labelEs: 'Cuenta Pendiente' },
  account_approved:         { icon: UserCheck,    ...c('green'),  labelEn: 'Account Approved',      labelEs: 'Cuenta Aprobada' },
  account_rejected:         { icon: UserX,        ...c('red'),    labelEn: 'Account Rejected',      labelEs: 'Cuenta Rechazada' },
  resource_outdated:        { icon: BookOpen,     ...c('orange'), labelEn: 'Resource Outdated',     labelEs: 'Recurso Desactualizado' },
  package_arrived:          { icon: Package,      ...c('purple'), labelEn: 'Package Arrived',       labelEs: 'Paquete Llegó' },
  room_turnover:            { icon: DoorOpen,     ...c('green'),  labelEn: 'Room Turnover',         labelEs: 'Rotación de Habitación' },
  tour_alert:               { icon: MapPin,       ...c('blue'),   labelEn: 'Tour Alert',            labelEs: 'Alerta de Tour' },
};

export const FALLBACK_FORMAT: NotificationFormatConfig = {
  icon: Bell,
  solidBg: 'bg-muted',
  solidText: 'text-muted-foreground',
  tintBg: 'bg-muted/10',
  tintText: 'text-foreground',
  tintBorder: 'border-muted/40',
  iconColor: 'text-muted-foreground',
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
    'package_arrived', 'tour_alert', 'room_turnover',
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
