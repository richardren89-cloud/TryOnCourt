export function CreditBalance({ balance }: { balance: number }) {
  return (
    <section className="credit-card">
      <p className="eyebrow">当前积分</p>
      <strong>{balance}</strong>
      <p>每生成一张四宫格试衣图消耗 1 积分。</p>
    </section>
  );
}
