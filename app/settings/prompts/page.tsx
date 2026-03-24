import { redirect } from "next/navigation";

/** Prompts editing now lives on the main Settings page. */
export default function SettingsPromptsRedirectPage() {
  redirect("/settings");
}
