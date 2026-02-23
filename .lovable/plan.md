# Add `reservation_type` Calculated Column to `arketa_classes` and `daily_schedule`

## New Column

Add a `reservation_type TEXT` column (nullable, default `NULL`) to both `arketa_classes` and `daily_schedule`. This column will be populated via a database function that pattern-matches against the class `name`.

---

## Classification Rules

The DB function `classify_reservation_type(class_name TEXT) RETURNS TEXT` will apply these rules in order (case-insensitive):

**"Personal Training"** -- matches if name contains:

- `Personal Training`
- `Personal Program`
- `Duo Training`
- `SAME DAY Personal Training`
- `FIND YOUR DUO`
- `Private Boxing`
- `Private Breathwork`
- `Private Pilates`
- `Private Yoga`
- `Private Yoga / Meditation / Breathwork`
- `Private Alignment`

**"Private Treatment"** -- matches if name contains:

- `Massage` (Deep Reset Massage, 50min/80min/90min variants, Sound & Massage, Prenatal Massage)
- `Acupuncture`
- `Reiki`
- `Bodywork`
- `Lymphatic Treatment` (Detox by Rebecca variants)
- `Physical Therapy`
- `Fascia Release` (standalone, not "Yin Yoga into Fascia Release" which is a class)
- `Stretch + Percussive Therapy`
- `IV Drip`
- `Vitamin Shot`
- `NAD` (NAD Detox IV, NAD Shot)
- `Ballancer` (Compression Suit)
- `Hyperbaric`
- `Express Stretch`
- `Nutrition Coaching`
- `Macro Nutrition`
- `Endurance Testing`
- `Metabolic Testing`

**"Classes"** -- matches if name contains:

- `(Heated)` or `(Non-Heated`
- `Reformer Pilates`
- `Sound Bath`
- `(Rooftop)` or `(Roof)` or `(High Roof)`
- `(Ground Floor)` or `(Ground Floor Studio)`
- `(Impact Room)` or `(Impact)`
- `(Gym Floor)` or `(Gym Floor Balcony)`
- `Vinyasa Yoga`, `Hatha Yoga`, `Yin Yoga`, `Kundalini`
- `Mat Pilates`
- `HIIT`, `Circuit Strength`, `Boxing`
- `Breathwork` (standalone class variants)
- `Meditation`
- `Dance`, `Conditioning`, `Qigong`
- `Signature Sculpt`, `Signature Flow`, `Signature Yoga`
- `Morning Practice`, `Morning Energy`
- `Flow Into Yin`, `Core Flow`, `Core Sculpt`, `Core Strength`
- `Power Core Flow`
- `Primal Flow`, `Animal Flow`
- `Move & Mobilize`, `Mobility`
- `Dynamic Stretch`, `Static Stretch`, `Roll & Release`
- `Functional Movement`, `Speed & Agility`, `Kettlebell`
- `Yoga Nidra`, `Yoga Sculpt`, `Yoga Play`, `Yoga for`
- `Rooted Strength`, `Focused Strength`, `Strength, Mobility`
- `Warm Mat Pilates`, `Shadowboxing`
- `RUN by HUME`
- `Intro to` (Reformer, Weight Training, Dumbbells)
- `Foundations of`
- `Gentle Movement`
- `Acupressure Yin Yoga`
- `Beach Bootcamp`
- `Full Moon` (Ceremony, Sound Bath, Practice)
- `Sunrise Rooftop Yoga`
- `Community` (class variants)
- `Ecstatic Dance`
- `Active Breathwork`, `Activated Breathwork`
- `Breathwork for Athletes`
- `Infrared` yoga variants
- `Yin & Sound`
- `Somatic`
- `Transformational Breathwork`

---

## Names Needing Further Classification (Uncategorized)

These do not clearly match any of the three categories:


