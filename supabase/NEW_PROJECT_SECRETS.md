# Secrets & env for new Supabase project

After pushing migrations and deploying edge functions to a new project (e.g. `aypdvbnyjuzdzxofdhnd`), set these in the **new** project so functions and cron work.

**Where to set:** Dashboard → Project → **Settings** → **Edge Functions** → **Secrets**, or via CLI: `supabase secrets set NAME=value`.

## Edge Function secrets

| Secret | Used by | Notes |
|--------|---------|--------|
| `SUPABASE_URL` | Most functions | Project URL, e.g. `https://aypdvbnyjuzdzxofdhnd.supabase.co` (often auto-set). |
| `SUPABASE_SERVICE_ROLE_KEY` | Most functions | Service role key from Dashboard → Settings → API. |
| `ARKETA_API_KEY` | Arketa sync/backfill | From Arketa dashboard. |
| `ARKETA_PARTNER_ID` | Arketa sync/backfill | Your Arketa partner ID. |

Add any other third-party keys your functions use (Calendly, Sling, Toast, etc.) from your previous project or env.

## pg_cron (Database settings)

Cron jobs (e.g. `check-mat-cleaning`, `cleanup-archived-packages`, `send-package-reminders`) use:

- `app.supabase_url` – project URL
- `app.supabase_service_role_key` – service role key

Set these in **Dashboard → Project → Settings → Database** under “Database settings” (or the equivalent for custom config / `ALTER DATABASE`), so cron can call your edge functions. See migration `20260227120000_check_mat_cleaning_cron.sql` for usage.

## Checklist

- [ ] Edge Function secrets set (Dashboard or `supabase secrets set`)
- [ ] `app.supabase_url` and `app.supabase_service_role_key` set for pg_cron (if using cron)
- [ ] App/frontend env updated to use the new project URL and anon key
