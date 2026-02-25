CREATE OR REPLACE FUNCTION public.classify_reservation_type(class_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  n TEXT;
BEGIN
  IF class_name IS NULL OR trim(class_name) = '' THEN
    RETURN NULL;
  END IF;
  n := lower(trim(class_name));

  -- === Personal Training ===
  IF n ~ 'personal training'
     OR n ~ 'personal program'
     OR n ~ 'duo training'
     OR n ~ 'find your duo'
     OR n ~ 'private boxing'
     OR n ~ 'private breathwork'
     OR n ~ 'private pilates'
     OR n ~ 'private yoga'
     OR n ~ 'private alignment'
  THEN RETURN 'Personal Training';
  END IF;

  -- === Private Treatment ===
  IF n ~ 'massage'
     OR n ~ 'acupuncture'
     OR n ~ 'reiki'
     OR n ~ 'bodywork'
     OR n ~ 'lymphatic treatment'
     OR n ~ 'physical therapy'
     OR (n ~ 'fascia release' AND n !~ 'yin yoga')
     OR n ~ 'stretch \+ percussive therapy'
     OR n ~ 'iv drip'
     OR n ~ 'vitamin shot'
     OR n ~ 'nad'
     OR n ~ 'ballancer'
     OR n ~ 'hyperbaric'
     OR n ~ 'express stretch'
     OR n ~ 'nutrition coaching'
     OR n ~ 'macro nutrition'
     OR n ~ 'endurance testing'
     OR n ~ 'metabolic testing'
     OR n ~ 'active alignment'
  THEN RETURN 'Private Treatment';
  END IF;

  -- === Staff Class ===
  IF n ~ '^staff ' OR n ~ 'staff class' OR n ~ '^teacher' OR n ~ 'teachers class'
  THEN RETURN 'Staff Class';
  END IF;

  -- === Gym Check Ins ===
  IF n ~ 'gym check in'
  THEN RETURN 'Gym Check Ins';
  END IF;

  -- === Workshops ===
  IF n ~ '^workshop'
     OR n ~ 'masterclass'
     OR n ~ 'human design'
     OR n ~ 'pelvic floor'
     OR n ~ 'inversion'
     OR n ~ 'handstand'
     OR n ~ 'prenatal'
     OR n ~ 'beginner''s guide'
     OR n ~ 'train smart'
     OR n ~ 'connect: the intersection'
     OR n ~ 'exploring the human'
     OR n ~ 'teacher workshop'
  THEN RETURN 'Workshops';
  END IF;

  -- === Events ===
  IF n ~ 'an evening with'
     OR n ~ 'book launch'
     OR n ~ 'movie night'
     OR n ~ 'tacos'
     OR n ~ 'sunset serve'
     OR n ~ 'saturday social'
     OR n ~ 'spring equinox'
     OR n ~ 'summer solstice'
     OR n ~ 'friday night lights'
     OR n ~ 'turkey trot'
     OR n ~ 'cacao tasting'
     OR n ~ 'sunchasers'
     OR n ~ 'pulse & presence'
     OR n ~ 'pulse \+ presence'
     OR n ~ 'upcycle'
     OR n ~ 'osea'
     OR n ~ 'new year''s'
  THEN RETURN 'Events';
  END IF;

  -- === Classes (broadest – checked last) ===
  IF n ~ '\(heated\)'
     OR n ~ '\(non-heated'
     OR n ~ 'reformer pilates'
     OR n ~ 'sound bath'
     OR n ~ '\(rooftop\)'
     OR n ~ '\(roof\)'
     OR n ~ '\(high roof\)'
     OR n ~ '\(ground floor'
     OR n ~ '\(impact'
     OR n ~ '\(gym floor'
     OR n ~ 'vinyasa'
     OR n ~ 'hatha'
     OR n ~ 'yin yoga'
     OR n ~ 'yin & sound'
     OR n ~ 'kundalini'
     OR n ~ 'mat pilates'
     OR n ~ 'warm mat pilates'
     OR n ~ 'hiit'
     OR n ~ 'circuit strength'
     OR n ~ 'boxing'
     OR n ~ 'shadowboxing'
     OR n ~ 'breathwork'
     OR n ~ 'meditation'
     OR n ~ 'dance'
     OR n ~ 'conditioning'
     OR n ~ 'qigong'
     OR n ~ 'signature sculpt'
     OR n ~ 'signature flow'
     OR n ~ 'signature yoga'
     OR n ~ 'morning practice'
     OR n ~ 'morning energy'
     OR n ~ 'flow into yin'
     OR n ~ 'core flow'
     OR n ~ 'core sculpt'
     OR n ~ 'core strength'
     OR n ~ 'power core'
     OR n ~ 'primal flow'
     OR n ~ 'animal flow'
     OR n ~ 'move & mobilize'
     OR n ~ 'mobility'
     OR n ~ 'dynamic stretch'
     OR n ~ 'static stretch'
     OR n ~ 'roll & release'
     OR n ~ 'functional movement'
     OR n ~ 'speed & agility'
     OR n ~ 'kettlebell'
     OR n ~ 'yoga nidra'
     OR n ~ 'yoga sculpt'
     OR n ~ 'yoga play'
     OR n ~ 'yoga for'
     OR n ~ 'rooted strength'
     OR n ~ 'focused strength'
     OR n ~ 'strength, mobility'
     OR n ~ 'run by hume'
     OR n ~ 'intro to'
     OR n ~ 'foundations of'
     OR n ~ 'fundamentals of'
     OR n ~ 'gentle movement'
     OR n ~ 'acupressure'
     OR n ~ 'beach bootcamp'
     OR n ~ 'full moon'
     OR n ~ 'sunrise rooftop'
     OR n ~ 'community'
     OR n ~ 'ecstatic dance'
     OR n ~ 'infrared'
     OR n ~ 'somatic'
     OR n ~ 'divine feminine'
     OR n ~ 'breath & sound'
     OR n ~ 'movement, meditation'
     OR n ~ 'spinal health'
     OR n ~ 'sunset practice'
     OR n ~ 'power & strength'
     OR n ~ 'heart-opening'
     OR n ~ 'vertical'
  THEN RETURN 'Classes';
  END IF;

  -- No match
  RETURN NULL;
END;
$function$;