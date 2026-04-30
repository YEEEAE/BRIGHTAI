export default function Loading() {
  return (
    <main className="demo-page" aria-busy="true">
      <div className="demo-container" style={{ paddingBlock: 80 }}>
        <div className="glass-panel" style={{ minHeight: 420, padding: 32 }}>
          <p>جار تجهيز تجربة أتمتة الوثائق...</p>
        </div>
      </div>
    </main>
  );
}
