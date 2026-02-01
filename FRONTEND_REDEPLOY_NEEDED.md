# URGENT: Frontend Not Updated - Redeploy Required

## Problem
The code fix for field mapping is in Git, but your deployed frontend is still serving the old JavaScript bundle with the broken mapping logic.

## Solution: Rebuild & Redeploy

### Option 1: If using Vercel/Netlify (Auto-deploy from Git)
Just wait 2-3 minutes for the automatic deployment to complete after the git push.
Check your deployment dashboard:
- Vercel: https://vercel.com/dashboard
- Netlify: https://app.netlify.com/

### Option 2: If using npm build + manual deploy
```bash
cd /Volumes/SSDdeKat/HUME_Project/hume-ops-system
npm run build  # or yarn build
# Then deploy the /build or /dist folder to your hosting
```

### Option 3: If running local dev server
```bash
# Stop the current dev server (Ctrl+C)
cd /Volumes/SSDdeKat/HUME_Project/hume-ops-system
npm start  # or yarn start / npm run dev
# Then hard refresh browser (Cmd+Shift+R)
```

### Option 4: If using Supabase Hosting
```bash
cd /Volumes/SSDdeKat/HUME_Project/hume-ops-system
npm run build
# Deploy to your hosting platform
```

## Verify the Fix Worked

After redeploying, check the browser console's Network tab:
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Network tab
3. Reload page (Cmd+Shift+R)
4. Look for main JavaScript bundle (e.g., `main.js`, `app.js`)
5. Check the timestamp - it should be recent (last few minutes)

## Quick Test
Once redeployed, upload your CSV and check the field mappings table. You should see:
- ✅ `client_id` → `client_id` (NOT `id`)
- ✅ `amount_refunded` → `amount_refunded` (NOT `amount`)

If you still see the wrong mappings, the old bundle is still cached.
