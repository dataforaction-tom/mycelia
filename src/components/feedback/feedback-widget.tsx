"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SidebarOrg } from "@/components/layout/sidebar";

type FeedbackType = "bug" | "feature" | "other";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Something's broken",
  feature: "Feature request",
  other: "Other",
};

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-terracotta";

/**
 * Floating "Send feedback" affordance, mounted in the dashboard shell so any
 * member can raise a bug or idea from wherever they are. Captures the current
 * path and org for triage context.
 */
export function FeedbackWidget({
  organisations = [],
}: {
  organisations?: SidebarOrg[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("other");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgSlug = pathname.split("/")[1] ?? "";
  const organisationId = organisations.find((org) => org.slug === orgSlug)?.id;

  function reset() {
    setType("other");
    setTitle("");
    setBody("");
    setDone(false);
    setError(null);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, title, body, pageUrl: pathname, organisationId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not send — please retry");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please retry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-sm font-medium text-white shadow-hover transition-colors hover:bg-terracotta-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        <span aria-hidden="true">✎</span>
        Feedback
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle>Thank you</DialogTitle>
                <DialogDescription>
                  Your feedback is in — we read every note.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Send feedback</DialogTitle>
                <DialogDescription>
                  Found a bug or have an idea? Tell us — it goes straight to the
                  team.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="fb-type">Type</Label>
                  <select
                    id="fb-type"
                    className={SELECT_CLASS}
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as FeedbackType)
                    }
                  >
                    {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((value) => (
                      <option key={value} value={value}>
                        {TYPE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-title">Title</Label>
                  <Input
                    id="fb-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="A one-line summary"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-body">Details</Label>
                  <Textarea
                    id="fb-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="What happened, or what would help?"
                    rows={4}
                    maxLength={5000}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={
                    submitting || title.trim().length < 3 || body.trim().length < 5
                  }
                >
                  {submitting ? "Sending…" : "Send"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
