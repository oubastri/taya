"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAdapter } from "@/lib/data-adapter";
import { PROMPT_OPTIONS, type ProfilePrompt } from "@/types/user";
import { OnboardingPhotoPlaceholder } from "@/components/onboarding/OnboardingPhotoPlaceholder";
import { normalizeHandle, validateHandleFormat } from "@/lib/handle";
import { AuthShell } from "@/components/auth/AuthShell";
import { TayaWordmark } from "@/components/TayaWordmark";
import {
  figmaPrimaryBtn,
  figmaPrimaryBtnDisabled,
  figmaErrorText,
  figmaPageTitle,
} from "@/components/auth/figmaAuthStyles";
import { AutoHeightTextarea } from "@/components/settings/AutoHeightTextarea";
import { SettingsCharCounter } from "@/components/settings/SettingsCharCounter";
import {
  hubCard,
  labelText,
  valueText,
  valueInput,
  fieldErrorText,
} from "@/components/settings/settingsHubStyles";
import {
  handleCharLimitKeyDown,
  handleCharLimitPaste,
} from "@/components/settings/settingsCharLimitHandlers";

const SETTINGS_PROFILE_EDIT_ICON = "/icons/nav/edit.svg?v=5";
const SETTINGS_VERIFY_ICON = "/icons/nav/verify.svg?v=6";
const PROFILE_AVATAR = 84;
const EDIT_FAB = 32;
const MOTTO_MAX = 52;

/** Matches `components/FeedHome.tsx` feed header so the wordmark sits in the same place. */
const FEED_HEADER_STYLE: React.CSSProperties = {
  padding: "max(env(safe-area-inset-top), 20px) 20px 56px",
  position: "relative",
  width: "100%",
  boxSizing: "border-box",
};

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

type Step = "name" | "handle" | "photo" | "tagline" | "prompts";

const TOTAL_STEPS = 5;
const isMockMode = process.env.NEXT_PUBLIC_DATA_MODE !== "real";

