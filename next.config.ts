import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Cloudinary optimises instead of Next: it can apply a stored crop, resize
    // and negotiate AVIF/WebP in one transformation, where the built-in
    // optimizer would decode and re-encode an asset the CDN already serves
    // correctly. See src/lib/images/loader.ts — non-Cloudinary sources pass
    // through it untouched.
    loader: "custom",
    loaderFile: "./src/lib/images/loader.ts",

    // `images.domains` was removed in Next 16 — remotePatterns only. Kept even
    // though a custom loader means Next never fetches these itself: the config
    // still documents which hosts are expected.
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
