import { runAiTask } from "./run-task";

interface ThreadMoment {
  content: string;
  eventDate: Date | null;
  createdAt: Date;
}

function buildPrompt(
  connectionName: string,
  previousSummary: string | null,
  recentMoments: ThreadMoment[]
): string {
  const momentLines = recentMoments
    .map((m) => {
      const date = m.eventDate ?? m.createdAt;
      return `- [${date.toISOString().slice(0, 10)}] ${m.content}`;
    })
    .join("\n");

  return `You are writing a short narrative "thread" summarising the relationship
history with ${connectionName}, for a relationship-management tool. Write in
third person, in flowing prose (not bullet points), referencing concrete
moments and dates where useful, and highlighting turning points in the
relationship. Match this tone and level of concreteness:

"Sarah first connected with us through the winter programme in 2023. She
came back as a volunteer six months later. Over the past year, the
relationship has deepened..."

${
  previousSummary
    ? `The existing narrative so far is:\n"""\n${previousSummary}\n"""\n\nUpdate this narrative to incorporate the moments below, preserving established voice, tone, and continuity. Do not simply append — weave the new material in naturally, and feel free to condense or reframe older material if a new moment recontextualises it.`
    : `There is no existing narrative yet — write the first version from the moments below.`
}

Moments, in chronological order (most recent last):
${momentLines}

Respond with only the narrative prose — no preamble, no headings.`;
}

export async function synthesizeThread(
  connectionName: string,
  previousSummary: string | null,
  recentMoments: ThreadMoment[]
): Promise<string> {
  return runAiTask(
    "thread-synthesis",
    buildPrompt(connectionName, previousSummary, recentMoments)
  );
}
