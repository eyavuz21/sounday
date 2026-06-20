import Onboarding from "@/components/onboarding/Onboarding";
import { getOrCreateUser, parseMusicTaste } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getOrCreateUser();
  return (
    <Onboarding
      initialTaste={parseMusicTaste(user.musicTaste)}
      initialPhone={user.phone}
    />
  );
}
