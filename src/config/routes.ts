/**
 * Centralized Route Configuration for Nexuso
 * 
 * This file provides a single source of truth for all application routes.
 * Use the ROUTES object and useRoute() hook to navigate programmatically.
 * Use the Link components with ROUTES.<route>.path for declarative navigation.
 * 
 * Benefits:
 * - Single source of truth for all paths
 * - Type-safe route references
 * - Easy to update routes globally
 * - IDE autocomplete support
 */

// ============================================================================
// Route Path Constants
// ============================================================================

export const ROUTES = {
  // Root
  ROOT: '/',
  
  // Landing Page
  LANDING: '/landing',
  
  // Auth Routes
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  
  // Dashboard Routes
  DASHBOARD: {
    ROOT: '/dashboard',
    ENTREPRENEUR: '/dashboard/entrepreneur',
    INVESTOR: '/dashboard/investor',
  },
  
  // Profile Routes
  PROFILE: {
    ROOT: '/profile',
    ENTREPRENEUR: (id: string) => `/profile/entrepreneur/${id}`,
    INVESTOR: (id: string) => `/profile/investor/${id}`,
    CREATE_ENTREPRENEUR: '/profile/create/entrepreneur',
    CREATE_INVESTOR: '/profile/create/investor',
  },
  
  // Feature Routes - Investors
  INVESTORS: '/investors',
  
  // Feature Routes - Entrepreneurs
  ENTREPRENEURS: '/entrepreneurs',
  
  // Feature Routes - Messages
  MESSAGES: '/messages',
  
  // Feature Routes - Notifications
  NOTIFICATIONS: '/notifications',
  
  // Feature Routes - Documents
  DOCUMENTS: '/documents',
  
  // Feature Routes - Settings
  SETTINGS: '/settings',
  
  // Feature Routes - Help
  HELP: '/help',
  
  // Feature Routes - Deals
  DEALS: '/deals',
  
  // Calendar
  CALENDAR: '/calendar',
  
  // Video
  VIDEO: {
    ROOT: '/video',
    ROOM: (roomId: string) => `/video/${roomId}`,
  },
  
  // Chat
  CHAT: {
    ROOT: '/chat',
    CONVERSATION: (userId: string) => `/chat/${userId}`,
  },
  
  // Fallback Routes
  NOT_FOUND: '/404',
} as const;

// ============================================================================
// Route Type Definitions
// ============================================================================

export type RouteKey = keyof typeof ROUTES;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a path with dynamic parameters
 */
export const generatePath = (
  route: string,
  params: Record<string, string | number> = {}
): string => {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    route
  );
};

/**
 * Parses current location to determine route name (for debugging/tracking)
 */
export const parseRouteFromPath = (pathname: string): string => {
  // Match exact routes first
  for (const [key, value] of Object.entries(ROUTES)) {
    if (typeof value === 'string' && value === pathname) {
      return key;
    }
    if (typeof value === 'object' && 'ROOT' in value && value.ROOT === pathname) {
      return key;
    }
  }
  
  // Match dynamic routes
  if (pathname.startsWith('/profile/entrepreneur/')) return 'PROFILE.ENTREPRENEUR';
  if (pathname.startsWith('/profile/investor/')) return 'PROFILE.INVESTOR';
  if (pathname.startsWith('/video/') && pathname !== '/video') return 'VIDEO.ROOM';
  if (pathname.startsWith('/chat/') && pathname !== '/chat') return 'CHAT.CONVERSATION';
  
  return 'UNKNOWN';
};

// ============================================================================
// Default Redirects
// ============================================================================

export const DEFAULT_REDIRECT = ROUTES.AUTH.LOGIN;
export const ROOT_REDIRECT = ROUTES.LANDING;