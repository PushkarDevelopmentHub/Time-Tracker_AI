"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ background: "#0f1115", color: "#f3f4f6", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "80px auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something broke</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>
            {error?.message || "An unexpected error happened on this page."}
          </p>
          <button
            onClick={() => reset()}
            style={{ background: "#7c9dff", color: "#0f1115", padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", marginRight: 8 }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{ background: "#161922", color: "#f3f4f6", padding: "10px 20px", borderRadius: 8, border: "1px solid #333", fontSize: 14, textDecoration: "none" }}
          >
            Go to dashboard
          </a>
        </div>
      </body>
    </html>
  );
}
