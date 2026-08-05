"use client";

import { Check, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteComment, setCommentStatus } from "@/lib/actions/moderation";
import { cn } from "@/lib/utils";

export function CommentRow({
  id,
  authorName,
  body,
  status,
  articleTitle,
  createdAt,
}: {
  id: string;
  authorName: string;
  body: string;
  status: string;
  articleTitle: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) => startTransition(() => fn().then(() => router.refresh()));

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{authorName}</span>
        <span
          className={cn(
            "lab-label rounded-full border px-2 py-0.5",
            status === "approved" && "border-signal/40 text-signal",
            status === "pending" && "border-hairline text-muted-foreground",
            status === "spam" && "border-destructive/40 text-destructive",
          )}
        >
          {status}
        </span>
        <span className="text-muted-foreground truncate font-mono text-xs">{articleTitle}</span>
        <span className="text-muted-foreground ml-auto font-mono text-xs">{createdAt}</span>
      </div>

      <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">{body}</p>

      <div className="mt-3 flex items-center gap-1">
        {status !== "approved" && (
          <Action
            onClick={() => run(() => setCommentStatus(id, "approved"))}
            pending={pending}
            icon={Check}
            label="Approve"
          />
        )}
        {status !== "spam" && (
          <Action
            onClick={() => run(() => setCommentStatus(id, "spam"))}
            pending={pending}
            icon={ShieldAlert}
            label="Mark as spam"
          />
        )}
        <Action
          onClick={() => {
            if (!window.confirm("Delete this comment? This cannot be undone.")) return;
            run(() => deleteComment(id));
          }}
          pending={pending}
          icon={Trash2}
          label="Delete"
          destructive
        />
      </div>
    </li>
  );
}

function Action({
  onClick,
  pending,
  icon: Icon,
  label,
  destructive,
}: {
  onClick: () => void;
  pending: boolean;
  icon: typeof Check;
  label: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      title={label}
      className={cn(
        "text-muted-foreground hover:bg-secondary inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
        destructive ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      {label}
    </button>
  );
}
