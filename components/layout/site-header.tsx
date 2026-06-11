import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-logo" href="/">
        CourtFit AI
      </Link>
      <nav aria-label="主导航">
        <Link href="/outfits">穿搭橱窗</Link>
        <Link href="/history">生成历史</Link>
        <Link href="/credits">积分</Link>
        <Link href="/login">登录</Link>
      </nav>
    </header>
  );
}
