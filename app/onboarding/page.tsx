"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAdapter } from "@/lib/data-adapter";
import { UserAvatar } from "@/components/UserAvatar";
import { PROMPT_OPTIONS, type ProfilePrompt } from "@/types/user";
import { normalizeHandle, validateHandleFormat } from "@/lib/handle";
import { AuthShell } from "@/components/auth/AuthShell";
import { FigmaAuthHeader } from "@/components/auth/FigmaAuthHeader";
import { FigmaFieldCard } from "@/components/auth/FigmaFieldCard";
import {
  figmaFieldCard,
  figmaFieldInput,
  figmaFieldLabel,
  figmaPrimaryBtn,
  figmaPrimaryBtnDisabled,
  figmaErrorText,
} from "@/components/auth/figmaAuthStyles";

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

type Step = "name" | "handle" | "photo" | "location" | "tagline" | "prompts";

const TOTAL_STEPS = 6;
const isMockMode = process.env.NEXT_PUBLIC_DATA_MODE !== "real";

const backBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--foreground-muted)",
  fontSize: 15,
  fontFamily: "var(--font-sans), sans-serif",
  fontWeight: 500,
  cursor: "pointer",
  padding: "8px 0",
  textAlign: "center",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

function primaryPill(disabled: boolean): React.CSSProperties {
  return {
    ...figmaPrimaryBtn,
    ...(disabled ? figmaPrimaryBtnDisabled : {}),
  };
}

