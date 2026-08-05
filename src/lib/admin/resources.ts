import type { Model } from "mongoose";

import {
  Article,
  Experience,
  MentoringTrack,
  OpenSource,
  Project,
  Resource,
  Snippet,
  Testimonial,
} from "@/lib/models";

import { ORDER_FIELD, STATUS_FIELD, type Field } from "./fields";

export type ResourceKey =
  | "projects"
  | "experience"
  | "mentoring"
  | "articles"
  | "testimonials"
  | "resources"
  | "open-source"
  | "snippets";

type ResourceDef = {
  label: string;
  singular: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose models are heterogeneous by design here.
  model: Model<any>;
  /** Field rendered as the row title in list views. */
  titleField: string;
  /** Extra columns shown in the list, beyond title and status. */
  listColumns?: { name: string; label: string }[];
  sort: Record<string, 1 | -1>;
  fields: Field[];
};

const CATEGORY = ["web", "mobile", "backend", "devops", "other"] as const;
const LEVEL = ["beginner", "intermediate", "advanced"] as const;

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  projects: {
    label: "Projects",
    singular: "Project",
    model: Project,
    titleField: "title",
    listColumns: [
      { name: "year", label: "Year" },
      { name: "category", label: "Category" },
    ],
    sort: { featured: -1, order: 1, year: -1 },
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true, help: "URL segment. Changing this breaks existing links." },
      { name: "title", label: "Title", type: "localized-text", required: true, wide: true },
      { name: "summary", label: "Summary", type: "localized-textarea", required: true, wide: true, help: "One or two lines, shown on cards." },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true },
      { name: "role", label: "Role", type: "localized-text", wide: true },
      { name: "category", label: "Category", type: "select", options: CATEGORY, required: true },
      { name: "year", label: "Year", type: "number", required: true },
      { name: "techStack", label: "Tech stack", type: "tags", wide: true },
      { name: "coverImage", label: "Cover image", type: "image" },
      { name: "repoUrl", label: "Repository URL", type: "url" },
      { name: "liveUrl", label: "Live URL", type: "url" },
      { name: "featured", label: "Featured", type: "boolean" },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  experience: {
    label: "Experience",
    singular: "Role",
    model: Experience,
    titleField: "position",
    listColumns: [{ name: "company", label: "Company" }],
    sort: { startDate: -1 },
    fields: [
      { name: "company", label: "Company", type: "text", required: true },
      { name: "companyUrl", label: "Company URL", type: "url" },
      { name: "position", label: "Position", type: "localized-text", required: true, wide: true },
      { name: "employmentType", label: "Employment type", type: "select", options: ["full-time", "part-time", "contract", "freelance", "internship"], required: true },
      { name: "locationType", label: "Location type", type: "select", options: ["onsite", "hybrid", "remote"], required: true },
      { name: "location", label: "Location", type: "text" },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "endDate", label: "End date", type: "date", help: "Leave empty for a current role." },
      { name: "current", label: "Current role", type: "boolean" },
      { name: "highlights", label: "Highlights", type: "localized-list", wide: true, help: "One achievement per line." },
      { name: "techStack", label: "Tech stack", type: "tags", wide: true },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  mentoring: {
    label: "Mentoring",
    singular: "Track",
    model: MentoringTrack,
    titleField: "track",
    listColumns: [
      { name: "level", label: "Level" },
      { name: "format", label: "Format" },
    ],
    sort: { order: 1 },
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "track", label: "Track", type: "localized-text", required: true, wide: true },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true },
      { name: "level", label: "Level", type: "select", options: LEVEL, required: true },
      { name: "format", label: "Format", type: "select", options: ["1-on-1", "group", "workshop", "async"], required: true },
      { name: "duration", label: "Duration", type: "localized-text", wide: true },
      { name: "topics", label: "Topics", type: "localized-list", wide: true, help: "One per line." },
      { name: "outcomes", label: "Outcomes", type: "localized-list", wide: true, help: "One per line." },
      { name: "icon", label: "Icon", type: "text", help: "lucide-react icon name." },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  articles: {
    label: "Articles",
    singular: "Article",
    model: Article,
    titleField: "title",
    listColumns: [{ name: "readingTime", label: "Min" }],
    sort: { publishedAt: -1 },
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "localized-text", required: true, wide: true },
      { name: "excerpt", label: "Excerpt", type: "localized-textarea", required: true, wide: true },
      { name: "content", label: "Content", type: "localized-richtext", required: true, wide: true },
      { name: "coverImage", label: "Cover image", type: "image" },
      { name: "tags", label: "Tags", type: "tags", wide: true },
      { name: "readingTime", label: "Reading time (min)", type: "number" },
      { name: "publishedAt", label: "Published at", type: "date" },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  testimonials: {
    label: "Testimonials",
    singular: "Testimonial",
    model: Testimonial,
    titleField: "name",
    listColumns: [
      { name: "company", label: "Company" },
      { name: "relationship", label: "Relationship" },
    ],
    sort: { featured: -1, order: 1 },
    fields: [
      { name: "name", label: "Name", type: "text", required: true, help: "Only publish with that person's permission." },
      { name: "company", label: "Company", type: "text" },
      { name: "avatar", label: "Avatar", type: "image" },
      { name: "role", label: "Role", type: "localized-text", wide: true },
      { name: "quote", label: "Quote", type: "localized-textarea", required: true, wide: true },
      { name: "relationship", label: "Relationship", type: "select", options: ["client", "student", "colleague"], required: true },
      { name: "rating", label: "Rating (1–5)", type: "number" },
      { name: "featured", label: "Featured", type: "boolean" },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  resources: {
    label: "Resources",
    singular: "Resource",
    model: Resource,
    titleField: "title",
    listColumns: [
      { name: "type", label: "Type" },
      { name: "level", label: "Level" },
    ],
    sort: { order: 1 },
    fields: [
      { name: "title", label: "Title", type: "localized-text", required: true, wide: true },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true },
      { name: "url", label: "URL", type: "url", required: true, wide: true },
      { name: "type", label: "Type", type: "select", options: ["article", "video", "course", "tool", "book", "documentation"], required: true },
      { name: "level", label: "Level", type: "select", options: LEVEL, required: true },
      { name: "tags", label: "Tags", type: "tags", wide: true },
      { name: "free", label: "Free", type: "boolean" },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  "open-source": {
    label: "Open Source",
    singular: "Contribution",
    model: OpenSource,
    titleField: "name",
    listColumns: [
      { name: "role", label: "Role" },
      { name: "language", label: "Language" },
    ],
    sort: { order: 1 },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "repoUrl", label: "Repository URL", type: "url", required: true, wide: true },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true },
      { name: "role", label: "Role", type: "select", options: ["author", "maintainer", "contributor"], required: true },
      { name: "language", label: "Language", type: "text" },
      { name: "stars", label: "Stars", type: "number" },
      { name: "topics", label: "Topics", type: "tags", wide: true },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },

  snippets: {
    label: "Snippets",
    singular: "Snippet",
    model: Snippet,
    titleField: "title",
    listColumns: [{ name: "language", label: "Language" }],
    sort: { order: 1 },
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Title", type: "localized-text", required: true, wide: true },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true },
      { name: "language", label: "Language", type: "text", required: true },
      { name: "code", label: "Code", type: "code", wide: true },
      { name: "embedProvider", label: "Embed provider", type: "select", options: ["none", "codesandbox", "replit", "stackblitz"], required: true },
      { name: "embedUrl", label: "Embed URL", type: "url", wide: true },
      { name: "tags", label: "Tags", type: "tags", wide: true },
      ORDER_FIELD,
      STATUS_FIELD,
    ],
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES) as ResourceKey[];

export function isResourceKey(value: string): value is ResourceKey {
  return value in RESOURCES;
}

/** Public cache tag for a resource, so a save invalidates the right pages. */
export function tagFor(key: ResourceKey) {
  return key;
}
