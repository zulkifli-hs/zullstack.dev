import type { Localized, PublishStatus, StoredImage } from "@/lib/models/shared";

export type { Localized, PublishStatus, StoredImage };

type Base = {
  id: string;
  status: PublishStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Project = Base & {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  category: "web" | "mobile" | "backend" | "devops" | "other";
  techStack: string[];
  role: Localized;
  coverImage?: StoredImage;
  gallery: StoredImage[];
  repoUrl?: string;
  liveUrl?: string;
  featured: boolean;
  year: number;
};

export type Experience = Base & {
  company: string;
  companyUrl?: string;
  logo?: StoredImage;
  position: Localized;
  employmentType: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  location: string;
  locationType: "onsite" | "hybrid" | "remote";
  startDate: string;
  endDate: string | null;
  current: boolean;
  highlights: { en: string[]; id: string[] };
  techStack: string[];
};

export type MentoringTrack = Base & {
  slug: string;
  track: Localized;
  description: Localized;
  level: "beginner" | "intermediate" | "advanced";
  topics: { en: string[]; id: string[] };
  format: "1-on-1" | "group" | "workshop" | "async";
  duration: Localized;
  outcomes: { en: string[]; id: string[] };
  icon: string;
};

export type Article = Base & {
  slug: string;
  title: Localized;
  excerpt: Localized;
  /** Rendered HTML per locale, produced by the admin editor at save time. */
  content: Localized;
  coverImage?: StoredImage;
  tags: string[];
  readingTime: number;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
};

export type Testimonial = Base & {
  name: string;
  role: Localized;
  company: string;
  avatar?: StoredImage;
  quote: Localized;
  relationship: "client" | "student" | "colleague";
  rating: number;
  featured: boolean;
};

export type Resource = Base & {
  title: Localized;
  description: Localized;
  type: "article" | "video" | "course" | "tool" | "book" | "documentation";
  url: string;
  tags: string[];
  level: "beginner" | "intermediate" | "advanced";
  free: boolean;
};

export type OpenSourceProject = Base & {
  name: string;
  description: Localized;
  repoUrl: string;
  role: "author" | "maintainer" | "contributor";
  language: string;
  stars: number;
  topics: string[];
};

export type Snippet = Base & {
  slug: string;
  title: Localized;
  description: Localized;
  language: string;
  code: string;
  embedProvider: "codesandbox" | "replit" | "stackblitz" | "none";
  embedUrl?: string;
  tags: string[];
};

export type SiteConfig = {
  id: string;
  name: string;
  tagline: Localized;
  bio: Localized;
  avatar?: StoredImage;
  resumeUrl?: string;
  email: string;
  location: string;
  socials: { platform: string; url: string; handle: string }[];
  stats: { key: string; value: number; suffix: string }[];
  updatedAt: string;
};
