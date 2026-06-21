import Onboarding from "@/components/onboarding/Onboarding";
import { getOrCreateUser, parseMusicTaste } from "@/lib/data";
import { publicConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getOrCreateUser();
  const { integrations } = publicConfig();
  return (
    <Onboarding
      initialTaste={parseMusicTaste(user.musicTaste)}
      initialPhone={user.phone}
      googleConfigured={integrations.google}
    />
  );
}
