import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero">
        <p className="eyebrow">AI 网球试衣</p>
        <h1>CourtFit AI</h1>
        <p>选择职业网球穿搭，上传两张照片，生成四大满贯四宫格赛场造型。</p>
        <div className="hero-actions">
          <Link className="button" href="/outfits">
            浏览穿搭橱窗
          </Link>
          <Link className="button button--ghost" href="/register">
            注册领取 5 积分
          </Link>
        </div>
      </section>
      <section className="steps" aria-label="使用步骤">
        <article>
          <span>1</span>
          <h2>选择组合</h2>
          <p>从职业球员灵感穿搭中选择完整上装、下装、鞋袜与配饰。</p>
        </article>
        <article>
          <span>2</span>
          <h2>上传照片</h2>
          <p>上传一张全身照和一张正面头像，可选择是否保存原图。</p>
        </article>
        <article>
          <span>3</span>
          <h2>生成四宫格</h2>
          <p>一次消耗 1 积分，获得四种赛场背景的写实试衣图。</p>
        </article>
      </section>
    </main>
  );
}
