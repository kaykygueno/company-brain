import { query } from "./_generated/server";

// Minimal health-check query — confirms the Convex dev environment is reachable.
export const ping = query({
  args: {},
  handler: async () => {
    return { status: "ok", message: "Convex is connected" };
  },
});
