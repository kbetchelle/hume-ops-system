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
 * Maps every NotificationType → icon, brand color tokens, and labels.
 * Colors use the add_color palette (green, blue, yellow, orange, red, purple).
 */

export interface NotificationFormatConfig {
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind bg class at 15% opacity */
  bg: string;
  /** Tailwind text class */
  text: string;
  /** English label */
  labelEn: string;
  /** Spanish label */
  labelEs: string;
}

export const NOTIFICATION_FORMAT: Record<NotificationType, NotificationFormatConfig> = {
  qa_answered:             { icon: HelpCircle,  bg: 'bg-add-blue/15',   text: 'text-add-blue',   labelEn: 'Q&A Answered',         labelEs: 'P&R Respondida' },
  qa_new_question:         { icon: HelpCircle,  bg: 'bg-add-purple/15', text: 'text-add-purple', labelEn: 'New Question',          labelEs: 'Nueva Pregunta' },
  announcement:            { icon: Megaphone,   bg: 'bg-add-yellow/15', text: 'text-add-yellow', labelEn: 'Announcement',          labelEs: 'Anuncio' },
  message:                 { icon: MessageSquare,bg: 'bg-add-green/15',  text: 'text-add-green',  labelEn: 'Message',               labelEs: 'Mensaje' },
  bug_report_update:       { icon: Bug,          bg: 'bg-add-red/15',    text: 'text-add-red',    labelEn: 'Bug Report Update',     labelEs: 'Actualización de Bug' },
  member_alert:            { icon: Users,        bg: 'bg-add-orange/15', text: 'text-add-orange', labelEn: 'Member Alert',          labelEs: 'Alerta de Miembro' },
  class_turnover:          { icon: RefreshCw,    bg: 'bg-add-blue/15',   text: 'text-add-blue',   labelEn: 'Class Turnover',        labelEs: 'Rotación de Clase' },
  mat_cleaning:            { icon: Sparkles,     bg: 'bg-add-green/15',  text: 'text-add-green',  labelEn: 'Mat Cleaning',          labelEs: 'Limpieza de Colchonetas' },
  account_approval_pending:{ icon: Clock,        bg: 'bg-add-orange/15', text: 'text-add-orange', labelEn: 'Account Pending',       labelEs: 'Cuenta Pendiente' },
  account_approved:        { icon: UserCheck,    bg: 'bg-add-green/15',  text: 'text-add-green',  labelEn: 'Account Approved',      labelEs: 'Cuenta Aprobada' },
  account_rejected:        { icon: UserX,        bg: 'bg-add-red/15',    text: 'text-add-red',    labelEn: 'Account Rejected',      labelEs: 'Cuenta Rechazada' },
  resource_outdated:       { icon: BookOpen,     bg: 'bg-add-yellow/15', text: 'text-add-yellow', labelEn: 'Resource Outdated',     labelEs: 'Recurso Desactualizado' },
  package_arrived:         { icon: Package,      bg: 'bg-add-purple/15', text: 'text-add-purple', labelEn: 'Package Arrived',       labelEs: 'Paquete Llegó' },
  room_turnover:           { icon: DoorOpen,     bg: 'bg-add-orange/15', text: 'text-add-orange', labelEn: 'Room Turnover',         labelEs: 'Rotación de Habitación' },
  tour_alert:              { icon: MapPin,       bg: 'bg-add-blue/15',   text: 'text-add-blue',   labelEn: 'Tour Alert',            labelEs: 'Alerta de Tour' },
};

export const FALLBACK_FORMAT: NotificationFormatConfig = {
  icon: Bell,
  bg: 'bg-muted',
  text: 'text-muted-foreground',
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
