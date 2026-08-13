"use client";

import { ArrowLeft, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";

import { FieldControl } from "@/components/admin/field-control";
import {
  GalleryStudio,
  galleryForSubmit,
  toGalleryEntries,
  type GalleryEntry,
} from "@/components/admin/gallery-studio";
import { ReferenceField } from "@/components/admin/reference-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm } from "@/hooks/use-action-form";
import { saveEntity, type ActionState } from "@/lib/actions/content";
import type { Field } from "@/lib/admin/fields";
import {
  EMPLOYMENT_TYPES,
  LOCATION_TYPES,
  type EmploymentType,
  type LocationType,
  type Localized,
} from "@/lib/content-enums";
import { cn } from "@/lib/utils";

/** Fields this screen draws itself rather than through `FieldControl`. */
const OWNED = new Set(["partner", "positions"]);

/**
 * A position as the editor holds it.
 *
 * Lists and dates are kept as the text the inputs actually contain — one
 * highlight per line, comma-separated skills — and converted once on submit.
 * Parsing on every keystroke would fight the editor: a trailing comma or a
 * blank line is a normal intermediate state while typing.
 */
type EditablePosition = {
  __uid: string;
  position: Localized;
  employmentType: EmploymentType;
  locationType: LocationType;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: Localized;
  skills: string;
  media: GalleryEntry[];
};

let positionUid = 0;
const nextPositionUid = () => `position-${++positionUid}`;

const localized = (value: unknown): Localized => {
  const record = (value ?? {}) as Record<string, unknown>;
  return { en: String(record.en ?? ""), id: String(record.id ?? "") };
};

/** `<input type="date">` accepts only YYYY-MM-DD, never a full ISO string. */
const dateInput = (value: unknown) => (value ? new Date(String(value)).toISOString().slice(0, 10) : "");

const lines = (value: unknown): string =>
  Array.isArray(value) ? value.join("\n") : String(value ?? "");

function toEditable(raw: unknown): EditablePosition {
  const p = (raw ?? {}) as Record<string, unknown>;
  const highlights = (p.highlights ?? {}) as Record<string, unknown>;

  return {
    __uid: nextPositionUid(),
    position: localized(p.position),
    employmentType: (p.employmentType as EmploymentType) ?? "full-time",
    locationType: (p.locationType as LocationType) ?? "onsite",
    location: String(p.location ?? ""),
    startDate: dateInput(p.startDate),
    endDate: dateInput(p.endDate),
    current: Boolean(p.current),
    highlights: { en: lines(highlights.en), id: lines(highlights.id) },
    // `skills` replaced `techStack`; a document written before that still has
    // the old key and would otherwise open with an empty field.
    skills: (Array.isArray(p.skills) ? p.skills : Array.isArray(p.techStack) ? p.techStack : []).join(
      ", ",
    ),
    media: toGalleryEntries(p.media),
  };
}

/**
 * Into the shape `schemaFor(positions.itemFields)` expects.
 *
 * The JSON goes through the same descriptor-derived validator as every other
 * repeater, so these keys are a contract, not a convention.
 */
function forSubmit(position: EditablePosition) {
  const list = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  return {
    position: position.position,
    employmentType: position.employmentType,
    locationType: position.locationType,
    location: position.location,
    // Empty means ongoing, and must round-trip as null — `z.coerce.date()`
    // reads an empty string as an invalid date and rejects the whole save.
    startDate: position.startDate || null,
    endDate: position.endDate || null,
    current: position.current,
    highlights: { en: list(position.highlights.en), id: list(position.highlights.id) },
    skills: position.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
    media: position.media.map(galleryForSubmit),
  };
}

function blank(): EditablePosition {
  return {
    __uid: nextPositionUid(),
    position: { en: "", id: "" },
    employmentType: "full-time",
    locationType: "onsite",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    highlights: { en: "", id: "" },
    skills: "",
    media: [],
  };
}

/**
 * The experience editor: one company, and every title held there.
 *
 * Split out of the generic `[resource]` form for the same reason projects were:
 * `RepeaterField` renders its rows through `RowControl`, which knows nothing
 * about images — and a position has to carry its own media. Bending the shared
 * repeater to hold an uploader would change the component six other resources
 * depend on.
 *
 * What it deliberately does *not* fork: validation and saving. Same
 * `saveEntity("experience", …)`, same input names, so `admin/resources.ts`
 * remains the single definition of what a position is.
 */
export function ExperienceForm({
  id,
  fields,
  values,
}: {
  id: string | null;
  fields: Field[];
  values: Record<string, unknown>;
}) {
  // `onSubmit`, not `action` — see `useActionForm`.
  const { state, pending, onSubmit } = useActionForm<ActionState>(
    saveEntity.bind(null, "experience", id),
    {},
  );

  const [partner, setPartner] = useState(() => {
    // Populated on read, a bare id on save — accept either.
    const raw = values.partner as { _id?: string } | string | undefined;
    if (!raw) return "";
    return typeof raw === "string" ? raw : String(raw._id ?? "");
  });

  const [positions, setPositions] = useState<EditablePosition[]>(() => {
    const stored = Array.isArray(values.positions) ? values.positions : [];
    // A document from before the restructure is one position, stored inline.
    if (stored.length === 0 && values.position) return [toEditable(values)];
    return stored.map(toEditable);
  });

  const rest = fields.filter((field) => !OWNED.has(field.name));

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-background/80 sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-4 px-4 py-4 backdrop-blur-sm">
        <div>
          <Link
            href="/admin/experience"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
          >
            <ArrowLeft className="size-3.5" />
            Experience
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {id ? "Edit" : "New"} company
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
        <section className="border-hairline rounded-xl border p-5 sm:p-6">
          <h2 className="lab-label text-muted-foreground mb-5">Company</h2>

          <div className="max-w-md space-y-2">
            <Label>Company</Label>
            <ReferenceField value={partner || undefined} relationTo="partners" onChange={setPartner} />
            <input type="hidden" name="partner" value={partner} />
            <p className="text-muted-foreground text-xs">
              Registered under Partners. Set its kind to <span className="font-mono">employer</span>{" "}
              so it stays off the public partners page — the name, logo and website all come from
              there.
            </p>
            {state.errors?.partner && (
              <p className="text-destructive text-xs">{state.errors.partner}</p>
            )}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {rest.map((field) => (
              <FieldControl
                key={field.name}
                field={field}
                value={values[field.name]}
                errors={state.errors}
              />
            ))}
          </div>
        </section>

        <section
          className={cn(
            "border-hairline rounded-xl border p-5 sm:p-6",
            state.errors?.positions && "border-destructive/40",
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="lab-label text-muted-foreground">Positions</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Every title held here. Two roles at once is the case this exists for — order is
                yours to set, and the public page states each range separately.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setPositions((current) => [...current, blank()])}
            >
              <Plus className="size-3.5" />
              Add position
            </Button>
          </div>

          <input type="hidden" name="positions" value={JSON.stringify(positions.map(forSubmit))} />

          {positions.length === 0 ? (
            <p className="border-hairline text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
              No positions yet.
            </p>
          ) : (
            <Reorder.Group axis="y" values={positions} onReorder={setPositions} className="space-y-4">
              {positions.map((position) => (
                <PositionCard
                  key={position.__uid}
                  position={position}
                  onChange={(patch) =>
                    setPositions((current) =>
                      current.map((entry) =>
                        entry.__uid === position.__uid ? { ...entry, ...patch } : entry,
                      ),
                    )
                  }
                  setMedia={(update) =>
                    setPositions((current) =>
                      current.map((entry) =>
                        entry.__uid === position.__uid
                          ? {
                              ...entry,
                              media:
                                typeof update === "function" ? update(entry.media) : update,
                            }
                          : entry,
                      ),
                    )
                  }
                  onRemove={() =>
                    setPositions((current) =>
                      current.filter((entry) => entry.__uid !== position.__uid),
                    )
                  }
                />
              ))}
            </Reorder.Group>
          )}
        </section>
      </div>
    </form>
  );
}

function PositionCard({
  position,
  onChange,
  setMedia,
  onRemove,
}: {
  position: EditablePosition;
  onChange: (patch: Partial<EditablePosition>) => void;
  setMedia: Dispatch<SetStateAction<GalleryEntry[]>>;
  onRemove: () => void;
}) {
  // Dragging is confined to the handle: the card is full of inputs, and a drag
  // starting on a text field would fight text selection.
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={position}
      dragListener={false}
      dragControls={controls}
      className="border-hairline bg-background/40 rounded-lg border p-4"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          aria-label="Reorder position"
          className="text-muted-foreground hover:text-foreground mt-2 cursor-grab touch-none transition-colors active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {(["en", "id"] as const).map((locale) => (
                <Input
                  key={locale}
                  value={position.position[locale]}
                  placeholder={locale}
                  onChange={(event) =>
                    onChange({ position: { ...position.position, [locale]: event.target.value } })
                  }
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Employment</Label>
              <NativeSelect
                value={position.employmentType}
                onChange={(event) =>
                  onChange({ employmentType: event.target.value as EmploymentType })
                }
              >
                {EMPLOYMENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Location type</Label>
              <NativeSelect
                value={position.locationType}
                onChange={(event) => onChange({ locationType: event.target.value as LocationType })}
              >
                {LOCATION_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Start</Label>
              <Input
                type="date"
                value={position.startDate}
                onChange={(event) => onChange({ startDate: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End</Label>
              <Input
                type="date"
                value={position.endDate}
                disabled={position.current}
                onChange={(event) => onChange({ endDate: event.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-40 flex-1 space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input
                value={position.location}
                placeholder="Jakarta, Indonesia"
                onChange={(event) => onChange({ location: event.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={position.current}
                // Ticking it clears the end date rather than leaving a stale one
                // behind a disabled input, where it would still be submitted.
                onCheckedChange={(checked) =>
                  onChange({ current: Boolean(checked), endDate: checked ? "" : position.endDate })
                }
              />
              Current role
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Highlights</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {(["en", "id"] as const).map((locale) => (
                <Textarea
                  key={locale}
                  rows={4}
                  value={position.highlights[locale]}
                  placeholder={`${locale} — one per line`}
                  onChange={(event) =>
                    onChange({
                      highlights: { ...position.highlights, [locale]: event.target.value },
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Skills</Label>
            <Input
              value={position.skills}
              placeholder="React, Curriculum design, Mentoring"
              onChange={(event) => onChange({ skills: event.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              Comma separated. Not only technologies — what a role taught is often not a library.
            </p>
          </div>

          {/* No `name`: the images travel inside the positions JSON, so a hidden
              input here would post the same list twice. */}
          <GalleryStudio
            label="Media"
            help="Photos or screenshots from this role. Same crop, layout and preview as a project gallery."
            images={position.media}
            setImages={setMedia}
            folder="zullstack/experience"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove position"
          className="hover:text-destructive shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}
