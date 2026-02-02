
# Add Password Visibility Toggle to Login Page

## Overview
Add an eye icon button to the password input field on the login page (/) that allows users to toggle password visibility between hidden (dots) and visible (plain text).

## What Will Be Done

### Add Password Visibility Toggle
- Add a new state variable `showPassword` to track visibility
- Import the `Eye` and `EyeOff` icons from lucide-react
- Wrap the password input in a relative container
- Add a clickable icon button positioned at the right side of the input
- Toggle the input type between "password" and "text" based on state

## Implementation

### Changes to src/pages/auth/Login.tsx

1. **Add state for password visibility**
   ```typescript
   const [showPassword, setShowPassword] = useState(false);
   ```

2. **Import eye icons**
   ```typescript
   import { Loader2, Eye, EyeOff } from "lucide-react";
   ```

3. **Update password field with toggle button**
   - Wrap input in a `div` with `relative` positioning
   - Change input type dynamically: `type={showPassword ? "text" : "password"}`
   - Add an icon button that toggles the state
   - Use `Eye` icon when password is hidden, `EyeOff` when visible

### Visual Design
- Icon positioned at the right edge of the input field
- Subtle opacity with hover effect for better UX
- Maintains the existing minimalist aesthetic
- Icon sized appropriately (h-4 w-4) to match the input styling

### Files to Modify
- `src/pages/auth/Login.tsx`
