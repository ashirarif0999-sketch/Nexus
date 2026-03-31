# Bug Report: Saved Accounts Login Not Working

## Issue Summary

When clicking on a saved account in the saved accounts dropdown, the login process does not complete. The dropdown hides but the user is not logged in, and no 2FA prompt appears even if 2FA is enabled for that account.

## Root Cause Analysis

After analyzing the code in `src/pages/auth/AuthenticationPage.tsx`, I identified **multiple root causes**:

### 1. Hardcoded Password Issue (Primary)

In the `handleSelectSavedAccount` function (lines 103-145), the code uses a hardcoded password `'password123'`:

```typescript
const handleSelectSavedAccount = (account: SavedAccount, e: React.MouseEvent) => {
  // ... 
  setEmail(account.email);
  setPassword('password123'); // HARDCODED!
  setRole(account.role);
  
  setTimeout(async () => {
    // ... login logic
  }, 2000);
};
```

This hardcoded password is used for ALL saved accounts, regardless of what password they actually used. The `AuthContext.login()` function does NOT validate the password - it only checks if the user exists or creates a new one. However, this design is fundamentally flawed because:

- If a user originally registered with a different password, the saved account will use the wrong password
- There's no way to recover the actual password
- The hardcoded password assumes all users use "password123"

### 2. Missing Toast Notifications for Login Errors

When the login fails in `handleSelectSavedAccount` (line 138), the error is only set to state but NOT displayed to the user:

```typescript
} catch (error) {
  setError((error as Error).message);  // Error set to state but not shown!
} finally {
  setIsNavigating(false);
  setShowAccountsDropdown(false);  // Dropdown hides
}
```

Unlike the normal login form (which shows errors via toast from AuthContext), the saved account login does not show any user-facing error message when it fails. The dropdown simply disappears silently.

### 3. 2FA Check Happens But Is Not Visible

The 2FA check does happen in the flow (line 123):

```typescript
const requires2FA = is2FAEnabledForEmail(account.email);

if (requires2FA) {
  setPendingLogin({ email: account.email, password: 'password123', role: account.role });
  setShow2FA(true);  // Sets show2FA to true
} else {
  // login directly
}
```

However, there are issues:
- The 2FA state (`show2FA`) is set to `true` inside the 2-second timeout
- The login form is already rendered and won't re-render to show the 2FA input
- The timeout creates an unnecessary delay

### 4. No Loading Feedback During Navigation

The `isNavigating` state is used to show a spinner inside the dropdown, but once the dropdown closes, there's no visual indication that login is in progress on the main form. The user sees:
1. Dropdown disappears
2. Nothing happens
3. No feedback that login is in progress

### 5. Form State Not Synced with Login Process

The function sets `email`, `password`, and `role` in state but doesn't trigger the login form to show these values or submit them. The login happens inside a `setTimeout` which is an anti-pattern.

## Code Flow Diagram

```
mermaid
flowchart TD
    A[User clicks saved account] --> B[handleSelectSavedAccount called]
    B --> C[Set isNavigating = true]
    C --> D[Set form state: email, password='password123', role]
    D --> E[Wait 2 seconds]
    E --> F[Check 2FA enabled?]
    F -->|Yes| G[Set show2FA=true]
    F -->|No| H[Call login()]
    G --> I[Form should show 2FA input]
    H --> J{Login Success?}
    J -->|Yes| K[Navigate to dashboard]
    J -->|No| L[Set error, close dropdown - NO USER FEEDBACK!]
    
    style L fill:#ffcccc
    style G fill:#ffffcc
```

## Why the User Experiences "Nothing Happens"

1. User clicks on saved account
2. Dropdown shows "Signing in..." spinner (lines 748-756)
3. After 2 seconds, either:
   - 2FA should appear but form doesn't update to show it, OR
   - Login attempt fails silently (wrong password for non-demo accounts)
4. Dropdown closes
5. User sees no change - appears "static"

## Recommendations for Fix

### Fix 1: Store password securely or remove password requirement
The saved accounts feature should either:
- Not require a password (auto-login for demo accounts only)
- Store a token/session instead of re-authenticating
- Use a proper "remember me" token system

### Fix 2: Add toast notification for errors
```typescript
// In handleSelectSavedAccount catch block:
} catch (error) {
  setError((error as Error).message);
  // Add: toast.error('Login failed. Please try again.');
}
```

### Fix 3: Remove unnecessary 2-second delay
The 2-second `setTimeout` serves no purpose and creates confusing UX.

### Fix 4: Ensure 2FA UI renders correctly
The 2FA state needs to be checked and rendered immediately when the login attempt completes.

### Fix 5: Show loading state on the login form
While navigating, show a loading indicator on the main login form, not just in the dropdown.

---

## Files Involved

| File | Issue |
|------|-------|
| `src/pages/auth/AuthenticationPage.tsx:103-145` | handleSelectSavedAccount function with hardcoded password |
| `src/pages/auth/AuthenticationPage.tsx:748-756` | Loading state in dropdown |
| `src/context/AuthContext.tsx:28-93` | Login function (no password validation) |
| `src/utils/2faStorage.ts:36-44` | 2FA check function |

## Test Case

To reproduce:
1. Go to login page
2. Enter any email (e.g., "testuser@example.com") with password "password123"
3. Login successfully
4. Account will be saved
5. Click on saved account
6. Observe: dropdown hides but nothing happens

Expected behavior:
- User should be logged in automatically
- OR 2FA prompt should appear if 2FA is enabled in settings of that user account
- OR clear error message if login fails