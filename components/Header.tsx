"use client";

export function Header() {
  return (
    <div
      className="w-full overflow-visible font-sans"
      style={{
        paddingTop: 0,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        boxSizing: "border-box",
        fontFamily: "var(--font-sans), sans-serif",
        fontWeight: 500,
      }}
    >
      {/* Desktop (768px+): ONE line */}
      <h1
        className="hidden w-full md:block"
        style={{
          margin: 0,
          marginTop: "-0.25em",
          marginLeft: "-0.03em",
          padding: 0,
          textAlign: "center",
          fontFamily: "var(--font-sans), sans-serif",
          fontWeight: 500,
          fontSize: "clamp(100px, 13vw, 300px)",
          letterSpacing: "-0.08em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "visible",
        }}
      >
        <span style={{ color: "#000000" }}>To All You </span>
        <span style={{ color: "#11EB0E" }}>Athletes</span>
      </h1>

      {/* Mobile (<768px): TWO lines — less pull so two lines don't get cropped */}
      <h1
        className="block w-full md:hidden"
        style={{
          margin: 0,
          marginTop: "-0.07em",
          marginLeft: "-0.11em",
          marginRight: "auto",
          padding: 0,
          textAlign: "center",
          width: "100%",
          fontFamily: "var(--font-sans), sans-serif",
          fontWeight: 500,
          fontSize: "clamp(56px, 24.5vw, 130px)",
          letterSpacing: "-0.08em",
          lineHeight: 0.74,
          overflow: "visible",
        }}
      >
        <span className="block whitespace-nowrap" style={{ color: "#000000" }}>
          To All You
        </span>
        <span className="block whitespace-nowrap" style={{ color: "#11EB0E" }}>
          Athletes
        </span>
      </h1>
    </div>
  );
}
