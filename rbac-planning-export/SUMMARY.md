# Role-Based Page Access: Current State Summary

Generated from `C:\Users\rambo\OneDrive\Documents\School-Management` on `2026-05-25`.

## What already exists

This project already has a meaningful RBAC foundation across frontend and backend:

- Frontend auth state is centralized in `src/context/AuthContext.jsx`.
- User roles are normalized in `src/utils/roles.js`.
- Permission checks helper exists in `src/utils/permissions.js`.
- Route/page permission mapping already exists in `src/constants/pageAccess.js`.
- A role management UI already exists in `src/pages/UserRoleAcl.jsx`.
- Backend exposes auth and RBAC APIs through:
  - `SMBackend/src/main/java/com/School/School_management/auth/AuthController.java`
  - `SMBackend/src/main/java/com/School/School_management/auth/RbacAdminController.java`
  - `SMBackend/src/main/java/com/School/School_management/auth/SchoolRbacController.java`
- Backend request protection is enforced by JWT interception and `@RequirePermission`:
  - `SMBackend/src/main/java/com/School/School_management/auth/JwtAuthInterceptor.java`
  - `SMBackend/src/main/java/com/School/School_management/auth/RequirePermission.java`

## Current frontend design

- `src/App.jsx` keeps the current page in client state and syncs it with the URL.
- `src/AppRoute.jsx` maps `pageKey` values to page components and passes route access metadata into `ProtectedRoute`.
- `src/components/Sidebar.jsx` contains the main desktop navigation structure and many menu-level permission hints.
- `src/components/mobileNavigationConfig.js` defines a separate mobile navigation model by role.
- `src/constants/pageAccess.js` is the closest thing to a page access registry today:
  - page groups
  - route access rules
  - default page-to-permission mapping
- `src/context/SchoolContext.jsx`, `src/utils/schoolScope.js`, and `src/hooks/useManualSchoolScope.js` show that access is also school-scope aware, not only role aware.

## Current backend design

- `AuthController.java` builds the `/api/auth/me` response, including:
  - normalized client role
  - permissions
  - home page
  - school/head office context
- `RbacService.java` resolves permissions for a role and school, including custom overrides.
- `SchoolRbacController.java` supports scoped role management for:
  - school-level roles
  - head-office propagated custom roles
- `CurrentUser.java`, `CurrentUserHolder.java`, and `SchoolGuard.java` carry request-scope identity and scope validation.
- `WebConfig.java` wires `JwtAuthInterceptor` onto `/api/**` except `/api/auth/**`.

## Important gaps and risks

These are the biggest things to plan around before building a new role-based page access page:

- `src/components/ProtectedRoute.jsx` is currently a stub that always returns children.
- `src/utils/pageAccess.js` is also a stub and currently returns `true` for every page.
- Desktop sidebar visibility is not fully enforced by real permission logic yet.
  - `src/components/Sidebar.jsx` currently contains permissive placeholders like `canOpenUserRoles = () => true`.
- Mobile navigation visibility is also not fully enforced.
  - `src/components/mobileNavigationConfig.js` currently has `isVisible = () => true`.
- Permission logic exists in constants and APIs, but some UI gating is still incomplete or duplicated.
- There are multiple layers defining access:
  - sidebar menu config
  - mobile navigation config
  - route definitions in `AppRoute.jsx`
  - page-permission constants
  This means the cleanest next step is probably to centralize page access decisions in one shared frontend source of truth.

## Suggested planning direction

For the new role-based page access page, a clean implementation path would be:

1. Define one frontend source of truth for `pageKey -> permission(s) -> visibility`.
2. Make both desktop sidebar and mobile navigation read from that source.
3. Replace the stubbed `ProtectedRoute.jsx` and `utils/pageAccess.js` with actual checks.
4. Keep backend as the source of permission ownership, but frontend as the source of page/menu visibility rules.
5. Decide whether the new page should manage:
   - raw permissions only
   - page access only
   - both permissions and page access mapping

## Files included in this export

### Frontend

- `src/App.jsx`
- `src/AppRoute.jsx`
- `src/components/Sidebar.jsx`
- `src/components/mobileNavigationConfig.js`
- `src/components/ProtectedRoute.jsx`
- `src/context/AuthContext.jsx`
- `src/context/SchoolContext.jsx`
- `src/utils/roles.js`
- `src/utils/permissions.js`
- `src/utils/pageAccess.js`
- `src/utils/currentUser.js`
- `src/utils/editableRoles.js`
- `src/utils/schoolScope.js`
- `src/hooks/useManualSchoolScope.js`
- `src/constants/pageAccess.js`
- `src/apis/apiClient.js`
- `src/apis/authApi.js`
- `src/apis/rbacApi.js`
- `src/apis/schoolRbacApi.js`
- `src/pages/UserRoleAcl.jsx`
- `src/pages/AccessDenied.jsx`

### Backend

- `SMBackend/src/main/java/com/School/School_management/config/WebConfig.java`
- `SMBackend/src/main/java/com/School/School_management/auth/AuthController.java`
- `SMBackend/src/main/java/com/School/School_management/auth/JwtAuthInterceptor.java`
- `SMBackend/src/main/java/com/School/School_management/auth/CurrentUser.java`
- `SMBackend/src/main/java/com/School/School_management/auth/CurrentUserHolder.java`
- `SMBackend/src/main/java/com/School/School_management/auth/Role.java`
- `SMBackend/src/main/java/com/School/School_management/auth/RequirePermission.java`
- `SMBackend/src/main/java/com/School/School_management/auth/RbacService.java`
- `SMBackend/src/main/java/com/School/School_management/auth/RbacAdminController.java`
- `SMBackend/src/main/java/com/School/School_management/auth/SchoolRbacController.java`
- `SMBackend/src/main/java/com/School/School_management/auth/SchoolGuard.java`

## Bottom line

You do not need to start this feature from scratch. The project already has:

- backend RBAC
- frontend role and permission context
- a role management screen
- page permission constants

The biggest missing piece is consolidating and actually enforcing page visibility consistently across route guards, sidebar, mobile navigation, and the new planning page.
