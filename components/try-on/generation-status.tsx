"use client";

import { useEffect, useState } from "react";

interface GenerationStatusResponse {
  job: {
    id: string;
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED_REFUNDED";
    failureCode: string | null;
    asset: { url: string; mimeType: string } | null;
  };
}

const statusCopy = {
  PENDING: "已进入队列，马上开始生成。",
  PROCESSING: "正在生成四大满贯赛场试穿图。",
  SUCCEEDED: "生成完成，可以查看结果。",
  FAILED_REFUNDED: "生成失败，积分已退回。",
};

export function GenerationStatus({ jobId }: { jobId: string }) {
  const [data, setData] = useState<GenerationStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/generations/${jobId}`);
        const body = (await response.json()) as GenerationStatusResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in body ? body.error : "查询生成状态失败。");
        }
        if (!active) {
          return;
        }

        const nextData = body as GenerationStatusResponse;
        setData(nextData);
        if (nextData.job.status === "SUCCEEDED" || nextData.job.status === "FAILED_REFUNDED") {
          return;
        }
        attempt += 1;
        timer = setTimeout(poll, Math.min(1000 + attempt * 500, 5000));
      } catch (pollError) {
        if (active) {
          setError(pollError instanceof Error ? pollError.message : "查询生成状态失败。");
        }
      }
    }

    void poll();
    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [jobId]);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!data) {
    return <p>正在读取生成状态...</p>;
  }

  return (
    <section className="generation-status" aria-live="polite">
      <h2>生成状态</h2>
      <p>{statusCopy[data.job.status]}</p>
      {data.job.failureCode ? <p>失败代码：{data.job.failureCode}</p> : null}
      {data.job.asset ? (
        <a className="button" href={data.job.asset.url} target="_blank" rel="noreferrer">
          打开四宫格结果
        </a>
      ) : null}
    </section>
  );
}
