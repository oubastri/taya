"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAdapter } from "@/lib/data-adapter";
import { UserAvatar } from "@/components/UserAvatar";
import { PROMPT_OPTIONS, type ProfilePrompt } from "@/types/user";
import { normalizeHandle, validateHandleFormat } from "@/lib/handle";

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
      const prompts: ProfilePrompt[] = PROMPT_OPTIONS
        .map((q, i) => ({ question: q, answer: promptAnswers[i]?.trim() ?? "" }))
        .filter((p) => p.answer);

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
      const { data: { user } } = await supabase.auth.getUser();
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

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

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

  // Step 1: Name
  if (step === "name") {
    return (
      <OnboardingShell step={1}>
        <form onSubmit={handleNameNext} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={titleStyle}>What&apos;s your name?</p>
            <p style={subtitleStyle}>This is how your friends will see you in the feed.</p>
          </div>
          <input
            type="text"
            autoFocus
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={textInputStyle}
          />
          <button type="submit" disabled={!name.trim()} style={primaryBtn(!name.trim())}>
            Continue
          </button>
        </form>
      </OnboardingShell>
    );
  }

  // Step 2: Handle
  if (step === "handle") {
    return (
      <OnboardingShell step={2}>
        <form onSubmit={handleHandleNext} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={titleStyle}>Pick a handle</p>
            <p style={subtitleStyle}>This is your unique username. You can change it later.</p>
          </div>

          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--foreground-subtle)",
                pointerEvents: "none",
                userSelect: "none",
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
              style={{
                ...textInputStyle,
                paddingLeft: 34,
                borderColor: handleError ? "#e53e3e" : "var(--border-strong)",
              }}
            />
          </div>

          {handleError && (
            <p style={{ margin: "-8px 0 0", fontSize: 13, fontWeight: 500, color: "#e53e3e" }}>
              {handleError}
            </p>
          )}

          <button type="submit" disabled={loading || !handle.trim()} style={primaryBtn(loading || !handle.trim())}>
            {loading ? "Checking…" : "Continue"}
          </button>

          <button type="button" onClick={() => setStep("name")} style={backBtnStyle}>
            ← Back
          </button>
        </form>
      </OnboardingShell>
    );
  }

  // Step 3: Photo (optional)
  if (step === "photo") {
    return (
      <OnboardingShell step={3}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={titleStyle}>Add a photo</p>
            <p style={subtitleStyle}>Optional — helps friends recognize you in the feed.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 120,
                height: 120,
                borderRadius: 44,
                overflow: "hidden",
                cursor: "pointer",
                border: "2px dashed var(--border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--surface)",
                transition: "border-color 0.2s",
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
                fontWeight: 700,
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

          <button type="button" onClick={() => setStep("location")} style={primaryBtn(false)}>
            Continue
          </button>

          <button type="button" onClick={() => setStep("handle")} style={backBtnStyle}>
            ← Back
          </button>
        </div>
      </OnboardingShell>
    );
  }

  // Step 4: Location (optional)
  if (step === "location") {
    return (
      <OnboardingShell step={4}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={titleStyle}>Where are you based?</p>
            <p style={subtitleStyle}>Optional — shows on your profile so others can find local athletes.</p>
          </div>
          <input
            type="text"
            autoFocus
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Los Angeles"
            style={textInputStyle}
          />
          <button type="button" onClick={() => setStep("tagline")} style={primaryBtn(false)}>
            Continue
          </button>
          <button type="button" onClick={() => setStep("photo")} style={backBtnStyle}>
            ← Back
          </button>
        </div>
      </OnboardingShell>
    );
  }

  // Step 5: Tagline (optional)
  if (step === "tagline") {
    return (
      <OnboardingShell step={5}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={titleStyle}>Add a tagline</p>
            <p style={subtitleStyle}>Optional — a motto or phrase that represents your athletic journey.</p>
          </div>
          <input
            type="text"
            autoFocus
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. All day I dream about sports."
            maxLength={120}
            style={textInputStyle}
          />
          <button type="button" onClick={() => setStep("prompts")} style={primaryBtn(false)}>
            Continue
          </button>
          <button type="button" onClick={() => setStep("location")} style={backBtnStyle}>
            ← Back
          </button>
        </div>
      </OnboardingShell>
    );
  }

  // Step 6: Prompts (optional)
  return (
    <OnboardingShell step={6}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <p style={titleStyle}>Profile prompts</p>
          <p style={subtitleStyle}>Optional — answer any that speak to you. These show on your About page.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PROMPT_OPTIONS.map((question, i) => (
            <div key={question}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "-0.2px",
                  color: "var(--foreground-subtle)",
                  marginBottom: 6,
                  fontFamily: "var(--font-mono), 'B612 Mono', monospace",
                  textTransform: "uppercase",
                }}
              >
                {question}
              </label>
              <input
                type="text"
                value={promptAnswers[i]}
                onChange={(e) => {
                  const next = [...promptAnswers];
                  next[i] = e.target.value;
                  setPromptAnswers(next);
                }}
                placeholder="Your answer..."
                maxLength={200}
                style={{ ...textInputStyle, fontSize: 16 }}
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={handleFinish} disabled={loading} style={primaryBtn(loading)}>
          {loading ? "Saving…" : "Let's go"}
        </button>

        <button type="button" onClick={() => setStep("tagline")} style={backBtnStyle}>
          ← Back
        </button>
      </div>
    </OnboardingShell>
  );
}

// Shared styles

const titleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "var(--foreground)",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: "var(--foreground-muted)",
  lineHeight: 1.5,
};

const textInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  backgroundColor: "var(--surface)",
  fontSize: 20,
  fontFamily: "inherit",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--foreground)",
  outline: "none",
  boxSizing: "border-box",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "16px",
    borderRadius: "var(--radius-full)",
    border: "none",
    backgroundColor: disabled ? "var(--foreground-faint)" : "var(--foreground)",
    color: "var(--surface)",
    fontSize: 15,
    fontWeight: 800,
    fontFamily: "inherit",
    letterSpacing: "-0.02em",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.2s ease",
  };
}

const backBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--foreground-muted)",
  fontSize: 14,
  fontFamily: "inherit",
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  textAlign: "center",
};

function OnboardingShell({
  children,
  step,
}: {
  children: React.ReactNode;
  step: number;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              style={{
                height: 4,
                flex: 1,
                borderRadius: 9999,
                backgroundColor: s <= step ? "var(--foreground)" : "var(--border-strong)",
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </div>
        {children}
      </div>
    </main>
  );
}
