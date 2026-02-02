# Checklist Template Role Mapping

Generated: 2026-02-02

## Uncategorized Templates (Require Role Assignment)

### FLOATER Role Templates

#### Template: a1111111-1111-1111-1111-111111111111
- **Assigned Role**: `floater`
- **Shift**: `AM` (Weekday Early - 5:40 AM start)
- **Item Count**: 14
- **Category**: Opening
- **Tasks**: Unlock patio doors, sauna checks, spa water setup, theraguns, HBOT, rooftop equipment
- **Recommendation**: Weekday AM opening checklist

#### Template: a3333333-3333-3333-3333-333333333333
- **Assigned Role**: `floater`
- **Shift**: `AM` (Weekend Late - 6:40 AM start)
- **Item Count**: 14
- **Category**: Opening
- **Tasks**: Same as a1111111 but 1 hour later start time
- **Recommendation**: Weekend AM opening checklist OR merge with a1111111 and use time-conditional tasks

#### Template: a2222222-2222-2222-2222-222222222222
- **Assigned Role**: `floater`
- **Shift**: `PM` (Full Close - 8:30 PM end)
- **Item Count**: 29
- **Category**: Closing
- **Tasks**: Close curtains, dump spa water, towel restocking, sauna off, locker checks, final walkthrough
- **Recommendation**: Full PM closing checklist

#### Template: a4444444-4444-4444-4444-444444444444
- **Assigned Role**: `floater`
- **Shift**: `PM` (Early Close - 6:30 PM end)
- **Item Count**: 29
- **Category**: Closing
- **Tasks**: 95% identical to a2222222, only differ in closing times
- **Recommendation**: Early PM closing checklist OR merge with a2222222

## Categorized Templates (Already Assigned)

### Concierge Templates

#### Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1
- **Assigned Role**: `concierge`
- **Shift**: `AM`
- **Item Count**: 50
- **Category**: Mixed (no category field)
- **Time Hints**: Hourly from 5:30 AM - 12:00 PM
- **Tasks**: Submit opener checklist, cardio room curtains, walkthroughs, spa checks, break times

#### Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a
- **Assigned Role**: `concierge`
- **Shift**: `PM`
- **Item Count**: 32
- **Category**: Mixed
- **Time Hints**: Hourly from 7:00 AM - 12:00 PM
- **Tasks**: Submit opener checklist, IV sign, appointment reviews, walkthroughs, spa checks

#### Template: f6d03214-8486-4339-a5bc-97535d2fa0ee
- **Assigned Role**: `concierge`
- **Shift**: `PM`
- **Item Count**: 37
- **Category**: Mixed
- **Time Hints**: Hourly from 12:00 PM - 9:00 PM
- **Tasks**: Men's spa checks, walkthroughs, break times, closing checklist

### Cafe Templates

#### Template: 439b53bd-d394-4b05-8564-69b65c96c1c7
- **Assigned Role**: `concierge` (likely should be `cafe` or separate role)
- **Shift**: `AM`
- **Item Count**: 62
- **Category**: Opening
- **Tasks**: Opening checklist, daily tasks, closing checklist, cafe operations
- **Note**: Contains "Clock In ON TIME", "Proof Entire Cafe" - suggests cafe staff

### Spa Attendant Templates

#### Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a
- **Assigned Role**: `female_spa_attendant` (inferred)
- **Shift**: `AM`
- **Item Count**: 41
- **Tasks**: Break requirements, walkie talkie, restocking, cleaning

#### Template: a0a505be-f800-4fc4-87f9-d3603061705b
- **Assigned Role**: `female_spa_attendant` (inferred)
- **Shift**: `PM`
- **Item Count**: 41
- **Tasks**: Break requirements, walkie talkie, restocking, cleaning

#### Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6
- **Assigned Role**: `male_spa_attendant` (inferred)
- **Shift**: `AM`
- **Item Count**: 35
- **Tasks**: Break requirements, spa maintenance

#### Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1
- **Assigned Role**: `male_spa_attendant` (inferred)
- **Shift**: `PM`
- **Item Count**: 34
- **Tasks**: Break requirements, spa maintenance

### Trainer Templates

#### Template: f169c325-e872-4d68-b957-7b35ac3f9add
- **Assigned Role**: `trainer` (inferred)
- **Shift**: `AM`
- **Item Count**: 29
- **Tasks**: Walkie talkie, class schedule review, class setup

#### Template: a8ae8176-624e-499f-910f-5136194f68b7
- **Assigned Role**: `trainer` (inferred)
- **Shift**: `PM`
- **Item Count**: 28
- **Tasks**: Walkie talkie, class schedule review, class setup

#### Template: cdd9e53a-e618-4000-8a1e-dfd3413592be
- **Assigned Role**: `trainer` (inferred)
- **Shift**: `AM` or `PM`
- **Item Count**: 25
- **Tasks**: Walkie talkie, class schedule review

### General/Mixed Templates

#### Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b
- **Assigned Role**: TBD (needs review)
- **Shift**: TBD
- **Item Count**: 46
- **Tasks**: Towel restocking, spa checks, general maintenance

#### Template: 4a32322b-2d85-467d-b0c1-bea7267d060e
- **Assigned Role**: TBD (needs review)
- **Shift**: PM
- **Item Count**: 37
- **Tasks**: Break requirements, general duties

#### Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f
- **Assigned Role**: TBD (needs review)
- **Shift**: AM
- **Item Count**: 32
- **Tasks**: Break requirements, general duties

#### Template: ecfbdc24-b68c-4647-b23f-16474e2e198f
- **Assigned Role**: TBD (needs review)
- **Shift**: AM
- **Item Count**: 30
- **Tasks**: Break requirements, general duties

#### Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53
- **Assigned Role**: TBD (needs review)
- **Shift**: AM
- **Item Count**: 30
- **Tasks**: Break requirements, general duties

#### Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6
- **Assigned Role**: `concierge` (likely)
- **Shift**: AM or PM
- **Item Count**: 27
- **Tasks**: Review updates, appointments, classes, events, walkthroughs

## Duplicate Analysis

### Near-Duplicates (95%+ Similarity)

1. **a1111111 vs a3333333** (Opening Floater)
   - Only difference: Start times (5:40 AM vs 6:40 AM)
   - Recommendation: Merge and use shift-conditional logic

2. **a2222222 vs a4444444** (Closing Floater)
   - Only difference: Closing times (8:30 PM vs 6:30 PM)
   - Recommendation: Merge and use shift-conditional logic

## Action Items

1. ✅ Export template mapping to JSON
2. ⏳ Create migration SQL for schema updates
3. ⏳ Insert FLOATER templates (4 uncategorized)
4. ⏳ Assign roles to remaining templates
5. ⏳ Merge duplicate templates
6. ⏳ Import CSV data with task_type, time_hint, etc.
