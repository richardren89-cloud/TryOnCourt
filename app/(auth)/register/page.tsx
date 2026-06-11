export default function RegisterPage() {
  return (
    <main className="auth-page">
      <h1>注册 CourtFit AI</h1>
      <p>新用户注册后获得 5 个积分。13 至 17 岁用户需要确认已获得监护人同意。</p>
      <form>
        <label>
          用户名
          <input name="username" autoComplete="username" />
        </label>
        <label>
          密码
          <input name="password" type="password" autoComplete="new-password" />
        </label>
        <label>
          出生年份
          <input name="birthYear" inputMode="numeric" />
        </label>
        <label>
          <input name="ageConfirmed" type="checkbox" /> 我确认自己年满 13 岁
        </label>
        <label>
          <input name="guardianConsent" type="checkbox" /> 未满 18 岁时，我已获得监护人同意
        </label>
        <button type="submit">注册</button>
      </form>
    </main>
  );
}
