export default function Loading() {
  return (
    <div className="ldg" role="status" aria-live="polite">
      <img src="/logo.png" alt="" width="84" height="52" />
      <div className="ldg-bar"><i /></div>
      <p>読込中 <span>Loading</span></p>
    </div>
  );
}
