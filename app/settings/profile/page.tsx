import { redirect } from "next/navigation";

/** Profile editing now lives on the main Settings hub. */
export default function SettingsProfileRedirectPage() {
  redirect("/settings");
}
