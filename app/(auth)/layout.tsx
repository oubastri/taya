import { Suspense } from "react";
import { AuthLandingScaffold } from "@/components/auth/AuthLandingScaffold";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh"
          style={{ background: "var(--background)" }}
          aria-hidden
        />
      }
    >
      <AuthLandingScaffold>{children}</AuthLandingScaffold>
    </Suspense>
  );
}
