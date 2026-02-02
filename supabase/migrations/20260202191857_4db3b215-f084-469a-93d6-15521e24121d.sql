-- Add shift_type column to checklists table for shift-based filtering
ALTER TABLE public.checklists 
ADD COLUMN shift_type TEXT DEFAULT 'AM';

-- Update shift_type based on existing title patterns
UPDATE public.checklists 
SET shift_type = CASE 
  WHEN title ILIKE '%PM%' THEN 'PM'
  WHEN title ILIKE '%AM%' THEN 'AM'
  WHEN title ILIKE '%Closing%' THEN 'PM'
  WHEN title ILIKE '%Opening%' THEN 'AM'
  ELSE 'AM'
END;

-- Add is_weekend column for weekend-specific checklists
ALTER TABLE public.checklists 
ADD COLUMN is_weekend BOOLEAN DEFAULT false;

-- Update is_weekend based on existing title patterns  
UPDATE public.checklists 
SET is_weekend = (title ILIKE '%Weekend%');

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_checklists_role_shift ON public.checklists(role, shift_type, is_weekend) WHERE is_active = true;