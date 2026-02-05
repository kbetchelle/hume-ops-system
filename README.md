# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## API syncing (Arketa)

Manual sync for Arketa (clients, reservations, payments, subscriptions) is available from **Dev Tools → API Syncing**. It requires Supabase Edge Function secrets:

- **`ARKETA_PARTNER_ID`** – required for all Arketa syncs
- **`ARKETA_API_KEY`** – required for token refresh and as fallback auth

Set these in the Supabase project under **Edge Functions → Secrets**. If either is missing, sync will fail with a credentials error.

**Toast API sync troubleshooting:**

- Set Edge Function secrets: **`TOAST_CLIENT_ID`**, **`TOAST_CLIENT_SECRET`**, **`TOAST_RESTAURANT_GUID`** (Supabase → Edge Functions → Secrets). If any are missing, sync fails with "Toast API credentials not configured".
- On the API Syncing overview, failed syncs show the **last error** under the status badge; hover for full text.
- **Sync Log History** tab: filter by `toast_sales`, enable "Error alerts", and check `error_message` for auth/fetch failures (e.g. wrong GUID, rate limits, endpoint changes).

**Inspecting errors (all APIs):**

- **Toast** – After "Sync Now", the toast shows the error message from the sync or "Failed to trigger X sync" if the runner could not be invoked.
- **Sync Log History** – On the API Syncing page, open the "Sync Log History" tab and filter by API (e.g. `arketa_clients`, `toast_sales`). Enable "Error alerts" to see failed runs; each row shows `error_message` and `response_status`.
- **Supabase Dashboard** – Edge Function logs for `refresh-arketa-token`, `sync-arketa-clients`, `sync-arketa-reservations`, `sync-arketa-payments`, `sync-arketa-subscriptions`, `sync-toast-orders`, and `scheduled-sync-runner` show the exact errors and API responses.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
