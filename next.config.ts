import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // `images.domains` was removed in Next 16 — remotePatterns only.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    // Next 16 narrowed the default to [75] and coerces the `quality` prop to the
    // nearest allowed value, so hero art needs 90 declared explicitly.
    qualities: [75, 90],
  },

  // Mongoose pulls in optional native deps it does not need at runtime; keeping
  // it external stops the bundler from trying to trace them.
  serverExternalPackages: ["mongoose"],

  typedRoutes: true,
};

export default withNextIntl(nextConfig);
