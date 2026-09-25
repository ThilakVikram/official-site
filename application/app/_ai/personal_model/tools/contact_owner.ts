import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { sendContactEmail } from "../send_email";

// Tool the assistant calls to email the site owner on a visitor's behalf.

const MAX_PER_HOUR = 3;
const sent = new Map<string, number[]>();

function allow(clientId: string) {
  const now = Date.now();
  const recent = (sent.get(clientId) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= MAX_PER_HOUR) return false;
  sent.set(clientId, [...recent, now]);
  return true;
}

const schema = z.object({
  name: z.string().trim().min(2).max(100).describe("Visitor's full name"),
  email: z.email().max(200).describe("Visitor's email address"),
  phone: z.string().trim().max(40).optional().describe("Visitor's phone number, only if they gave one"),
  company: z.string().trim().max(120).optional().describe("Visitor's company, only if they gave one"),
  isRecruiter: z.boolean().optional().describe("True if the visitor said they are a recruiter or hiring"),
  message: z.string().trim().min(1).max(2000).describe("What the visitor wants to tell or ask the owner, in their words"),
});

// clientId (e.g. the visitor's IP) limits how many emails one visitor can send.
export function createContactOwnerTool(ownerName: string, clientId: string) {
  return tool(
    async (input) => {
      if (!allow(clientId)) return "NOT SENT: this visitor has already sent several messages recently. Ask them to try again later.";
      try {
        await sendContactEmail({ ...input, phone: input.phone || undefined, company: input.company || undefined });
        return `SENT: the message was emailed to ${ownerName}. ${ownerName} will reply to ${input.email}.`;
      } catch (e) {
        console.error("contact_owner failed", e);
        return "NOT SENT: the email service failed. Apologise and suggest trying again later.";
      }
    },
    {
      name: "contact_owner",
      description: `Email ${ownerName} a message from the visitor. Only call this after the visitor has confirmed the summary of their details.`,
      schema,
    },
  );
}
