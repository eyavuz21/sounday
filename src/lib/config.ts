import { stripeConfigured } from "./integrations/stripe";
import { twilioConfigured } from "./integrations/twilio";
import { activeMusicProvider } from "./integrations/music";

/** Safe, public-facing config for the client. Never expose secret values. */
export function publicConfig() {
  return {
    vapiPublicKey: process.env.VAPI_PUBLIC_KEY?.trim() ?? null,
    vapiAssistantId: process.env.VAPI_ASSISTANT_ID?.trim() ?? null,
    integrations: {
      music: activeMusicProvider(),
      cala: Boolean(process.env.CALA_API_KEY?.trim()),
      vapi: Boolean(process.env.VAPI_PUBLIC_KEY?.trim()),
      twilio: twilioConfigured(),
      stripe: stripeConfigured(),
    },
  };
}

export type PublicConfig = ReturnType<typeof publicConfig>;
