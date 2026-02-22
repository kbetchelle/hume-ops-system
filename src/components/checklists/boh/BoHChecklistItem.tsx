import { useState } from 'react';
import { Check, Camera, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToggleBoHCompletion } from '@/hooks/checklists/useBoHChecklists';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { PhotoUpload } from '@/components/ui/PhotoUpload';
import { getTaskColorClass } from '@/components/checklists/checklistColors';
import { cn } from '@/lib/utils';

interface BoHChecklistItemProps {
  item: any;
  completion: any;
  checklistId: string;
  completionDate: string;
  shiftTime: string;
  checkboxIndex?: number;
}

export function BoHChecklistItem({
  item,
  completion,
  checklistId,
  completionDate,
  shiftTime,
  checkboxIndex = 0,
}: BoHChecklistItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toggleCompletion = useToggleBoHCompletion();
  const [textValue, setTextValue] = useState(completion?.note_text || '');

  const isCompleted = !!completion?.completed_at;
  const taskLabel = t(item.task_description, item.label_spanish);

  const handleToggle = async (value?: string, photoUrl?: string, signatureData?: string) => {
    if (!user) return;

    await toggleCompletion.mutateAsync({
      itemId: item.id,
      checklistId,
      completionDate,
      shiftTime,
      completedById: user.id,
      completedBy: user.email || user.id,
      isCompleted,
      value,
      photoUrl,
      signatureData,
    });
  };

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const getPhotoStoragePath = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `checklist/${year}/${month}/${day}`;
  };

  const handlePhotoSave = async (photoUrl: string) => {
    setIsPhotoModalOpen(false);
    await handleToggle(undefined, photoUrl);
  };

  const handleSignatureSave = async (signatureData: string) => {
    setIsSignatureModalOpen(false);
    await handleToggle(undefined, undefined, signatureData);
  };

  // Use standardized task-type-based color
  const colorBorderClass = getTaskColorClass(item.task_type, checkboxIndex);
  const isMobile = useIsMobile();

  // Header type
  if (item.task_type === 'header') {
    return (
      <div className={`p-4 font-semibold text-lg ${item.color ? `text-${item.color}-700` : ''}`}>
        {taskLabel}
      </div>
    );
  }

  // Checkbox type
  if (item.task_type === 'checkbox') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 border rounded-none hover:bg-accent/50 transition-all duration-200 cursor-pointer active:scale-[0.98]',
          colorBorderClass,
          isCompleted && 'bg-accent/30 border-primary opacity-90',
          isMobile ? 'min-h-[48px] py-4 px-5 gap-4' : 'p-3'
        )}
        onClick={() => handleToggle()}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded border-2 shrink-0',
            isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground',
            isMobile ? 'h-7 w-7' : 'h-5 w-5'
          )}
        >
          {isCompleted && <Check className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              isCompleted && 'line-through text-muted-foreground',
              isMobile ? 'text-base' : 'text-[13px]'
            )}>{taskLabel}</span>
            {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
            {item.is_high_priority && <Badge variant="default" className="text-xs">{t('High Priority', 'Alta Prioridad')}</Badge>}
          </div>
          {item.time_hint && (
            <p className={cn('text-muted-foreground mt-1', isMobile ? 'text-sm' : 'text-xs')}>{item.time_hint}</p>
          )}
        </div>
      </div>
    );
  }

  // Photo type
  if (item.task_type === 'photo') {
    return (
      <div className={cn('border rounded-none space-y-3', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3 md:p-4')}>
        <PhotoUpload
          isOpen={isPhotoModalOpen}
          onSave={handlePhotoSave}
          onCancel={() => setIsPhotoModalOpen(false)}
          storagePath={getPhotoStoragePath()}
          title={completion?.photo_url ? t('Retake Photo', 'Retomar Foto') : t('Take Photo', 'Tomar Foto')}
        />
        
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 flex-shrink-0" />
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {completion?.photo_url ? (
          <div className="space-y-3">
            <img 
              src={completion.photo_url} 
              alt={t('Completion photo', 'Foto de finalización')}
              className="max-w-full sm:max-w-xs rounded-lg border"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsPhotoModalOpen(true)}
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <Camera className="h-4 w-4" />
                {t('Retake', 'Retomar')}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleToggle()}
                className="min-h-[44px]"
              >
                {t('Remove', 'Eliminar')}
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsPhotoModalOpen(true)}
            className="min-h-[44px] min-w-[44px] gap-2"
          >
            <Camera className="h-4 w-4" />
            {t('Take Photo', 'Tomar Foto')}
          </Button>
        )}
      </div>
    );
  }

  // Signature type
  if (item.task_type === 'signature') {
    const isImageSignature = completion?.signature_data?.startsWith('data:image/');
    
    return (
      <div className={cn('border rounded-none space-y-3', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3 md:p-4')}>
        <SignaturePad
          isOpen={isSignatureModalOpen}
          onSave={handleSignatureSave}
          onCancel={() => setIsSignatureModalOpen(false)}
          title={completion?.signature_data ? t('Update Signature', 'Actualizar Firma') : t('Sign Below', 'Firme Abajo')}
        />
        
        <div className="flex items-center gap-2">
          <PenTool className="h-5 w-5 flex-shrink-0" />
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className={cn('text-muted-foreground', isMobile ? 'text-sm' : 'text-xs')}>{item.time_hint}</p>
        )}
        {completion?.signature_data ? (
          <div className="space-y-3">
            {isImageSignature ? (
              <div className="p-2 border rounded-lg bg-white inline-block">
                <img
                  src={completion.signature_data}
                  alt={t('Signature', 'Firma')}
                  className="max-h-[80px] w-auto"
                />
              </div>
            ) : (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="font-signature text-2xl">{completion.signature_data}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsSignatureModalOpen(true)}
                className="min-h-[44px] min-w-[44px] gap-2"
              >
                <PenTool className="h-4 w-4" />
                {t('Re-sign', 'Re-firmar')}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleToggle()}
                className="min-h-[44px]"
              >
                {t('Clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsSignatureModalOpen(true)}
            className="min-h-[44px] min-w-[44px] gap-2"
          >
            <PenTool className="h-4 w-4" />
            {t('Sign', 'Firmar')}
          </Button>
        )}
      </div>
    );
  }

  // Text entry types
  if (item.task_type === 'free_response' || item.task_type === 'short_entry') {
    return (
      <div className={cn('border rounded-none space-y-2', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3')}>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {item.task_type === 'short_entry' ? (
          <Input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => handleToggle(textValue)}
            placeholder={t('Enter value...', 'Ingrese valor...')}
          />
        ) : (
          <Textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => handleToggle(textValue)}
            placeholder={t('Enter your response...', 'Ingrese su respuesta...')}
            rows={3}
          />
        )}
      </div>
    );
  }

  // Yes/No type
  if (item.task_type === 'yes_no') {
    return (
      <div className={cn('border rounded-none space-y-2', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3')}>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={completion?.note_text === 'Yes' ? 'default' : 'outline'}
            onClick={() => handleToggle('Yes')}
          >
            {t('Yes', 'Sí')}
          </Button>
          <Button
            size="sm"
            variant={completion?.note_text === 'No' ? 'default' : 'outline'}
            onClick={() => handleToggle('No')}
          >
            No
          </Button>
          {completion?.note_text && (
            <Button size="sm" variant="ghost" onClick={() => handleToggle()}>
              {t('Clear', 'Limpiar')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Multiple choice type
  if (item.task_type === 'multiple_choice') {
    const choices = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'N/A'];
    const choicesEs: Record<string, string> = { Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom', 'N/A': 'N/A' };
    return (
      <div className={cn('border rounded-none space-y-2', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3')}>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => (
            <Button
              key={choice}
              size="sm"
              variant={completion?.note_text === choice ? 'default' : 'outline'}
              onClick={() => handleToggle(choice)}
            >
              {t(choice, choicesEs[choice])}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Employee type
  if (item.task_type === 'employee') {
    return (
      <div className={cn('border rounded-none space-y-2', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3')}>
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isMobile ? 'text-base' : 'text-[13px]')}>{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">{t('Required', 'Obligatorio')}</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={() => handleToggle(textValue)}
          placeholder={t('Employee name...', 'Nombre del empleado...')}
        />
      </div>
    );
  }

  // Default fallback
  return (
    <div className={cn('border rounded-none', colorBorderClass, isMobile ? 'min-h-[48px] py-4 px-5' : 'p-3')}>
      <span className={cn(isMobile && 'text-base')}>{taskLabel}</span>
      <p className="text-xs text-muted-foreground">{t('Unsupported task type', 'Tipo de tarea no soportado')}: {item.task_type}</p>
    </div>
  );
}
