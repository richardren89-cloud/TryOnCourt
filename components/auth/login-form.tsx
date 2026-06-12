"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "登录失败，请检查用户名和密码。");
      setIsSubmitting(false);
      return;
    }

    router.push(safeRedirect(searchParams.get("next")) ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        用户名
        <input name="username" autoComplete="username" required />
      </label>
      <label>
        密码
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "登录中..." : "登录"}
      </button>
      <p className="auth-switch">
        没有账号？{" "}
        <Link href="/register">
          立即注册，领取 5 积分
        </Link>
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
