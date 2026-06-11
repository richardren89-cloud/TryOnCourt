import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/require-user";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const jobs = await getDb().generationJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      failureCode: true,
      createdAt: true,
      outfit: { select: { title: true } },
      generatedAssets: {
        where: { deletedAt: null },
        take: 1,
        select: { id: true },
      },
    },
  });

  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">History</p>
        <h1>生成历史</h1>
        <p>这里显示你最近 20 次生成记录，仅当前账号可见。</p>
      </section>
      {jobs.length === 0 ? (
        <section className="empty-state">
          <h2>还没有生成记录</h2>
          <p>从穿搭橱窗选择一套喜欢的组合，上传照片后就能生成试穿图。</p>
          <Link className="button" href="/outfits">
            去选穿搭
          </Link>
        </section>
      ) : (
        <section className="history-list">
          {jobs.map((job) => (
            <article className="history-card" key={job.id}>
              <p className="eyebrow">{job.status}</p>
              <h2>{job.outfit.title}</h2>
              <p>{job.createdAt.toLocaleString("zh-CN")}</p>
              {job.failureCode ? <p>失败代码：{job.failureCode}</p> : null}
              <Link className="button button--ghost" href={`/api/generations/${job.id}`}>
                查看状态
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