type HandleUiStatus = "idle" | "checking" | "ok" | "taken" | "invalid";

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
    <AuthShell
      showBack={false}
      hideHeader
      beforeBody={
        <header style={FEED_HEADER_STYLE}>
          <TayaWordmark variant="feed" />
        </header>
      }
    >
      <div style={{ marginBottom: 20 }}>
        <p style={{ ...figmaPageTitle, margin: 0 }}>{title}</p>
        {subtitle ? (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              fontWeight: 400,
              color: "var(--foreground-muted)",
              lineHeight: 1.5,
              fontFamily: "var(--font-sans), sans-serif",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <ProgressRow step={step} />
      {children}
    </AuthShell>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const taglineCounterRef = useRef<HTMLParagraphElement>(null);
  const promptCounterRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const [step, setStep] = useState<Step>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [cleanHandle, setCleanHandle] = useState("");
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handleStatus, setHandleStatus] = useState<HandleUiStatus>("idle");
  const [onboardingUserId, setOnboardingUserId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  const [promptAnswers, setPromptAnswers] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

  useEffect(() => {
    if (isMockMode) return;
    void createClient()
      .auth.getUser()
      .then(({ data }) => setOnboardingUserId(data.user?.id ?? null));
  }, []);

  const checkHandleFree = useCallback(
    async (clean: string): Promise<boolean> => {
      if (!onboardingUserId) return true;
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", clean)
        .neq("id", onboardingUserId)
        .maybeSingle();
      return !data;
    },
    [onboardingUserId],
  );

  useEffect(() => {
    if (isMockMode) {
      const clean = normalizeHandle(handleInput);
      const fmtErr = validateHandleFormat(clean);
      if (fmtErr) {
        setHandleStatus("invalid");
        return;
      }
      setHandleStatus(clean ? "ok" : "idle");
      return;
    }

    const clean = normalizeHandle(handleInput);
    const fmtErr = validateHandleFormat(clean);
    if (fmtErr) {
      setHandleStatus("invalid");
      return;
    }

    let cancelled = false;
    setHandleStatus("checking");
    const t = window.setTimeout(async () => {
      const free = await checkHandleFree(clean);
      if (!cancelled) setHandleStatus(free ? "ok" : "taken");
    }, 420);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [handleInput, checkHandleFree]);

  function handleNameNext(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;
    setHandleInput(toHandle(`${firstName} ${lastName}`));
    setStep("handle");
  }

  async function handleHandleNext(e: React.FormEvent) {
    e.preventDefault();
    setHandleError(null);

    const clean = normalizeHandle(handleInput);
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

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (existing && (!uid || existing.id !== uid)) {
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
          name: fullName,
          handle: cleanHandle,
          avatarUrl: photoPreview ?? undefined,
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
        name: fullName,
        handle: cleanHandle,
        onboarding_completed: true,
      };
      if (avatarUrl) updates.avatar_url = avatarUrl;
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

  const handleShowsVerified =
    validateHandleFormat(normalizeHandle(handleInput)) === null && handleStatus === "ok";

  if (step === "name") {
    return (
      <OnboardingFrame
        step={1}
        title="What's your name?"
        subtitle="This is how your friends will see you in the feed."
      >
        <form onSubmit={handleNameNext} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={hubCard}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ ...labelText, margin: 0 }}>First name</p>
              <input
                type="text"
                autoFocus
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ ...valueInput, display: "block" }}
                placeholder=""
              />
            </div>
          </div>
          <div style={hubCard}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ ...labelText, margin: 0 }}>Last name</p>
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ ...valueInput, display: "block" }}
                placeholder=""
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!firstName.trim()}
            className="app-cta"
            style={primaryPill(!firstName.trim())}
          >
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
          <div style={hubCard}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ ...labelText, margin: 0 }}>Handle</p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  gap: 12,
                  minHeight: 32,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                  <span style={{ ...valueText, flexShrink: 0, marginRight: 2 }}>@</span>
                  <input
                    type="text"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    value={handleInput}
                    onChange={(e) => {
                      setHandleError(null);
                      setHandleInput(e.target.value.replace(/\s/g, ""));
                    }}
                    spellCheck={false}
                    style={{ ...valueInput, flex: 1, minWidth: 0 }}
                  />
                </div>
                {handleShowsVerified ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  >
                    <img
                      src={SETTINGS_VERIFY_ICON}
                      alt=""
                      width={24}
                      height={24}
                      style={{ display: "block" }}
                      aria-hidden
                      decoding="async"
                    />
                  </span>
                ) : null}
              </div>
              {handleError ||
              ((handleStatus === "invalid" && normalizeHandle(handleInput).length > 0) ||
                handleStatus === "taken") ? (
                <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                  {handleError ??
                    (handleStatus === "taken"
                      ? "Already taken"
                      : validateHandleFormat(normalizeHandle(handleInput)) ?? "")}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            className="app-cta"
            disabled={
              loading ||
              !handleInput.trim() ||
              handleStatus === "invalid" ||
              handleStatus === "taken" ||
              handleStatus === "checking"
            }
            style={primaryPill(
              loading ||
                !handleInput.trim() ||
                handleStatus === "invalid" ||
                handleStatus === "taken" ||
                handleStatus === "checking",
            )}
          >
            {loading ? "Checking…" : handleStatus === "checking" ? "Checking…" : "Continue"}
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
        subtitle="You know you want to upload a pic. Choose something vibey."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 8,
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                width: PROFILE_AVATAR,
                height: PROFILE_AVATAR,
              }}
            >
              <div
                style={{
                  width: PROFILE_AVATAR,
                  height: PROFILE_AVATAR,
                  borderRadius: 32,
                  overflow: "hidden",
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <OnboardingPhotoPlaceholder
                    firstName={firstName}
                    lastName={lastName}
                    size={PROFILE_AVATAR}
                  />
                )}
              </div>
              <button
                type="button"
                aria-label={photoPreview ? "Change profile photo" : "Add profile photo"}
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute",
                  right: -4,
                  bottom: -4,
                  width: EDIT_FAB,
                  height: EDIT_FAB,
                  borderRadius: "50%",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "var(--accent)",
                  WebkitTapHighlightColor: "transparent",
                }}
                className="active:scale-95"
              >
                <img
                  src={SETTINGS_PROFILE_EDIT_ICON}
                  alt=""
                  width={16}
                  height={16}
                  style={{ display: "block", filter: "brightness(0) invert(1)" }}
                  aria-hidden
                  decoding="async"
                />
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

          <button type="button" className="app-cta" onClick={() => setStep("tagline")} style={primaryPill(false)}>
            Continue
          </button>

          <button type="button" onClick={() => setStep("handle")} style={backBtnStyle}>
            Back
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  if (step === "tagline") {
    return (
      <OnboardingFrame
        step={4}
        title="What's your athlete motto?"
        subtitle="The line you live by."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={hubCard}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                  width: "100%",
                }}
              >
                <p style={{ ...labelText, margin: 0 }}>Motto</p>
                <SettingsCharCounter
                  ref={taglineCounterRef}
                  length={tagline.length}
                  max={MOTTO_MAX}
                  style={{
                    ...labelText,
                    margin: 0,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                  }}
                />
              </div>
              <AutoHeightTextarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, MOTTO_MAX))}
                onKeyDown={(e) =>
                  handleCharLimitKeyDown(e, MOTTO_MAX, taglineCounterRef.current)
                }
                onPaste={(e) => handleCharLimitPaste(e, MOTTO_MAX, taglineCounterRef.current)}
                rows={1}
                placeholder=""
                maxLength={MOTTO_MAX}
                style={{
                  ...valueInput,
                  resize: "none",
                  display: "block",
                  minHeight: 32,
                  color: tagline.trim() ? "var(--foreground)" : "var(--foreground-muted)",
                }}
              />
            </div>
          </div>
          <button type="button" className="app-cta" onClick={() => setStep("prompts")} style={primaryPill(false)}>
            Continue
          </button>
          <button type="button" onClick={() => setStep("photo")} style={backBtnStyle}>
            Back
          </button>
        </div>
      </OnboardingFrame>
    );
  }

  return (
    <OnboardingFrame
      step={5}
      title="Profile prompts"
      subtitle="Add personality to your profile. Don't overthink it. Whatever pops into your head first."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PROMPT_OPTIONS.map((question, i) => {
          const answer = promptAnswers[i] ?? "";
          return (
            <div key={question} style={hubCard}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      ...labelText,
                      margin: 0,
                      maxWidth: "14rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      lineHeight: 1.35,
                      whiteSpace: "normal",
                    }}
                  >
                    {question}
                  </p>
                  <SettingsCharCounter
                    ref={(el) => {
                      promptCounterRefs.current[i] = el;
                    }}
                    length={answer.length}
                    max={MOTTO_MAX}
                    style={{
                      ...labelText,
                      margin: 0,
                      whiteSpace: "nowrap",
                      textTransform: "none",
                    }}
                  />
                </div>
                <AutoHeightTextarea
                  value={answer}
                  onChange={(e) => {
                    const next = [...promptAnswers];
                    next[i] = e.target.value.slice(0, MOTTO_MAX);
                    setPromptAnswers(next);
                  }}
                  onKeyDown={(e) => {
                    if (
                      handleCharLimitKeyDown(
                        e,
                        MOTTO_MAX,
                        promptCounterRefs.current[i] ?? null,
                      )
                    ) {
                      return;
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.target as HTMLTextAreaElement).blur();
                    }
                  }}
                  onPaste={(e) =>
                    handleCharLimitPaste(
                      e,
                      MOTTO_MAX,
                      promptCounterRefs.current[i] ?? null,
                    )
                  }
                  placeholder="Your answer…"
                  maxLength={MOTTO_MAX}
                  rows={1}
                  style={{
                    ...valueInput,
                    resize: "none",
                    display: "block",
                    minHeight: 32,
                    color: answer.trim() ? "var(--foreground)" : "var(--foreground-muted)",
                  }}
                />
              </div>
            </div>
          );
        })}

        {handleError ? <p style={figmaErrorText}>{handleError}</p> : null}

        <button
          type="button"
          className="app-cta"
          onClick={handleFinish}
          disabled={loading}
          style={primaryPill(loading)}
        >
          {loading ? "Saving…" : "Let's go"}
        </button>

        <button type="button" onClick={() => setStep("tagline")} style={backBtnStyle}>
          Back
        </button>
      </div>
    </OnboardingFrame>
  );
}
