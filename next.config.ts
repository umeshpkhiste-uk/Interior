import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components / PPR intentionally left off: nearly every route in this
  // app renders per-organization, RLS-scoped data behind auth, so there is
  // little to gain from partial prerendering and it would force Suspense
  // boundaries around almost every data-fetching component for no benefit.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
