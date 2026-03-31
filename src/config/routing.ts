/**
 * Custom routing hooks for type-safe navigation
 * 
 * Provides a type-safe wrapper around react-router-dom's useNavigate
 * with autocomplete support for all routes defined in config/routes.ts
 */

import { useNavigate, useLocation, Link as ReactRouterLink, LinkProps } from 'react-router-dom';
import { ROUTES, generatePath, parseRouteFromPath } from './routes';

/**
 * Navigation helper with type-safe route references
 * 
 * Usage:
 *   const { navigate } = useRouting();
 *   
 *   // String paths (backward compatible)
 *   navigate('/dashboard');
 *   
 *   // Route constants (type-safe)
 *   navigate(ROUTES.DASHBOARD.ENTREPRENEUR);
 *   
 *   // Dynamic routes with parameters
 *   navigate(ROUTES.PROFILE.ENTREPRENEUR('123'));
 *   navigate(ROUTES.VIDEO.ROOM('abc'));
 *   navigate(ROUTES.CHAT.CONVERSATION('user-456'));
 */
export const useRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    /** Navigate to a path (string or ROUTES constant) */
    navigate: (
      to: string,
      options?: {
        replace?: boolean;
        state?: Record<string, unknown>;
      }
    ) => {
      navigate(to, {
        replace: options?.replace ?? false,
        state: options?.state,
      });
    },

    /** Navigate back in history */
    back: () => {
      navigate(-1);
    },

    /** Get current route info */
    currentRoute: parseRouteFromPath(location.pathname),
    
    /** Current pathname */
    pathname: location.pathname,
    
    /** Check if on a specific route */
    isRoute: (path: string) => location.pathname === path,
    
    /** Check if route starts with prefix */
    isRouteStartWith: (prefix: string) => location.pathname.startsWith(prefix),
  };
};

/**
 * Hook for getting route path by key (for Link components)
 * 
 * Usage:
 *   const { getPath } = useRoute();
 *   <Link to={getPath('DASHBOARD.ENTREPRENEUR')}>Dashboard</Link>
 */
export const useRoute = () => {
  return {
    /** Direct access to ROUTES */
    routes: ROUTES,
  };
};

// Re-export Link for convenience
export { ReactRouterLink as RouteLink };

// Re-export ROUTES for use in components
export { ROUTES };

// Re-export helpers
export { generatePath, parseRouteFromPath };

// Type export for external use
export type { LinkProps };