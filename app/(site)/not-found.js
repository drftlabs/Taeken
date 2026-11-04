import Link from "next/link";
export default function NotFound() {
  return <div className="page"><div className="center"><span className="stamp" aria-hidden="true" style={{ marginBottom: 24 }}>迷</span><h1 className="page-title">Lost in the <em>street</em></h1><p className="lead">That page doesn't exist.</p><Link className="btn" href="/">Back home</Link></div></div>;
}
