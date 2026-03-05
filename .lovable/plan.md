

## Lowercase Normalization for Sign-In

### Problem
The Login page trims the input but does not lowercase it before passing to `signIn()`. If a user types `John@Example.com`, it's sent as-is to Supabase Auth, which may fail if the stored email is `john@example.com`. The same issue exists in `UserSwitchScreen` and `LockScreen`.

The `get_email_by_username` RPC already does `lower(trim())` comparison, so username lookup is fine — but the resolved email and direct email entries still need lowercasing.

### Changes

**1. `src/pages/auth/Login.tsx` (line 71)**
- Change `identifier` to also `.toLowerCase()` so both email and username paths get lowercased
- The resolved email from `get_email_by_username` should also be lowercased (defensive)

```typescript
// Before
const identifier = (data.emailOrUsername ?? "").trim();

// After  
const identifier = (data.emailOrUsername ?? "").trim().toLowerCase();
```

**2. `src/components/mobile/UserSwitchScreen.tsx` (line 41)**
- Lowercase the email before passing to `onSignIn`

```typescript
// Before
const { error: err, userId: newUserId } = await onSignIn(email.trim(), password);

// After
const { error: err, userId: newUserId } = await onSignIn(email.trim().toLowerCase(), password);
```

**3. `src/components/auth/LockScreen.tsx` (line 52)**
- Lowercase the email before passing to `onUnlock`

```typescript
// Before
const { error: err } = await onUnlock(email.trim(), password);

// After
const { error: err } = await onUnlock(email.trim().toLowerCase(), password);
```

**4. `src/hooks/useAuth.ts` — `signIn` method (defensive)**
- Lowercase the email parameter in the `signIn` function as a catch-all safety net

All changes are single-line modifications — no structural changes needed.

