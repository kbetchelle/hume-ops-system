

## Add AI Writer Feedback System

### What It Does
After the AI generates a response, a small feedback section appears below the hallucination warning. Staff can rate the response (thumbs up/down) and optionally leave a note explaining what was wrong or what could be improved. This feedback is stored in the database and injected into the AI's system prompt as learning examples, so the model progressively adapts to HUME's preferences.

### Database

**New table: `ai_writer_feedback`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | Who submitted the feedback |
| rating | text | `positive` or `negative` |
| feedback_text | text (nullable) | Optional note from the user |
| ai_input | text | The original prompt/situation |
| ai_output | text | The generated response |
| ai_mode | text | `compose` or `polish` |
| template_guide_id | uuid (nullable) | Which template was used, if any |
| created_at | timestamptz | |

RLS: authenticated users can insert their own rows; managers/admins can read all rows.

### Frontend Changes (ResponseTemplatesWithAI.tsx)

Below the hallucination warning, add a compact feedback row:

- Two icon buttons: **ThumbsUp** and **ThumbsDown**
- When clicked, the selected button highlights and a small optional text input slides in: *"What could be improved?"* (for negative) or *"What did it get right?"* (for positive)
- A small "Submit" button saves the feedback
- After submission, the row shows a "Thanks for your feedback" confirmation and locks

### Backend Changes (hume-voice-writer edge function)

- After fetching the policy text, also fetch the **5 most recent negative feedback entries** from `ai_writer_feedback`
- Append them to the system prompt as a new section:

```
## Recent Feedback (Learning Context)
Staff have flagged these patterns to avoid or improve:
1. [feedback_text] — regarding: [truncated ai_input]
2. ...
```

- This gives the model concrete examples of what to avoid, effectively "training" it through prompt context without actual fine-tuning
- Only negative feedback is included (positive feedback confirms the model is on track but doesn't need corrective action)
- Capped at 5 entries and truncated to stay within token limits

### Technical Details

- Feedback is saved via the `data-api` edge function (consistent with the rest of the app)
- The `ai_input` and `ai_output` are stored so managers can later review what triggered the feedback
- The backend truncates each feedback entry to ~200 characters to keep the prompt lean
