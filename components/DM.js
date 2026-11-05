// Small red directional marks (chevrons / arrows) used as street-signage accents.
export default function DM({ dir = "right", n = 3, className = "", label }) {
  return (
    <span className={"dm " + dir + " " + className} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => <svg key={i} viewBox="0 0 12 16" style={{ "--i": i }}><path d="M2 2l8 6-8 6" /></svg>)}
      {label && <em>{label}</em>}
    </span>
  );
}
