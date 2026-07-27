import Link from "next/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav style={{ padding: "12px 24px", background: "#1a1a2e", color: "#fff", display: "flex", gap: 24 }}>
        <strong>WRAM Report System</strong>
        <Link href="/" style={{ color: "#fff" }}>Home</Link>
        <Link href="/reports" style={{ color: "#fff" }}>Reports</Link>
        <Link href="/login" style={{ color: "#fff" }}>Login</Link>
      </nav>
      <main style={{ padding: "24px" }}>{children}</main>
    </div>
  );
}
