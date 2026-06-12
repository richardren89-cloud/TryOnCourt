"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const TERMS_VERSION = "terms-2026-06";
const PRIVACY_VERSION = "privacy-2026-06";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const birthYear = Number(formData.get("birthYear"));
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        birthYear,
        ageConfirmed: formData.get("ageConfirmed") === "on",
        guardianConsent: formData.get("guardianConsent") === "on",
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "注册失败，请检查填写信息。");
      setIsSubmitting(false);
      return;
    }

    router.push(safeRedirect(searchParams.get("next")) ?? "/credits");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        用户名
        <input
          name="username"
          autoComplete="username"
          minLength={3}
          maxLength={32}
          pattern="[A-Za-z0-9_]+"
          required
        />
      </label>
      <p className="form-hint">3-32 位英文字母、数字或下划线。</p>
      <label>
        密码
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </label>
      <p className="form-hint">至少 10 位字符。</p>
      <label>
        出生年份
        <input name="birthYear" inputMode="numeric" min="1900" max="2013" required />
      </label>
      <label className="inline-choice">
        <input name="ageConfirmed" type="checkbox" required /> 我确认自己年满 13 岁
      </label>
      <label className="inline-choice">
        <input name="guardianConsent" type="checkbox" /> 未满 18 岁时，我已获得监护人同意
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "注册中..." : "注册并领取 5 积分"}
      </button>
      <p className="auth-switch">
        已有账号？ <Link href="/login">去登录</Link>
      </p>
    </form>
  );
}

function safeRedirect(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}
