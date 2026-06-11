"use client";

import { useState } from "react";

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation, password }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "注销失败。");
      }
      setMessage("账号已注销。");
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注销失败。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="credit-card">
      <p className="eyebrow">Danger Zone</p>
      <h2>注销账号</h2>
      <p>注销后会删除你的上传照片和生成图片，积分流水会按必要审计要求保留。</p>
      <label>
        输入 DELETE 确认
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      </label>
      <label>
        当前密码
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button
        className="button"
        disabled={confirmation !== "DELETE" || !password || submitting}
        type="button"
        onClick={() => void handleDelete()}
      >
        {submitting ? "正在注销..." : "确认注销账号"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </section>
  );
}
