import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@openclaw/server/routers';

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Get the base URL for API calls
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  // SSR should use absolute path
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

// Create a vanilla tRPC client for server-side usage
export const vanillaTrpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
