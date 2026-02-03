import { useState } from 'react';
import { Check, Camera, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToggleBoHCompletion } from '@/hooks/checklists/useBoHChecklists';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SignatureCanvas from 'react-signature-canvas';

interface BoHChecklistItemProps {
  item: any;
  completion: any;
  checklistId: string;
  completionDate: string;
  shiftTime: string;
}

export function BoHChecklistItem({
  item,
  completion,
  checklistId,
  completionDate,
  shiftTime,
}: BoHChecklistItemProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toggleCompletion = useToggleBoHCompletion();
  const [textValue, setTextValue] = useState(completion?.note_text || '');
  const [sigCanvas, setSigCanvas] = useState<SignatureCanvas | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

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

  const handlePhotoUpload = async (file: File) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${completion?.id || crypto.randomUUID()}_photo.${fileExt}`;
    const filePath = `checklist/${year}/${month}/${day}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('checklist-photos')
      .upload(filePath, file, { upsert: true });
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('checklist-photos')
      .getPublicUrl(filePath);
      
    await handleToggle(undefined, publicUrl);
  };

  const handleSaveSignature = () => {
    if (!sigCanvas) return;
    const signatureData = sigCanvas.toDataURL();
    handleToggle(undefined, undefined, signatureData);
    setShowSignaturePad(false);
  };

  // Header type - just displays text
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
        className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${
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
            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{taskLabel}</span>
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
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="font-medium">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {completion?.photo_url ? (
          <div className="space-y-2">
            <img src={completion.photo_url} alt="Completion photo" className="max-w-xs rounded" />
            <Button size="sm" variant="outline" onClick={() => handleToggle()}>
              Remove Photo
            </Button>
          </div>
        ) : (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />
        )}
      </div>
    );
  }

  // Signature type
  if (item.task_type === 'signature') {
    return (
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          <span className="font-medium">{taskLabel}</span>
          {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </div>
        {item.time_hint && (
          <p className="text-xs text-muted-foreground">{item.time_hint}</p>
        )}
        {completion?.signature_data ? (
          <div className="space-y-2">
            <img src={completion.signature_data} alt="Signature" className="max-w-xs border rounded" />
            <Button size="sm" variant="outline" onClick={() => handleToggle()}>
              Clear Signature
            </Button>
          </div>
        ) : showSignaturePad ? (
          <div className="space-y-2">
            <div className="border rounded bg-white">
              <SignatureCanvas
                ref={(ref) => setSigCanvas(ref)}
                canvasProps={{
                  width: 400,
                  height: 200,
                  className: 'signature-canvas',
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveSignature}>
                Save Signature
              </Button>
              <Button size="sm" variant="outline" onClick={() => sigCanvas?.clear()}>
                Clear
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSignaturePad(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowSignaturePad(true)}>
            Add Signature
          </Button>
        )}
      </div>
    );
  }

  // Text entry types (free_response, short_entry)
  if (item.task_type === 'free_response' || item.task_type === 'short_entry') {
    return (
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{taskLabel}</span>
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
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{taskLabel}</span>
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
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{taskLabel}</span>
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
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{taskLabel}</span>
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
    <div className="p-3 border rounded-lg">
      <span>{taskLabel}</span>
      <p className="text-xs text-muted-foreground">Unsupported task type: {item.task_type}</p>
    </div>
  );
}
