import { CreditBalance } from "@/components/account/credit-balance";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getCreditBalance } from "@/lib/credits/service";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const user = await getCurrentUser();
  const balance = user ? await getCreditBalance(getDb(), user.id) : 0;

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">Credits</p>
        <h1>积分</h1>
        <p>新用户注册赠送 5 积分。首版暂未开放在线购买。</p>
      </section>
      <CreditBalance balance={balance} />
      <a className="button button--ghost" href="/credits/upgrade">
        了解升级
      </a>
    </main>
  );
}
