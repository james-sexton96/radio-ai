// File: frontend/src/lib/pocketbase.ts

import PocketBase from 'pocketbase';

// URL for client-side (browser) PocketBase access.
// This will be http://localhost:8090 when running with Docker Compose,
// as defined in docker-compose.yml and .env.local.
const clientSideUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * PocketBase client instance for client-side (browser) usage.
 * It connects to the PocketBase URL exposed to the host machine.
 */
export const pb = new PocketBase(clientSideUrl);

// URL for server-side (Next.js API routes, server components) PocketBase access.
// This uses the Docker service name 'pocketbase' and its internal port 8090.
const serverSideUrl = 'http://pocketbase:8090';

/**
 * PocketBase client instance for server-side usage (e.g., in API routes).
 * It connects directly to the PocketBase service over the internal Docker network.
 *
 * IMPORTANT: It's generally recommended to create a new PocketBase instance
 * for each server-side request to avoid issues with shared authentication state
 * if you were to, for example, authenticate the pbServer instance directly.
 * However, for basic non-authed admin actions or if you manage auth state carefully,
 * a shared instance can be used. For user-specific actions, you'd typically
 * re-initialize or load auth state into an instance per request.
 * For this MVP, we'll provide this shared server instance, and specific API routes
 * will handle authentication as needed (e.g., by not using pbServer.authStore directly).
 */
export const pbServer = new PocketBase(serverSideUrl);

// You can also add a helper function if you want to dynamically get a client,
// though for this project, exporting two distinct clients is clear.
// Example:
// export const getPocketBaseInstance = (isServerContext: boolean = false) => {
//   if (isServerContext || typeof window === 'undefined') {
//     return new PocketBase(serverSideUrl); // Or return the shared pbServer
//   }
//   return pb; // Or new PocketBase(clientSideUrl)
// };

// To persist auth store to cookies (useful for server-side rendering and API routes)
// This should be called once, typically in a layout or context provider.
// We will handle this more specifically when setting up AuthContext.
// pb.authStore.onChange(() => {
//   if (typeof document !== 'undefined') { // Ensure this runs only on the client-side
//     document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
//   }
// });
