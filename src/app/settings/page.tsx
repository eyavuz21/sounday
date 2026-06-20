import BottomNav from "@/components/BottomNav";
import SettingsForm from "@/components/settings/SettingsForm";
import { getOrCreateUser, parseMusicTaste, parseNotifPrefs } from "@/lib/data";
import { publicConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getOrCreateUser();
  const cfg = publicConfig();

  return (
    <>
      <main className="app-shell">
        <header className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-sea-500">
            {user.email}
          </p>
          <h1 className="text-3xl font-bold text-ink">Settings</h1>
        </header>
        <SettingsForm
          initial={{
            phone: user.phone,
            musicTaste: parseMusicTaste(user.musicTaste),
            notifPrefs: parseNotifPrefs(user.notifPrefs),
          }}
          integrations={cfg.integrations}
        />
      </main>
      <BottomNav />
    </>
  );
}
