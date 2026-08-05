"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Rich text editor for one locale of an article.
 *
 * Emits HTML into a hidden input rather than posting editor state, so the
 * Server Action stores render-ready markup and the public page never pays for
 * compilation at read time.
 *
 * `immediatelyRender: false` is required under SSR — TipTap renders to the DOM,
 * and letting it run during the server pass causes a hydration mismatch.
 */
export function RichTextField({
  name,
  locale,
  defaultValue,
}: {
  name: string;
  locale: string;
  defaultValue: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        // Anything the editor emits ends up in the public page, so links get
        // the same hardening they would in any user-facing markup.
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor: instance }) => setHtml(instance.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-56 px-3 py-2 focus:outline-none",
      },
    },
  });

  return (
    <div className="space-y-1">
      <span className="lab-label text-muted-foreground/70">{locale}</span>
      <input type="hidden" name={name} value={html} />

      <div className="border-input bg-card overflow-hidden rounded-lg border">
        <div className="border-hairline flex flex-wrap gap-0.5 border-b p-1.5">
          <Tool editor={editor} action="toggleBold" active="bold" icon={Bold} label="Bold" />
          <Tool editor={editor} action="toggleItalic" active="italic" icon={Italic} label="Italic" />
          <Tool editor={editor} action="toggleCode" active="code" icon={Code} label="Inline code" />
          <span className="bg-hairline mx-1 w-px" />
          <Tool
            editor={editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor?.isActive("heading", { level: 2 })}
            icon={Heading2}
            label="Heading 2"
          />
          <Tool
            editor={editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor?.isActive("heading", { level: 3 })}
            icon={Heading3}
            label="Heading 3"
          />
          <span className="bg-hairline mx-1 w-px" />
          <Tool editor={editor} action="toggleBulletList" active="bulletList" icon={List} label="Bullet list" />
          <Tool editor={editor} action="toggleOrderedList" active="orderedList" icon={ListOrdered} label="Numbered list" />
          <Tool editor={editor} action="toggleBlockquote" active="blockquote" icon={Quote} label="Quote" />
          <Tool
            editor={editor}
            onClick={() => {
              const url = window.prompt("Link URL");
              if (url === null) return;
              if (url === "") {
                editor?.chain().focus().unsetLink().run();
                return;
              }
              editor?.chain().focus().setLink({ href: url }).run();
            }}
            isActive={editor?.isActive("link")}
            icon={Link2}
            label="Link"
          />
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/** `useEditor` returns null on the first render, before the view is created. */
type Editor = ReturnType<typeof useEditor> | null;

function Tool({
  editor,
  action,
  active,
  onClick,
  isActive,
  icon: Icon,
  label,
}: {
  editor: Editor;
  action?: "toggleBold" | "toggleItalic" | "toggleCode" | "toggleBulletList" | "toggleOrderedList" | "toggleBlockquote";
  active?: string;
  onClick?: () => void;
  isActive?: boolean;
  icon: typeof Bold;
  label: string;
}) {
  const on = active ? editor?.isActive(active) : isActive;

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={Boolean(on)}
      onClick={() => {
        if (onClick) return onClick();
        if (action) editor?.chain().focus()[action]().run();
      }}
      className={cn(
        "hover:bg-secondary rounded p-1.5 transition-colors",
        on && "bg-secondary text-signal",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
