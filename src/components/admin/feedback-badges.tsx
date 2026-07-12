import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
} from "@/lib/admin/feedback";

const STATUS_VARIANT: Record<FeedbackStatus, BadgeProps["variant"]> = {
  new: "sky",
  triaged: "bark",
  planned: "amber",
  in_progress: "default",
  done: "moss",
  declined: "outline",
};

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: "New",
  triaged: "Triaged",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

const TYPE_VARIANT: Record<FeedbackType, BadgeProps["variant"]> = {
  bug: "default",
  feature: "moss",
  other: "outline",
};

const PRIORITY_VARIANT: Record<FeedbackPriority, BadgeProps["variant"]> = {
  low: "outline",
  medium: "sky",
  high: "amber",
};

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function FeedbackTypeBadge({ type }: { type: FeedbackType }) {
  return <Badge variant={TYPE_VARIANT[type]}>{type}</Badge>;
}

export function FeedbackPriorityBadge({
  priority,
}: {
  priority: FeedbackPriority;
}) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>;
}
