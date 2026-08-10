import type {
  CropRatio,
  CropRect,
  GalleryDisplay,
  GalleryGroup,
  GalleryImage,
  GallerySpan,
  Lifecycle,
  LinkAccess,
  LinkKind,
  Localized,
  PartnerKind,
  PartnerRole,
  Platform,
  PublishStatus,
  StoredImage,
  TeamMember,
} from "@/lib/content-enums";

export type {
  CropRatio,
  CropRect,
  GalleryDisplay,
  GalleryGroup,
  GalleryImage,
  GallerySpan,
  Lifecycle,
  LinkAccess,
  LinkKind,
  Localized,
  PartnerKind,
  PartnerRole,
  Platform,
  PublishStatus,
  StoredImage,
  TeamMember,
};

type Base = {
  id: string;
  status: PublishStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Partner = Base & {
  slug: string;
  name: string;
  logo?: StoredImage;
  url?: string;
  kind: PartnerKind;
  description: Localized;
};

/**
 * `url` is optional at the type level because the query layer removes it for
 * any link that is not publicly accessible — the shape survives so the button
 * still renders, the address does not.
 */
export type ProjectLink = {
  kind: LinkKind;
  label?: Localized;
  url?: string;
  access: LinkAccess;
};

/** As stored: `partner` is an id. */
export type ProjectPartner = {
  partner: string;
  role: PartnerRole;
  url?: string;
};

/** As read by the detail page, which populates the reference. */
export type ProjectPartnerResolved = Omit<ProjectPartner, "partner"> & {
  partner: Partner | null;
};

export type Project = Base & {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  problem: Localized;
  platforms: Platform[];
  lifecycle: Lifecycle;
  techStack: string[];
  role: Localized;
  responsibilities: { en: string[]; id: string[] };
  outcomes: { en: string[]; id: string[] };
  startDate: string | null;
  endDate: string | null;
  team: TeamMember[];
  /** @deprecated Read-only fallback for documents written before `team`. */
  teamSize: number | null;
  coverImage?: StoredImage;
  gallery: GalleryImage[];
  galleryDisplay: GalleryDisplay;
  galleryGroups: GalleryGroup[];
  links: ProjectLink[];
  partners: ProjectPartner[];
  featured: boolean;
  year: number;
};

/** A project read through `getProjectBySlug`, whose partners are populated. */
export type ProjectDetail = Omit<Project, "partners"> & {
  partners: ProjectPartnerResolved[];
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
