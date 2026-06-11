export default function LoginPage() {
  return (
    <main className="auth-page">
      <h1>登录</h1>
      <form>
        <label>
          用户名
          <input name="username" autoComplete="username" />
        </label>
        <label>
          密码
          <input name="password" type="password" autoComplete="current-password" />
        </label>
        <button type="submit">登录</button>
      </form>
    </main>
  );
}
