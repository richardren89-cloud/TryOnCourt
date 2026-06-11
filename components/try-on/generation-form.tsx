"use client";

import { useState } from "react";

import { GenerationStatus } from "@/components/try-on/generation-status";

interface GenerationFormProps {
  outfit: {
    id: string;
    title: string;
    items: Array<{ id: string; category: string; displayName: string }>;
  };
  balance: number;
}

type UploadKind = "FULL_BODY" | "HEADSHOT";
type UploadedPhotoState = { id: string; label: string } | null;

export function GenerationForm({ outfit, balance }: GenerationFormProps) {
  const [fullBodyPhoto, setFullBodyPhoto] = useState<UploadedPhotoState>(null);
  const [headshotPhoto, setHeadshotPhoto] = useState<UploadedPhotoState>(null);
  const [saveSource, setSaveSource] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const canSubmit = Boolean(fullBodyPhoto && headshotPhoto && !uploading && !submitting);

  async function handleUpload(kind: UploadKind, file: File | undefined) {
    if (!file) {
      return;
    }
    setMessage(null);
    setUploading(kind);

    try {
      const signResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          contentType: file.type,
          byteSize: file.size,
        }),
      });
      const signed = (await signResponse.json()) as {
        upload?: { key: string; url: string; method: "PUT"; headers: Record<string, string> };
        error?: string;
      };
      if (!signResponse.ok || !signed.upload) {
        throw new Error(signed.error ?? "上传签名失败。");
      }

      if (!signed.upload.url.startsWith("file://")) {
        const uploadResponse = await fetch(signed.upload.url, {
          method: signed.upload.method,
          headers: signed.upload.headers,
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error("照片上传失败。");
        }
      }

      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          key: signed.upload.key,
          contentType: file.type,
          byteSize: file.size,
        }),
      });
      const completed = (await completeResponse.json()) as {
        photo?: { id: string };
        error?: string;
      };
      if (!completeResponse.ok || !completed.photo) {
        throw new Error(completed.error ?? "照片确认失败。");
      }

      const nextPhoto = { id: completed.photo.id, label: file.name };
      if (kind === "FULL_BODY") {
        setFullBodyPhoto(nextPhoto);
      } else {
        setHeadshotPhoto(nextPhoto);
      }
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "上传失败。");
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit() {
    if (!fullBodyPhoto || !headshotPhoto) {
      return;
    }
    if (balance < 1) {
      setShowUpgrade(true);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          outfitId: outfit.id,
          fullBodyPhotoId: fullBodyPhoto.id,
          headshotPhotoId: headshotPhoto.id,
          saveSource,
        }),
      });
      const body = (await response.json()) as { job?: { id: string }; error?: string };
      if (!response.ok || !body.job) {
        throw new Error(body.error ?? "生成任务创建失败。");
      }
      setJobId(body.job.id);
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "生成任务创建失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="try-on-layout">
      <div className="try-on-card">
        <p className="eyebrow">AI 试衣</p>
        <h1>{outfit.title}</h1>
        <p>每生成 1 张四宫格试穿图消耗 1 个积分。当前积分：{balance}</p>
        <ul className="detail-list">
          {outfit.items.map((item) => (
            <li key={item.id}>
              <strong>{item.category}</strong>
              <span>{item.displayName}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="try-on-card">
        <h2>上传参考照片</h2>
        <p>请上传本人近期真实照片。照片只用于生成试穿效果，请勿上传他人或未授权照片。</p>
        <label>
          正面全身照
          <input
            accept="image/jpeg,image/png,image/webp"
            data-testid="full-body-input"
            disabled={uploading !== null || submitting}
            type="file"
            onChange={(event) => void handleUpload("FULL_BODY", event.target.files?.[0])}
          />
        </label>
        {fullBodyPhoto ? <p>已上传：{fullBodyPhoto.label}</p> : null}
        <label>
          正面头像
          <input
            accept="image/jpeg,image/png,image/webp"
            data-testid="headshot-input"
            disabled={uploading !== null || submitting}
            type="file"
            onChange={(event) => void handleUpload("HEADSHOT", event.target.files?.[0])}
          />
        </label>
        {headshotPhoto ? <p>已上传：{headshotPhoto.label}</p> : null}
        <label className="inline-choice">
          <input
            checked={saveSource}
            type="checkbox"
            onChange={(event) => setSaveSource(event.target.checked)}
          />
          生成后保留源照片，方便之后复用
        </label>
        <button className="button" disabled={!canSubmit} type="button" onClick={() => void handleSubmit()}>
          {submitting ? "正在创建..." : "生成四大满贯试穿图"}
        </button>
        {message ? <p role="alert">{message}</p> : null}
        {showUpgrade ? (
          <div className="upgrade-modal" role="dialog" aria-modal="true" aria-label="积分不足">
            <h2>积分不足</h2>
            <p>当前版本暂未开放在线支付，升级入口已预留。</p>
            <a className="button" href="/credits/upgrade">
              查看升级说明
            </a>
          </div>
        ) : null}
      </div>

      {jobId ? <GenerationStatus jobId={jobId} /> : null}
    </section>
  );
}
