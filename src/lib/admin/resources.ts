import type { Model } from "mongoose";

import {
  Article,
  Experience,
  MentoringTrack,
  OpenSource,
  Partner,
  Project,
  Resource,
  Snippet,
  Testimonial,
} from "@/lib/models";
import {
  GALLERY_DISPLAYS,
  LIFECYCLES,
  LINK_ACCESS,
  LINK_KINDS,
  PARTNER_KINDS,
  PARTNER_ROLES,
  PLATFORMS,
} from "@/lib/models/shared";

import { ORDER_FIELD, STATUS_FIELD, type Field } from "./fields";

export type ResourceKey =
  | "projects"
  | "partners"
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
  /**
   * Rows can be dragged to set `order`.
   *
   * Only for resources whose `sort` is actually driven by `order` — offering a
   * drag handle on a list sorted by date would let the editor rearrange rows
   * that snap straight back on reload.
   */
  reorderable?: boolean;
  /**
   * Boolean field promoted to a star toggle in the list, whose rows are pinned
   * above everything else. Must be the leading key in `sort`.
   */
  favoriteField?: string;
  fields: Field[];
};

const LEVEL = ["beginner", "intermediate", "advanced"] as const;

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  projects: {
    label: "Projects",
    singular: "Project",
    model: Project,
    titleField: "title",
    listColumns: [
      { name: "year", label: "Year" },
      { name: "lifecycle", label: "Lifecycle" },
    ],
    sort: { featured: -1, order: 1, year: -1 },
    reorderable: true,
    favoriteField: "featured",
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true, group: "Basics", help: "URL segment. Changing this breaks existing links." },
      { name: "title", label: "Title", type: "localized-text", required: true, wide: true, group: "Basics" },
      { name: "summary", label: "Summary", type: "localized-textarea", required: true, wide: true, group: "Basics", help: "One or two lines, shown on cards." },
      { name: "platforms", label: "Platforms", type: "multiselect", options: PLATFORMS, required: true, wide: true, group: "Basics", help: "Everything this engagement covered — a web app with a companion phone app and a CMS is all three." },
      { name: "year", label: "Year", type: "number", required: true, group: "Basics" },
      { name: "lifecycle", label: "Lifecycle", type: "select", options: LIFECYCLES, required: true, group: "Basics", help: "Where the work stands today. Sunsetted projects stay publishable." },
      { name: "featured", label: "Favorite", type: "boolean", group: "Basics", help: "Pins this above every other project, however new they are." },

      { name: "problem", label: "Problem", type: "localized-textarea", wide: true, group: "Story", help: "What this existed to solve. Shown above the description." },
      { name: "description", label: "Description", type: "localized-textarea", required: true, wide: true, group: "Story" },
      { name: "role", label: "Role", type: "localized-text", wide: true, group: "Story" },
      { name: "responsibilities", label: "What I did", type: "localized-list", wide: true, group: "Story", help: "One contribution per line." },
      { name: "outcomes", label: "Outcomes", type: "localized-list", wide: true, group: "Story", help: "One result per line. Numbers land harder than adjectives." },

      { name: "startDate", label: "Start date", type: "date", group: "Timeline" },
      { name: "endDate", label: "End date", type: "date", group: "Timeline", help: "Leave empty if still ongoing." },
      { name: "teamSize", label: "Team size", type: "number", group: "Timeline" },

      { name: "coverImage", label: "Cover image", type: "image", group: "Media" },
      {
        name: "galleryDisplay",
        label: "Gallery display",
        type: "select",
        options: GALLERY_DISPLAYS,
        required: true,
        group: "Media",
        help: "Grouped splits the gallery into named sections. Leave it flat unless there are enough screenshots that sections help.",
      },
      {
        name: "galleryGroups",
        label: "Gallery groups",
        type: "repeater",
        group: "Media",
        addLabel: "Add group",
        help: "Only used when display is grouped. Sections appear in the order their first image does.",
        itemFields: [
          { name: "key", label: "Key", type: "text", required: true, help: "Short id, e.g. web." },
          { name: "label", label: "Label", type: "localized-text", wide: true },
        ],
      },
      {
        name: "gallery",
        label: "Gallery",
        type: "gallery",
        group: "Media",
        help: "Screenshots of anything that cannot be reached publicly. Crop, size and group each one — the preview shows exactly what visitors will see.",
      },

      {
        name: "links",
        label: "Links",
        type: "repeater",
        group: "Links",
        addLabel: "Add link",
        help: "Only public links have their address published. Request and internal links render as a button and a note, and their URL never reaches the page.",
        itemFields: [
          { name: "kind", label: "Kind", type: "select", options: LINK_KINDS, required: true },
          { name: "access", label: "Access", type: "select", options: LINK_ACCESS, required: true },
          { name: "url", label: "URL", type: "url", wide: true },
          { name: "label", label: "Label override", type: "localized-text", wide: true },
        ],
      },

      {
        name: "partners",
        label: "Partners",
        type: "repeater",
        group: "Partners",
        addLabel: "Add partner",
        help: "The agency the work went through, and the end client. Use the URL override to point at their page about this project rather than their homepage.",
        itemFields: [
          { name: "partner", label: "Partner", type: "reference", relationTo: "partners", required: true },
          { name: "role", label: "Role", type: "select", options: PARTNER_ROLES, required: true },
          { name: "url", label: "URL override", type: "url", wide: true },
        ],
      },

      { name: "techStack", label: "Tech stack", type: "tags", wide: true, group: "Meta" },
      { ...ORDER_FIELD, group: "Meta" },
      { ...STATUS_FIELD, group: "Meta" },
    ],
  },

  partners: {
    label: "Partners",
    singular: "Partner",
    model: Partner,
    titleField: "name",
    listColumns: [{ name: "kind", label: "Kind" }],
    sort: { order: 1 },
    reorderable: true,
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true, help: "URL segment on the partners page." },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "kind", label: "Kind", type: "select", options: PARTNER_KINDS, required: true, help: "How you usually work with them. A project can still override the role." },
      { name: "logo", label: "Logo", type: "image" },
      { name: "url", label: "Website", type: "url", wide: true, help: "Default destination. Individual projects can point somewhere more specific." },
      { name: "description", label: "Description", type: "localized-textarea", wide: true },
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
    reorderable: true,
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
    reorderable: true,
    favoriteField: "featured",
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
    reorderable: true,
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
    reorderable: true,
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
    reorderable: true,
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