function ProgressRow({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 9999,
            backgroundColor:
              s <= step ? "var(--foreground)" : "var(--figma-auth-progress-inactive)",
            transition: "background-color 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function OnboardingFrame({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <AuthShell showBack={false}>
      <FigmaAuthHeader title={title} subtitle={subtitle} />
      <ProgressRow step={step} />
      {children}
    </AuthShell>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [cleanHandle, setCleanHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [tagline, setTagline] = useState("");
  const [promptAnswers, setPromptAnswers] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setHandle(toHandle(trimmed));
    setStep("handle");
  }

  async function handleHandleNext(e: React.FormEvent) {
    e.preventDefault();
    setHandleError(null);

    const clean = normalizeHandle(handle);
    const fmtErr = validateHandleFormat(clean);
    if (fmtErr) {
      setHandleError(fmtErr);
      return;
    }

    if (isMockMode) {
      setCleanHandle(clean);
      setStep("photo");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", clean)
        .maybeSingle();

      if (existing) {
        setHandleError("That handle is already taken. Try another one.");
        return;
      }
      setCleanHandle(clean);
      setStep("photo");
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const prompts: ProfilePrompt[] = PROMPT_OPTIONS.map((q, i) => ({
        question: q,
        answer: promptAnswers[i]?.trim() ?? "",
      })).filter((p) => p.answer);

      if (isMockMode) {
        const adapter = getAdapter();
        adapter.setUser({
          id: "me",
          name: name.trim(),
          handle: cleanHandle,
          avatarUrl: photoPreview ?? undefined,
          location: location.trim() || undefined,
          tagline: tagline.trim() || undefined,
          prompts: prompts.length > 0 ? prompts : undefined,
        });
        router.push("/");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      let avatarUrl: string | undefined;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      }

      const updates: Record<string, unknown> = {
        name: name.trim(),
        handle: cleanHandle,
        onboarding_completed: true,
      };
      if (avatarUrl) updates.avatar_url = avatarUrl;
      if (location.trim()) updates.location = location.trim();
      if (tagline.trim()) updates.tagline = tagline.trim();
      if (prompts.length > 0) updates.prompts = prompts;

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

      if (error) {
        setHandleError(error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (step === "name") {
    return (
      <OnboardingFrame
        step={1}
        title="What's your name?"
        subtitle="This is how your friends will see you in the feed."
      >
        <form onSubmit={handleNameNext} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FigmaFieldCard label="Name">
            <input
              type="text"
              autoFocus
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="Your name"
            />
          </FigmaFieldCard>
          <button type="submit" disabled={!name.trim()} style={primaryPill(!name.trim())}>
            Continue
          </button>
        </form>
      </OnboardingFrame>
    );
  }

  if (step === "handle") {
    return (
      <OnboardingFrame
        step={2}
        title="Pick a handle"
        subtitle="This is your unique username. You can change it later."
      >
        <form onSubmit={handleHandleNext} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              ...figmaFieldCard,
              ...(handleError ? { boxShadow: "inset 0 0 0 1px #ff3a3a" } : {}),
            }}
          >
            <p style={figmaFieldLabel}>Handle</p>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 24,
                  fontWeight: 400,
                  color: "var(--figma-auth-label)",
                  pointerEvents: "none",
                  userSelect: "none",
                  letterSpacing: "-0.96px",
                }}
              >
                @
              </span>
              <input
                type="text"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                value={handle}
                onChange={(e) => {
                  setHandleError(null);
                  setHandle(e.target.value.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, ""));
                }}
                placeholder="yourhandle"
                className="figma-auth-input"
                style={{ ...figmaFieldInput, paddingLeft: 26 }}
              />
            </div>
          </div>

          {handleError ? <p style={figmaErrorText}>{handleError}</p> : null}

          <button
            type="submit"
            disabled={loading || !handle.trim()}
            style={primaryPill(loading || !handle.trim())}
          >
            {loading ? "Checking…" : "Continue"}
          </button>

          <button type="button" onClick={() => setStep("name")} style={backBtnStyle}>
            Back
          </button>
        </form>
      </OnboardingFrame>
    );
  }

  if (step === "photo") {
    return (
      <OnboardingFrame
        step={3}
        title="Add a photo"
        subtitle="Optional — helps friends recognize you in the feed."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={figmaFieldCard}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 44,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px dashed var(--figma-auth-progress-inactive)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <UserAvatar name={name} size="lg" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {photoPreview ? "Change photo" : "Choose photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <button type="button" onClick={() => setStep("location")} style={primaryPill(false)}>
            Continue
          </button>

          <button type="button" onClick={() => setStep("handle")} style={backBtnStyle}>
            Back
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  if (step === "location") {
    return (
      <OnboardingFrame
        step={4}
        title="Where are you based?"
        subtitle="Optional — shows on your profile so others can find local athletes."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FigmaFieldCard label="Location">
            <input
              type="text"
              autoFocus
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="e.g. Los Angeles"
            />
          </FigmaFieldCard>
          <button type="button" onClick={() => setStep("tagline")} style={primaryPill(false)}>
            Continue
          </button>
          <button type="button" onClick={() => setStep("photo")} style={backBtnStyle}>
            Back
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  if (step === "tagline") {
    return (
      <OnboardingFrame
        step={5}
        title="Add a tagline"
        subtitle="Optional — a motto or phrase that represents your athletic journey."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FigmaFieldCard label="Tagline">
            <input
              type="text"
              autoFocus
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="figma-auth-input"
              style={figmaFieldInput}
              placeholder="e.g. All day I dream about sports."
              maxLength={120}
            />
          </FigmaFieldCard>
          <button type="button" onClick={() => setStep("prompts")} style={primaryPill(false)}>
            Continue
          </button>
          <button type="button" onClick={() => setStep("location")} style={backBtnStyle}>
            Back
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      step={6}
      title="Profile prompts"
      subtitle="Optional — answer any that speak to you. These show on your About page."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PROMPT_OPTIONS.map((question, i) => (
          <div key={question} style={figmaFieldCard}>
            <p
              style={{
                ...figmaFieldLabel,
                textTransform: "none",
                letterSpacing: "-0.02em",
                lineHeight: 1.35,
                whiteSpace: "normal",
              }}
            >
              {question}
            </p>
            <input
              type="text"
              value={promptAnswers[i]}
              onChange={(e) => {
                const next = [...promptAnswers];
                next[i] = e.target.value;
                setPromptAnswers(next);
              }}
              placeholder="Your answer…"
              maxLength={200}
              className="figma-auth-input"
              style={figmaFieldInput}
            />
          </div>
        ))}

        {handleError ? <p style={figmaErrorText}>{handleError}</p> : null}

        <button type="button" onClick={handleFinish} disabled={loading} style={primaryPill(loading)}>
          {loading ? "Saving…" : "Let's go"}
        </button>

        <button type="button" onClick={() => setStep("tagline")} style={backBtnStyle}>
          Back
        </button>
      </div>
    </OnboardingFrame>
  );
}
