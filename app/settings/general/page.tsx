import { redirect } from "next/navigation";

/** General settings now live on the main Settings hub. */
export default function SettingsGeneralRedirectPage() {
  redirect("/settings");
}
