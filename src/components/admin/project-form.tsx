"use client";

import { ArrowLeft, GripVertical, Loader2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";

import { FieldControl, groupFields } from "@/components/admin/field-control";
import {
  GalleryStudio,
  toGalleryEntries,
  type GalleryEntry,
} from "@/components/admin/gallery-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/hooks/use-action-form";
import { saveEntity, type ActionState } from "@/lib/actions/content";
import type { Field } from "@/lib/admin/fields";
import { GALLERY_DISPLAYS, type GalleryDisplay, type GalleryGroup } from "@/lib/content-enums";
import { cn } from "@/lib/utils";

/**
 * Fields the Media section renders itself rather than through `FieldControl`.
 *
 * The gallery studio needs to know the display mode and the group list *as they
 * are being edited*, so those three have to share state. Everything else on the
 * form stays descriptor-driven.
 */
const MEDIA_OWNED = new Set(["galleryDisplay", "galleryGroups", "gallery"]);

/**
 * A group as the editor holds it: the stored shape plus a client-only identity.
 *
 * The identity matters because the React key cannot be `group.key` — that is the
 * field being typed into, so every keystroke would change the key, unmount the
 * row and take the caret with it.
 */
type EditableGroup = GalleryGroup & { __uid: string };

let groupUid = 0;
const nextGroupUid = () => `group-${++groupUid}`;

/** Drops the client-only key before the group is serialised for the server. */
const groupForSubmit = (group: EditableGroup): GalleryGroup => ({
  key: group.key,
  label: group.label,
});

const withUids = (groups: GalleryGroup[]): EditableGroup[] =>
  groups.map((group) => ({ ...group, __uid: nextGroupUid() }));

/**
 * The final form of a key: lowercase, hyphen-separated, no stray edges.
 *
 * Applied on blur rather than per keystroke. Stripping the trailing hyphen
 * while typing means a typed space disappears, so "my group" comes out "mygroup"
 * — the hyphen is removed before the next letter can arrive.
 */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** What is allowed to exist mid-word, keeping the hyphen the editor just typed. */
const slugifyLive = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

/**
 * The project editor.
 *
 * Split out of the generic `[resource]` form because a project is the only
 * entity with a gallery worth designing — cropping, sizing and grouping two
 * dozen screenshots is not a job a shared form can do without becoming a
 * gallery editor for seven resources that have no gallery.
 *
 * What it deliberately does *not* fork: validation and saving. It calls the
 * same `saveEntity("projects", …)` and submits the same input names, so the
 * descriptor in `admin/resources.ts` remains the single definition of what a
 * project is.
 */
export function ProjectForm({
  id,
  fields,
  values,
}: {
  id: string | null;
  fields: Field[];
  values: Record<string, unknown>;
}) {
  // `onSubmit`, not `action` — see `useActionForm`. It matters most here: this
  // form is the longest in the CMS, so having it emptied by a rejected save is
  // the most expensive version of that bug.
  const { state, pending, onSubmit } = useActionForm<ActionState>(
    saveEntity.bind(null, "projects", id),
    {},
  );

  const [display, setDisplay] = useState<GalleryDisplay>(
    (values.galleryDisplay as GalleryDisplay) ?? "flat",
  );
  const [groups, setGroups] = useState<EditableGroup[]>(() =>
    withUids(Array.isArray(values.galleryGroups) ? (values.galleryGroups as GalleryGroup[]) : []),
  );
  // Held here rather than inside the studio because the cover field offers the
  // same images, and a list that two controls read cannot belong to one of them.
  const [images, setImages] = useState<GalleryEntry[]>(() => toGalleryEntries(values.gallery));

  const sections = groupFields(fields);

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-background/80 sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-4 px-4 py-4 backdrop-blur-sm">
        <div>
          <Link
            href="/admin/projects"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
          >
            <ArrowLeft className="size-3.5" />
            Projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {id ? "Edit" : "New"} project
          </h1>
        </div>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </div>

      {state.message && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {state.message}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {sections.map((section, index) => {
          const errors = section.fields.reduce(
            (total, field) => total + countErrors(field, state.errors),
            0,
          );

          return (
            <section
              key={section.title ?? `section-${index}`}
              className={cn(
                section.title && "border-hairline rounded-xl border p-5 sm:p-6",
                // A section holding a rejected field is outlined, so a failed
                // save is findable by scrolling rather than by reading every
                // label. This is what the removed nav column was for.
                errors > 0 && "border-destructive/40",
              )}
            >
              {section.title && (
                <div className="mb-5 flex items-center gap-2">
                  <h2 className="lab-label text-muted-foreground">{section.title}</h2>
                  {errors > 0 && (
                    <span className="bg-destructive/15 text-destructive rounded-full px-1.5 font-mono text-[10px]">
                      {errors}
                    </span>
                  )}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {section.fields.map((field) =>
                  MEDIA_OWNED.has(field.name) ? null : (
                    <FieldControl
                      key={field.name}
                      field={field}
                      value={values[field.name]}
                      errors={state.errors}
                      // The cover is nearly always one of the screenshots that
                      // is already in the gallery, and uploading it twice meant
                      // two assets to keep in step.
                      pickFrom={field.name === "coverImage" ? images : undefined}
                    />
                  ),
                )}

                {section.fields.some((field) => MEDIA_OWNED.has(field.name)) && (
                  <GallerySection
                    fields={section.fields.filter((field) => MEDIA_OWNED.has(field.name))}
                    images={images}
                    setImages={setImages}
                    display={display}
                    setDisplay={setDisplay}
                    groups={groups}
                    setGroups={setGroups}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </form>
  );
}

/** Errors are keyed by the input name, so localized fields hold two. */
function countErrors(field: Field, errors?: Record<string, string>): number {
  if (!errors) return 0;
  return Object.keys(errors).filter(
    (key) => key === field.name || key.startsWith(`${field.name}.`),
  ).length;
}

function GallerySection({
  fields,
  images,
  setImages,
  display,
  setDisplay,
  groups,
  setGroups,
}: {
  fields: Field[];
  images: GalleryEntry[];
  setImages: Dispatch<SetStateAction<GalleryEntry[]>>;
  display: GalleryDisplay;
  setDisplay: (display: GalleryDisplay) => void;
  groups: EditableGroup[];
  setGroups: (groups: EditableGroup[]) => void;
}) {
  const galleryField = fields.find((field) => field.name === "gallery");

  return (
    <div className="space-y-6 sm:col-span-2">
      <div className="space-y-2">
        <span className="lab-label text-muted-foreground block">Gallery display</span>
        <NativeSelect
          name="galleryDisplay"
          value={display}
          onChange={(event) => setDisplay(event.target.value as GalleryDisplay)}
          className="max-w-xs"
        >
          {GALLERY_DISPLAYS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
        <p className="text-muted-foreground text-xs">
          Grouped splits the gallery into named sections. Leave it flat unless there are enough
          screenshots that sections help.
        </p>
      </div>

      {/* Only rendered when it can matter — an empty group editor on a flat
          gallery is a field asking to be filled in for no reason. */}
      {display === "grouped" && <GroupEditor groups={groups} setGroups={setGroups} />}

      {/* Submitted whatever the display mode, so switching back to flat does
          not silently discard the groups already defined. */}
      <input
        type="hidden"
        name="galleryGroups"
        value={JSON.stringify(groups.map(groupForSubmit))}
      />

      {galleryField && (
        <GalleryStudio
          name="gallery"
          label={galleryField.label}
          help={galleryField.help}
          images={images}
          setImages={setImages}
          folder="zullstack/projects"
          groups={groups}
          display={display}
        />
      )}
    </div>
  );
}

function GroupEditor({
  groups,
  setGroups,
}: {
  groups: EditableGroup[];
  setGroups: (groups: EditableGroup[]) => void;
}) {
  function update(index: number, patch: Partial<GalleryGroup>) {
    setGroups(groups.map((group, at) => (at === index ? { ...group, ...patch } : group)));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="lab-label text-muted-foreground block">Groups</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setGroups([...groups, { key: "", label: { en: "", id: "" }, __uid: nextGroupUid() }])
          }
        >
          Add group
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="border-hairline text-muted-foreground rounded-lg border border-dashed px-4 py-4 text-center text-xs">
          No groups yet.
        </p>
      ) : (
        // Sections render on the public page in this order, so dragging a group
        // here rearranges the gallery itself. Ordering used to be implied by
        // whichever image happened to come first, which meant the only way to
        // move a section was to reorder images across it.
        <Reorder.Group axis="y" values={groups} onReorder={setGroups} className="space-y-2">
          {groups.map((group, index) => (
            <GroupRow
              key={group.__uid}
              group={group}
              onChange={(patch) => update(index, patch)}
              onRemove={() => setGroups(groups.filter((_, at) => at !== index))}
            />
          ))}
        </Reorder.Group>
      )}

      <p className="text-muted-foreground text-xs">Drag to reorder sections.</p>
    </div>
  );
}

function GroupRow({
  group,
  onChange,
  onRemove,
}: {
  group: EditableGroup;
  onChange: (patch: Partial<GalleryGroup>) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      className="border-hairline bg-background/40 flex flex-wrap items-center gap-2 rounded-lg border p-2"
    >
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        aria-label="Reorder section"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none transition-colors active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <Input
        value={group.key}
        placeholder="key"
        className="h-8 w-28 font-mono text-xs"
        // Keys end up in a <select> and are compared against each image's
        // `group`, so they are normalised rather than trusted to be typed
        // consistently — but only loosely while typing, and fully on blur.
        onChange={(event) => onChange({ key: slugifyLive(event.target.value) })}
        onBlur={(event) => onChange({ key: slugify(event.target.value) })}
      />

      {(["en", "id"] as const).map((locale) => (
        <Input
          key={locale}
          value={group.label?.[locale] ?? ""}
          placeholder={`label ${locale}`}
          className="h-8 w-40 text-xs"
          onChange={(event) =>
            onChange({
              label: { ...(group.label ?? { en: "", id: "" }), [locale]: event.target.value },
            })
          }
        />
      ))}

      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="hover:text-destructive ml-auto"
        onClick={onRemove}
      >
        Remove
      </Button>
    </Reorder.Item>
  );
}
