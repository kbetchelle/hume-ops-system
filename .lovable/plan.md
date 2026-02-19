

## Feed Internal Policies into the AI Writer

### What Changes
The `hume-voice-writer` backend function will fetch the published "HUME Concierge Internal Policies" resource page from the database and inject its full text into the system prompt as a policy reference section. This ensures every AI-generated response respects the actual rules (pause policy, guest limits, pricing, cancellation terms, etc.) without the concierge needing to remember or paste them.

### How It Works

1. **Backend function (`hume-voice-writer`)** -- on every request:
   - Create a Supabase service-role client inside the function
   - Query `resource_pages` for the published policy page (matching by title or a known ID)
   - Append the policy text to the system prompt as a new `## Internal Policies` section with clear instructions: "Your responses must never contradict these rules. Reference them when relevant but never quote them verbatim or say 'per our policy.'"

2. **System prompt addition** (appended dynamically):
   ```
   ## HUME Internal Policies (Authoritative Reference)
   The following are the official internal policies. Your responses must
   align with these rules. Never contradict them. Do not quote them
   directly or reference them as "policy" -- instead, communicate the
   information naturally in the HUME voice.

   [full policy text inserted here]
   ```

3. **No frontend changes needed** -- the AI Writer UI stays exactly the same. The policy context is injected server-side automatically.

### Why This Approach
- Policies are fetched live from the database, so any updates managers make to the policy page are immediately reflected in AI responses
- The policy text is ~5,700 characters, well within model context limits
- No changes to the client-side code or UI required
- The system prompt instructs the model to internalize the rules without citing "policy" (matching the existing voice guidelines)

### Edge Cases
- If the policy page is unpublished or missing, the function still works -- it just omits the policy section and logs a warning
- If the page grows very large in the future, the text is truncated to a safe limit (e.g., 15,000 characters) to stay within token budgets

