import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  DEFAULT_TYPE_ENABLED,
  DEFAULT_DELIVERY_METHOD,
} from '@/hooks/useNotificationPreferences';
import { useIsOnShift } from '@/hooks/useIsOnShift';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface NotificationPreferencesPanelProps {
  isAdminOrManager: boolean;
}

// Human-readable labels for notification types
const TYPE_LABELS: Record<string, { en: string; es: string }> = {
  qa_answered: { en: 'Q&A Answers', es: 'Respuestas de P&R' },
  qa_new_question: { en: 'New Q&A Questions', es: 'Nuevas Preguntas de P&R' },
  announcement: { en: 'Announcements', es: 'Anuncios' },
  message: { en: 'Messages', es: 'Mensajes' },
  bug_report_update: { en: 'Bug Report Updates', es: 'Actualizaciones de Bugs' },
  member_alert: { en: 'Member Alerts', es: 'Alertas de Miembros' },
  class_turnover: { en: 'Class Turnover', es: 'Rotación de Clases' },
  mat_cleaning: { en: 'Mat Cleaning', es: 'Limpieza de Colchonetas' },
};

const NOTIFICATION_TYPES = Object.keys(TYPE_LABELS);

const DELIVERY_OPTIONS = [
  { value: 'push', labelEn: 'Push', labelEs: 'Push' },
  { value: 'banner', labelEn: 'Banner', labelEs: 'Banner' },
  { value: 'none', labelEn: 'None', labelEs: 'Ninguno' },
];

export function NotificationPreferencesPanel({
  isAdminOrManager,
}: NotificationPreferencesPanelProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { data: isOnShift } = useIsOnShift();

  // Check if user has a Sling link
  const { data: hasSlingLink } = useQuery({
    queryKey: ['sling-link-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('sling_users')
        .select('id')
        .eq('linked_staff_id', user.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Merge fetched preferences with defaults for missing type keys
  const typeEnabled = { ...DEFAULT_TYPE_ENABLED, ...(preferences?.type_enabled || {}) };
  const deliveryMethod = { ...DEFAULT_DELIVERY_METHOD, ...(preferences?.delivery_method || {}) };

  const handleTypeToggle = (type: string, enabled: boolean) => {
    const updated = { ...typeEnabled, [type]: enabled };
    updatePreferences.mutate({ type_enabled: updated });
  };

  const handleDeliveryChange = (type: string, method: string) => {
    const updated = { ...deliveryMethod, [type]: method };
    updatePreferences.mutate({ delivery_method: updated });
  };

  const handleDndToggle = (enabled: boolean) => {
    updatePreferences.mutate({ dnd_enabled: enabled });
  };

  const handleDndSlingToggle = (checked: boolean) => {
    updatePreferences.mutate({ dnd_sling_linked: checked });
  };

  const handleQuietHoursStart = (value: string) => {
    updatePreferences.mutate({ dnd_manual_start: value || null });
  };

  const handleQuietHoursEnd = (value: string) => {
    updatePreferences.mutate({ dnd_manual_end: value || null });
  };

  if (isLoading) {
    return (
      <div className="text-[10px] text-muted-foreground py-4">
        {t('Loading preferences...', 'Cargando preferencias...')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Per-type toggles */}
      <div className="space-y-3">
        {NOTIFICATION_TYPES.map((type) => {
          const labels = TYPE_LABELS[type];
          const enabled = typeEnabled[type] ?? true;

          return (
            <div key={type} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Switch
                  checked={enabled}
                  onCheckedChange={(val) => handleTypeToggle(type, val)}
                  disabled={updatePreferences.isPending}
                />
                <span className="text-xs truncate">
                  {t(labels.en, labels.es)}
                </span>
              </div>
              <Select
                value={deliveryMethod[type] || 'push'}
                onValueChange={(val) => handleDeliveryChange(type, val)}
                disabled={!enabled || updatePreferences.isPending}
              >
                <SelectTrigger className="w-24 h-7 rounded-none text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {DELIVERY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[10px]"
                    >
                      {t(opt.labelEn, opt.labelEs)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* DND Section */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs">
            {t('Enable Do Not Disturb', 'Activar No Molestar')}
          </span>
          <Switch
            checked={preferences?.dnd_enabled ?? false}
            onCheckedChange={handleDndToggle}
            disabled={updatePreferences.isPending}
          />
        </div>

        {preferences?.dnd_enabled && (
          <div className="space-y-3 pl-4">
            {/* Sling shift option */}
            <div className="flex items-center gap-2">
              {hasSlingLink ? (
                <Checkbox
                  id="dnd-sling"
                  checked={preferences?.dnd_sling_linked ?? false}
                  onCheckedChange={(checked) =>
                    handleDndSlingToggle(checked === true)
                  }
                  disabled={updatePreferences.isPending}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Checkbox
                        id="dnd-sling"
                        checked={false}
                        disabled
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px]">
                      {t(
                        'No Sling account linked. Contact your manager.',
                        'No hay cuenta Sling vinculada. Contacta a tu gerente.'
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Label
                htmlFor="dnd-sling"
                className="text-[10px] text-muted-foreground cursor-pointer"
              >
                {t(
                  'Only during my shifts (Sling)',
                  'Solo durante mis turnos (Sling)'
                )}
              </Label>
            </div>

            {/* Sling status indicator */}
            {hasSlingLink && (
              <p className="text-[10px] text-muted-foreground">
                {isOnShift
                  ? t('You are currently on shift', 'Actualmente estás en turno')
                  : t('You are currently off shift', 'Actualmente no estás en turno')}
              </p>
            )}

            {/* Quiet hours */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t('Quiet Hours', 'Horas de Silencio')}
              </p>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="dnd-start"
                  className="text-[10px] text-muted-foreground"
                >
                  {t('Start', 'Inicio')}
                </Label>
                <Input
                  id="dnd-start"
                  type="time"
                  value={preferences?.dnd_manual_start || ''}
                  onChange={(e) => handleQuietHoursStart(e.target.value)}
                  className="w-28 h-7 rounded-none text-[10px]"
                  disabled={updatePreferences.isPending}
                />
                <Label
                  htmlFor="dnd-end"
                  className="text-[10px] text-muted-foreground"
                >
                  {t('End', 'Fin')}
                </Label>
                <Input
                  id="dnd-end"
                  type="time"
                  value={preferences?.dnd_manual_end || ''}
                  onChange={(e) => handleQuietHoursEnd(e.target.value)}
                  className="w-28 h-7 rounded-none text-[10px]"
                  disabled={updatePreferences.isPending}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
