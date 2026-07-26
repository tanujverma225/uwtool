"use server";

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBid, updateBid } from "@/lib/actions/bids";

const DEFAULT_INSTRUCTIONS = `You are an expert Upwork proposal writer.
Write a concise, personalized proposal that:
- Opens with a hook tied to the client's specific needs
- Demonstrates relevant experience without fluff
- Answers any screening questions if provided
- Ends with a clear call to action
Keep tone professional, confident, and human. Avoid generic templates.`;

async function loadProposalInstructions(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), "docs", "PROPOSAL_INSTRUCTIONS.md"),
    path.join(process.cwd(), "docs", "PORTFOLIO.md"),
  ];

  const parts: string[] = [];
  for (const filePath of candidates) {
    try {
      const content = await readFile(filePath, "utf-8");
      if (content.trim()) parts.push(content.trim());
    } catch {
      // optional files
    }
  }

  if (parts.length === 0) return DEFAULT_INSTRUCTIONS;
  return parts.join("\n\n---\n\n");
}

export async function generateProposal(bidId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error:
        "ANTHROPIC_API_KEY is not set. Add it in Vercel env vars or .env.local.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const bid = await getBid(bidId).catch(() => null);
  if (!bid) return { error: "Bid not found" };

  const instructions = await loadProposalInstructions();
  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-opus-4-20250514";

  const jobContext = [
    bid.job_title && `Job Title: ${bid.job_title}`,
    bid.summary && `Job Description:\n${bid.summary}`,
    bid.questions && `Screening Questions:\n${bid.questions}`,
    bid.url && `Job URL: ${bid.url}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!jobContext.trim()) {
    return {
      error:
        "Add a job title or summary first (use Fetch from URL or paste manually).",
    };
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${instructions}

Write an Upwork proposal for this job. Return only the proposal text (plain text, no markdown fences).

${jobContext}`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const proposalText = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!proposalText) {
      return { error: "Claude returned an empty proposal." };
    }

    const htmlProposal = proposalText
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

    const result = await updateBid(bidId, { proposal: htmlProposal });
    if (result.error) return { error: result.error };

    revalidatePath(`/bids/${bidId}`);
    return { success: true, proposal: htmlProposal };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate proposal";
    return { error: message };
  }
}
