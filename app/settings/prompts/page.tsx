"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { PROMPT_OPTIONS, type ProfilePrompt } from "@/types/user";
import { useToast } from "@/contexts/toast";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import {
  FIELD_INPUT,
  FIELD_LABEL,
  INSET_ROW,
  INSET_ROW_LAST,
} from "@/components/settings/settingsForms";

export default function SettingsPromptsPage() {
  const { toast } = useToast();
  const { user, hydrated, updateUser } = useUser();
  const [promptAnswers, setPromptAnswers] = useState<string[]>(["", "", "", ""]);
  const fieldsInit = useRef(false);

  useEffect(() => {
    if (!hydrated || fieldsInit.current) return;
    fieldsInit.current = true;
    const answers = PROMPT_OPTIONS.map((q) => {
      const existing = user.prompts?.find((p) => p.question === q);
      return existing?.answer ?? "";
    });
    setPromptAnswers(answers);
  }, [hydrated, user.prompts]);

  function handleSavePrompt(index: number) {
    const answer = promptAnswers[index]!.trim();
    const prompts: ProfilePrompt[] = PROMPT_OPTIONS.map((q, i) => ({
      question: q,
      answer: i === index ? answer : (promptAnswers[i]?.trim() ?? ""),
    })).filter((p) => p.answer);
    updateUser({ prompts: prompts.length > 0 ? prompts : undefined });
    toast("Prompt saved!", "success");
  }

  if (!hydrated) return null;

  return (
    <SettingsShell title="Prompts">
      <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 500, color: "var(--foreground-muted)", lineHeight: 1.45 }}>
        Short answers show on your profile. Tap outside a field or press enter to save.
      </p>

      <SettingsGroup>
        {PROMPT_OPTIONS.map((question, i) => {
          const isLast = i === PROMPT_OPTIONS.length - 1;
          return (
            <div key={question} style={isLast ? INSET_ROW_LAST : INSET_ROW}>
              <label style={{ ...FIELD_LABEL, textTransform: "none", letterSpacing: "-0.02em", fontSize: 12, fontWeight: 600 }}>
                {question}
              </label>
              <input
                type="text"
                value={promptAnswers[i] ?? ""}
                onChange={(e) => {
                  const next = [...promptAnswers];
                  next[i] = e.target.value;
                  setPromptAnswers(next);
                }}
                onBlur={() => handleSavePrompt(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                placeholder="Your answer…"
                maxLength={52}
                style={FIELD_INPUT}
              />
            </div>
          );
        })}
      </SettingsGroup>
    </SettingsShell>
  );
}