| Class Name                                                                                                                                                                                                            | Suggested Category? |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `Block` (and all `Block *` variants ~20 names)                                                                                                                                                                        | [null]              |
| `Gym Check in`                                                                                                                                                                                                        | Gym Check Ins       |
| [null]                                                                                                                                                                                                                | [null]              |
| `Weekly Wellness`                                                                                                                                                                                                     | [null]              |
| `Teacher Class` / `Teachers Class`                                                                                                                                                                                    | Staff Class         |
| `STAFF CLASS: Reformer Pilates...` / `STAFF Reformer...`                                                                                                                                                              | Staff Class         |
| `TEST EVENT`                                                                                                                                                                                                          | [null]              |
| `Unknown`                                                                                                                                                                                                             | [null]              |
| Various workshops (`HUMAN DESIGN`, `PELVIC FLOOR`, `INVERSION`, `HANDSTAND`, `PRENATAL`, etc.)                                                                                                                        | Workshops           |
| Various events (`AN EVENING WITH BEN GREENFIELD`, `Book Launch`, `HUME MOVIE NIGHT`, `TACOS + TEQUILA`, `SUNSET SERVE`, `Saturday Social` variants, `Spring Equinox`, `Summer Solstice`, `Friday Night Lights`, etc.) | Events              |
| `Complimentary Ceremonial Cacao Tasting`                                                                                                                                                                              | Events              |
| `A Beginner's Guide to Cold Plunge`                                                                                                                                                                                   | Workshops           |
| `5k TURKEY TROT`                                                                                                                                                                                                      | Events              |
| `Heal From Within Detox Masterclass`                                                                                                                                                                                  | Workshops           |
| `POWER & STRENGTH 50`                                                                                                                                                                                                 | Classes             |
| `Sunset Practice`                                                                                                                                                                                                     | Classes             |
| `New Year's Practice`                                                                                                                                                                                                 | Classes             |
| `Sunchasers at Sunset`                                                                                                                                                                                                | Events              |
| `Train Smart with Endurance Expert`                                                                                                                                                                                   | Workshops           |
| Various `WORKSHOP:` prefixed names                                                                                                                                                                                    | Workshops           |
| `CONNECT: The Intersection of Pilates, Yoga & Breath`                                                                                                                                                                 | Workshops           |
| `BOX + FLOW 60: Shadowboxing + Animal Flow (High Roof)`                                                                                                                                                               | Classes             |
| `PULSE & PRESENCE: A LIVE MUSIC FLOW`                                                                                                                                                                                 | Events              |
| `RECEIVE + RELEASE: Heart Opening Flow 60 (Rooftop)`                                                                                                                                                                  | Classes             |
| `Active Alignment with Dr. Hannah Venus`                                                                                                                                                                              | Private Treatment   |
| `Exploring the Human Emotional Experience`                                                                                                                                                                            | Workshops           |
| `TEACHER WORKSHOP` variants                                                                                                                                                                                           | Workshops           |
| `Upcycle x Saturday Social`                                                                                                                                                                                           | Events              |
| `DIVINE FEMININE FLOW` variants                                                                                                                                                                                       | Classes             |
| `Breath & Sound 30`                                                                                                                                                                                                   | Classes             |
| `Movement, Meditation & Breathwork`                                                                                                                                                                                   | Classes             |
| `SPINAL HEALTH & LONGEVITY 60`                                                                                                                                                                                        | Classes             |
| `Heart-Opening Yin and Tea (Heated)`                                                                                                                                                                                  | Classes             |
| `Fundamentals of Weight Training`                                                                                                                                                                                     | Classes             |
| `Morning Practice` (no room suffix)                                                                                                                                                                                   | Classes             |


---

## Technical Implementation

### 1. Database Migration

- Add `reservation_type TEXT` to `arketa_classes` and `daily_schedule`
- Create `classify_reservation_type(TEXT) RETURNS TEXT` function with the pattern-matching rules above
- Backfill existing rows: `UPDATE arketa_classes SET reservation_type = classify_reservation_type(name)`

### 2. Update `refresh_daily_schedule` RPC

Add `reservation_type` to the `INSERT INTO daily_schedule` SELECT, calling `classify_reservation_type(c.name)`.

### 3. Update `upsert_arketa_classes_from_staging` RPC

Compute `reservation_type` during upsert from staging so new synced classes are auto-classified.

### 4. Update `import-arketa-csv` Edge Function

Set `reservation_type` when inserting classes from CSV imports.

### 5. Frontend

No UI changes required unless you want to display/filter by `reservation_type` later. The column will be available in the data layer immediately.