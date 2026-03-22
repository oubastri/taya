import { AuthLandingScaffold } from "@/components/auth/AuthLandingScaffold";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLandingScaffold>{children}</AuthLandingScaffold>;
}
