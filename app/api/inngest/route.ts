import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendInviteEmails } from "@/lib/inngest/functions/send-invite-emails";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: sendInviteEmails,
});

