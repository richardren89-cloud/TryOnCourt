import { redirect } from "next/navigation";

import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { getCurrentUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Settings</p>
        <h1>账号设置</h1>
        <p>管理隐私、账号注销和未来的安全偏好。</p>
      </section>
      <DeleteAccountForm />
    </main>
  );
}
