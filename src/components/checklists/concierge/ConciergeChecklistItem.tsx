import { useState } from 'react';
import { Check, Camera, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToggleConciergeCompletion } from '@/hooks/checklists/useConciergeChecklists';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { PhotoUpload } from '@/components/ui/PhotoUpload';

interface ConciergeChecklistItemProps {
  item: any;
  completion: any;
  checklistId: string;
  completionDate: string;
  shiftTime: string;
  checkboxIndex?: number;
}

export function ConciergeChecklistItem({
  item,
  completion,
  checklistId,
  completionDate,
  shiftTime,
  checkboxIndex = 0,
}: ConciergeChecklistItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toggleCompletion = useToggleConciergeCompletion();
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

  // Generate date-based storage path for photos
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

  // Color map for left border and background styling
  const colorBorderMap: Record<string, string> = {
    red: 'border-l-add-crimson',
    orange: 'border-l-add-amber',
    yellow: 'border-l-yellow-500',
    green: 'border-l-green-500',
    blue: 'border-l-add-skyBlue',
    purple: 'border-l-purple-500',
    gray: 'border-l-gray-500',
    teal: 'border-l-add-olive',
    pink: 'border-l-add-burntOrange',
  };
  const colorBgMap: Record<string, string> = {
    red: 'bg-add-crimson/5',
    orange: 'bg-add-amber/5',
    yellow: 'bg-yellow-500/5',
    green: 'bg-green-500/5',
    blue: 'bg-add-skyBlue/5',
    purple: 'bg-purple-500/5',
    gray: 'bg-gray-500/5',
    teal: 'bg-add-olive/5',
    pink: 'bg-add-burntOrange/5',
  };
  // For checkbox items, alternate between blue and green based on checkboxIndex
  const effectiveColor = item.task_type === 'checkbox' 
    ? (checkboxIndex % 2 === 0 ? 'blue' : 'green') 
    : item.color;
  const colorBorderClass = effectiveColor ? `border-l-4 ${colorBorderMap[effectiveColor] || ''} ${colorBgMap[effectiveColor] || ''}` : '';

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
        className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${colorBorderClass} ${
          isCompleted ? 'bg-accent/30 border-primary' : ''
        }`}
        onClick={() => handleToggle()}
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
            isCompleted ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {isCompleted && <Check className="h-4 w-4 text-primary-foreground" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{taskLabel}</span>
            {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            {item.is_high_priority && <Badge variant="default" className="text-xs">High Priority</Badge>}
          </div>
          {item.time_hint && (
            <p className="text-xs text-muted-foreground mt-1">{item.time_hint}</p>
          )}
        </div>
      </div>
    );
  }

  // Photo type
  if (item.task_type === 'photo') {
    return (
      <div className={`p-3 md:p-4 border rounded-lg space-y-3 ${colorBorderClass}`}>
        <PhotoUpload
          isOpen={isPhotoModalOpen}
          onSave={handlePhotoSave}
          onCancel={() => setIsPhotoModalOpen(false)}
          storagePath={getPhotoStoragePath()}
          title={completion?.photo_url ? 'Retake Photo' : 'Take Photo'}
        />
        
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {completion?.photo_url ? (
          <div className="space-y-3">
            <img 
              src={completion.photo_url} 
              alt="Completion photo" 
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
                Retake
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleToggle()}
                className="min-h-[44px]"
              >
                Remove
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
            Take Photo
          </Button>
        )}
      </div>
    );
  }

  // Signature type
  if (item.task_type === 'signature') {
    const isImageSignature = completion?.signature_data?.startsWith('data:image/');
    
    return (
      <div className={`p-3 md:p-4 border rounded-lg space-y-3 ${colorBorderClass}`}>
        <SignaturePad
          isOpen={isSignatureModalOpen}
          onSave={handleSignatureSave}
          onCancel={() => setIsSignatureModalOpen(false)}
          title={completion?.signature_data ? 'Update Signature' : 'Sign Below'}
        />
        
        <div className="flex items-center gap-2">
          <PenTool className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {completion?.signature_data ? (
          <div className="space-y-3">
            {isImageSignature ? (
              <div className="p-2 border rounded-lg bg-white inline-block">
                <img
                  src={completion.signature_data}
                  alt="Signature"
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
                Re-sign
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleToggle()}
                className="min-h-[44px]"
              >
                Clear
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
            Sign
          </Button>
        )}
      </div>
    );
  }

  // Text entry types
  if (item.task_type === 'free_response' || item.task_type === 'short_entry') {
    return (
      <div className={`p-3 border rounded-lg space-y-2 ${colorBorderClass}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {item.task_type === 'short_entry' ? (
          <Input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => handleToggle(textValue)}
            placeholder="Enter value..."
          />
        ) : (
          <Textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={() => handleToggle(textValue)}
            placeholder="Enter your response..."
            rows={3}
          />
        )}
      </div>
    );
  }

  // Yes/No type
  if (item.task_type === 'yes_no') {
    return (
      <div className={`p-3 border rounded-lg space-y-2 ${colorBorderClass}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
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
            Yes
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
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Multiple choice type
  if (item.task_type === 'multiple_choice') {
    const choices = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'N/A'];
    return (
      <div className={`p-3 border rounded-lg space-y-2 ${colorBorderClass}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
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
              {choice}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Employee type
  if (item.task_type === 'employee') {
    return (
      <div className={`p-3 border rounded-lg space-y-2 ${colorBorderClass}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[13px]">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={() => handleToggle(textValue)}
          placeholder="Employee name..."
        />
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`p-3 border rounded-lg ${colorBorderClass}`}>
      <span>{taskLabel}</span>
      <p className="text-xs text-muted-foreground">Unsupported task type: {item.task_type}</p>
    </div>
  );
}
