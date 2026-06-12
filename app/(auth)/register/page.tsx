import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <h1>注册 CourtFit AI</h1>
      <p>新用户注册后获得 5 个积分。13 至 17 岁用户需要确认已获得监护人同意。</p>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
