import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useSendNotification,
  useNotifyManagers,
  NotificationType,
} from '@/hooks/useNotifications';

type TargetType = 'all_managers' | 'all_staff' | 'specific_user';

const NOTIFICATION_TYPES: { value: NotificationType; labelEn: string; labelEs: string }[] = [
  { value: 'announcement', labelEn: 'Announcement', labelEs: 'Anuncio' },
  { value: 'message', labelEn: 'Message', labelEs: 'Mensaje' },
  { value: 'qa_new_question', labelEn: 'Q&A Question', labelEs: 'Pregunta P&R' },
  { value: 'qa_answered', labelEn: 'Q&A Answer', labelEs: 'Respuesta P&R' },
  { value: 'bug_report_update', labelEn: 'Bug Report Update', labelEs: 'Actualización de Bug' },
  { value: 'member_alert', labelEn: 'Member Alert', labelEs: 'Alerta de Miembro' },
  { value: 'class_turnover', labelEn: 'Class Turnover', labelEs: 'Rotación de Clase' },
  { value: 'mat_cleaning', labelEn: 'Mat Cleaning', labelEs: 'Limpieza de Colchoneta' },
];

export function AdminNotificationPanel() {
  const { t } = useLanguage();
  const sendNotification = useSendNotification();
  const notifyManagers = useNotifyManagers();

  const [target, setTarget] = useState<TargetType>('all_managers');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [type, setType] = useState<NotificationType>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Searchable user picker for "Specific User" target
  const { data: users } = useQuery({
    queryKey: ['profiles-search', userSearch],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');

      if (userSearch.trim()) {
        query = query.ilike('full_name', `%${userSearch.trim()}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: target === 'specific_user',
  });

  const isPending = sendNotification.isPending || notifyManagers.isPending;

  const clearForm = () => {
    setTitle('');
    setBody('');
    setSelectedUserId('');
    setUserSearch('');
  };

  const handleSend = async () => {
    if (!title.trim()) return;

    try {
      if (target === 'all_managers') {
        await notifyManagers.mutateAsync({
          type,
          title: title.trim(),
          body: body.trim() || undefined,
        });
      } else if (target === 'all_staff') {
        // Fetch all staff user IDs and send individually
        const { data: allUsers, error } = await supabase
          .from('profiles')
          .select('user_id');

        if (error) throw error;

        for (const u of allUsers || []) {
          await sendNotification.mutateAsync({
            userId: u.user_id,
            type,
            title: title.trim(),
            body: body.trim() || undefined,
          });
        }
      } else if (target === 'specific_user' && selectedUserId) {
        await sendNotification.mutateAsync({
          userId: selectedUserId,
          type,
          title: title.trim(),
          body: body.trim() || undefined,
        });
      }

      toast.success(t('Notification sent', 'Notificación enviada'));
      clearForm();
    } catch (err: any) {
      toast.error(
        t('Failed to send notification', 'Error al enviar notificación')
      );
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
          <Send className="h-4 w-4" />
          {t('Send Notification', 'Enviar Notificación')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t('Target', 'Destinatario')}
          </Label>
          <Select
            value={target}
            onValueChange={(val) => {
              setTarget(val as TargetType);
              setSelectedUserId('');
            }}
          >
            <SelectTrigger className="rounded-none text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all_managers" className="text-xs">
                {t('All Managers', 'Todos los Gerentes')}
              </SelectItem>
              <SelectItem value="all_staff" className="text-xs">
                {t('All Staff', 'Todo el Personal')}
              </SelectItem>
              <SelectItem value="specific_user" className="text-xs">
                {t('Specific User', 'Usuario Específico')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User picker (when specific user) */}
        {target === 'specific_user' && (
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest">
              {t('Search User', 'Buscar Usuario')}
            </Label>
            <Input
              placeholder={t('Type a name...', 'Escribe un nombre...')}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rounded-none text-xs"
            />
            {users && users.length > 0 && (
              <div className="border border-border max-h-32 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.user_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedUserId(u.user_id);
                      setUserSearch(u.full_name || '');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedUserId(u.user_id);
                        setUserSearch(u.full_name || '');
                      }
                    }}
                    className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-muted ${
                      selectedUserId === u.user_id ? 'bg-primary/10' : ''
                    }`}
                  >
                    {u.full_name || u.user_id}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t('Type', 'Tipo')}
          </Label>
          <Select
            value={type}
            onValueChange={(val) => setType(val as NotificationType)}
          >
            <SelectTrigger className="rounded-none text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {NOTIFICATION_TYPES.map((nt) => (
                <SelectItem key={nt.value} value={nt.value} className="text-xs">
                  {t(nt.labelEn, nt.labelEs)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t('Title', 'Título')}
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Notification title', 'Título de notificación')}
            className="rounded-none text-xs"
          />
        </div>

        {/* Body */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest">
            {t('Body (optional)', 'Cuerpo (opcional)')}
          </Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t(
              'Optional notification body',
              'Cuerpo de notificación opcional'
            )}
            className="rounded-none text-xs min-h-[60px]"
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={
            isPending ||
            !title.trim() ||
            (target === 'specific_user' && !selectedUserId)
          }
          className="w-full rounded-none text-[10px] uppercase tracking-widest"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          ) : (
            <Send className="h-3 w-3 mr-2" />
          )}
          {t('Send', 'Enviar')}
        </Button>
      </CardContent>
    </Card>
  );
}
