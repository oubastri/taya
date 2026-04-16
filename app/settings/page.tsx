"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { isRealMode, clearAuthCache } from "@/lib/data-adapter";
import { normalizeHandle, validateHandleFormat } from "@/lib/handle";
import { PROMPT_OPTIONS, type ProfilePrompt } from "@/types/user";
import { useToast } from "@/contexts/toast";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { ChangePasswordSheet } from "@/components/settings/ChangePasswordSheet";
import { AutoHeightTextarea } from "@/components/settings/AutoHeightTextarea";
import { SettingsCharCounter } from "@/components/settings/SettingsCharCounter";
import {
  hubCard,
  labelText,
  valueText,
  valueInput,
  pillBtn,
  fieldErrorText,
} from "@/components/settings/settingsHubStyles";
import { LegalFooterLinks } from "@/components/LegalFooterLinks";
import {
  handleCharLimitKeyDown,
  handleCharLimitPaste,
} from "@/components/settings/settingsCharLimitHandlers";

const PROFILE_AVATAR = 84;
const EDIT_FAB = 32;
const MOTTO_MAX = 52;
/** Figma Settings 445:2420 — card stack rhythm */
const CARD_GAP = 12;
const AVATAR_TO_FIRST_CARD = 30;
const PROMPTS_TITLE_TOP = 32;
const FOOTER_TOP = 40;
const FOOTER_BTN_GAP = 8;

/** Password row chevron — `public/icons/nav/arrow-right.svg` (from :icons set) */
const SETTINGS_ARROW_RIGHT_ICON = "/icons/nav/arrow-right.svg?v=7";
/** Profile-photo edit FAB — `public/icons/nav/edit.svg` */
const SETTINGS_PROFILE_EDIT_ICON = "/icons/nav/edit.svg?v=5";
/** Verified handle badge — `public/icons/nav/verify.svg` (from :icons set, green + white check) */
const SETTINGS_VERIFY_ICON = "/icons/nav/verify.svg?v=6";

type HandleUiStatus = "idle" | "checking" | "ok" | "taken" | "invalid";

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const taglineCounterRef = useRef<HTMLParagraphElement>(null);
  const promptCounterRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const { toast } = useToast();
  const { user, hydrated, updateUser } = useUser();
  const { friends } = useFriends();

  const [signingOut, setSigningOut] = useState(false);
  const [taglineInput, setTaglineInput] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [handleStatus, setHandleStatus] = useState<HandleUiStatus>("idle");
  const [uploading, setUploading] = useState(false);
  const [nameFieldError, setNameFieldError] = useState<string | null>(null);
  const [handleBlurError, setHandleBlurError] = useState<string | null>(null);
  const [avatarFieldError, setAvatarFieldError] = useState<string | null>(null);

  const [promptAnswers, setPromptAnswers] = useState<string[]>(() =>
    PROMPT_OPTIONS.map(() => ""),
  );

  const profileSyncedForUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!hydrated) return;
    if (profileSyncedForUserId.current === user.id) return;
    profileSyncedForUserId.current = user.id;
    setTaglineInput(user.tagline ?? "");
    setNameInput(user.name);
    setHandleInput(user.handle);
  }, [hydrated, user.id, user.tagline, user.name, user.handle]);

  useEffect(() => {
    if (!hydrated) return;
    const answers = PROMPT_OPTIONS.map((q) => {
      const p = user.prompts?.find((x) => x.question === q);
      return p?.answer ?? "";
    });
    setPromptAnswers(answers);
  }, [hydrated, user.prompts]);

  const checkHandleFree = useCallback(
    async (clean: string): Promise<boolean> => {
      if (!isRealMode) {
        const list = friends ?? [];
        return !list.some((f) => f.id !== user.id && f.handle.toLowerCase() === clean);
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", clean)
        .neq("id", user.id)
        .maybeSingle();
      return !data;
    },
    [friends, user.id],
  );

  useEffect(() => {
    const clean = normalizeHandle(handleInput);
    if (clean === user.handle) {
      setHandleStatus("idle");
      return;
    }
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
  }, [handleInput, user.handle, checkHandleFree]);

  function handleSaveTagline() {
    const trimmed = taglineInput.trim();
    if (trimmed === (user.tagline ?? "")) return;
    updateUser({ tagline: trimmed || undefined });
    toast("Tagline saved", "success");
  }

  function handleSavePrompt(index: number) {
    const trimmed = promptAnswers[index]!.trim();
    const prev =
      user.prompts?.find((x) => x.question === PROMPT_OPTIONS[index])?.answer?.trim() ?? "";
    if (trimmed === prev) return;
    const next = [...promptAnswers];
    next[index] = trimmed;
    setPromptAnswers(next);
    const prompts: ProfilePrompt[] = PROMPT_OPTIONS.map((q, i) => ({
      question: q,
      answer: (i === index ? trimmed : next[i] ?? "").trim(),
    })).filter((p) => p.answer.length > 0);
    updateUser({ prompts: prompts.length > 0 ? prompts : undefined });
    toast("Prompt saved", "success");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFieldError(null);

    if (!isRealMode) {
      const url = URL.createObjectURL(file);
      updateUser({ avatarUrl: url });
      toast("Photo updated", "success");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        setAvatarFieldError("Upload failed — make sure the avatars bucket exists.");
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: "id" });
      updateUser({ avatarUrl: publicUrl });
      toast("Photo updated", "success");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleBlurName() {
    const trimmed = nameInput.trim();
    if (trimmed === user.name) return;
    if (!trimmed) {
      setNameFieldError("Please enter your name.");
      setNameInput(user.name);
      return;
    }
    setNameFieldError(null);
    updateUser({ name: trimmed });
    toast("Name saved", "success");
  }

  async function handleBlurHandle() {
    const clean = normalizeHandle(handleInput);
    if (clean === user.handle) return;

    const fmt = validateHandleFormat(clean);
    if (fmt) {
      setHandleBlurError(fmt);
      setHandleInput(user.handle);
      return;
    }

    const free = await checkHandleFree(clean);
    if (!free) {
      setHandleBlurError("Already taken");
      setHandleInput(user.handle);
      return;
    }

    setHandleBlurError(null);
    updateUser({ handle: clean });
    toast("Handle saved", "success");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (isRealMode) {
        const supabase = createClient();
        await supabase.auth.signOut();
        clearAuthCache();
      }
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const handleShowsVerified =
    validateHandleFormat(normalizeHandle(handleInput)) === null &&
    (handleStatus === "ok" ||
      (handleStatus === "idle" && normalizeHandle(handleInput) === user.handle));

  if (!hydrated) return null;

  return (
    <SettingsShell variant="hub">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 8,
          marginBottom: AVATAR_TO_FIRST_CARD,
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
              backgroundColor: "#979797",
            }}
          >
            <UserAvatar avatarUrl={user.avatarUrl} name={user.name} fillParent expandable />
          </div>
          <button
            type="button"
            aria-label="Change profile photo"
            disabled={uploading}
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
              cursor: uploading ? "wait" : "pointer",
              background: "var(--accent)",
              WebkitTapHighlightColor: "transparent",
            }}
            className="active:scale-95"
          >
            {uploading ? (
              <span
                className="settings-avatar-spin"
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <img
                src={SETTINGS_PROFILE_EDIT_ICON}
                alt=""
                width={16}
                height={16}
                style={{ display: "block", filter: "brightness(0) invert(1)" }}
                aria-hidden
                decoding="async"
              />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>
        {avatarFieldError ? (
          <p
            role="alert"
            style={{
              ...fieldErrorText,
              marginTop: 10,
              textAlign: "center",
              maxWidth: "100%",
              paddingLeft: 16,
              paddingRight: 16,
              boxSizing: "border-box",
            }}
          >
            {avatarFieldError}
          </p>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: CARD_GAP }}>
        {/* Name */}
        <div style={hubCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ ...labelText, margin: 0 }}>Name</p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameFieldError(null);
                setNameInput(e.target.value);
              }}
              onBlur={() => void handleBlurName()}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              autoComplete="name"
              style={{ ...valueInput, display: "block" }}
            />
            {nameFieldError ? (
              <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                {nameFieldError}
              </p>
            ) : null}
          </div>
        </div>

        {/* Handle */}
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
                  value={handleInput}
                  onChange={(e) => {
                    setHandleBlurError(null);
                    setHandleInput(e.target.value.replace(/\s/g, ""));
                  }}
                  onBlur={() => void handleBlurHandle()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  autoComplete="username"
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
            {handleBlurError ||
            ((handleStatus === "invalid" && normalizeHandle(handleInput) !== user.handle) ||
              handleStatus === "taken") ? (
              <p role="alert" style={{ ...fieldErrorText, marginTop: 4 }}>
                {handleBlurError ??
                  (handleStatus === "taken"
                    ? "Already taken"
                    : validateHandleFormat(normalizeHandle(handleInput)) ?? "")}
              </p>
            ) : null}
          </div>
        </div>

        {/* Motto (tagline) */}
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
              <p style={{ ...labelText, margin: 0 }}>Tagline</p>
              <SettingsCharCounter
                ref={taglineCounterRef}
                length={taglineInput.length}
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
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value.slice(0, MOTTO_MAX))}
              onBlur={handleSaveTagline}
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
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div style={hubCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ ...labelText, margin: 0 }}>Email</p>
            <p
              style={{
                ...valueText,
                margin: 0,
                wordBreak: "break-word",
                color: user.email ? "var(--foreground)" : "var(--foreground-muted)",
              }}
            >
              {user.email ?? "—"}
            </p>
          </div>
        </div>

        {isRealMode ? (
          <button
            type="button"
            onClick={() => setPasswordOpen(true)}
            style={{
              ...hubCard,
              cursor: "pointer",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
            className="active:opacity-90"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                width: "100%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                <p style={{ ...labelText, margin: 0 }}>Password</p>
                <p
                  style={{
                    ...valueText,
                    margin: 0,
                    letterSpacing: 2,
                    userSelect: "none",
                  }}
                  aria-hidden
                >
                  ••••••••
                </p>
              </div>
              <img
                src={SETTINGS_ARROW_RIGHT_ICON}
                alt=""
                width={20}
                height={20}
                className="nav-btn-icon"
                aria-hidden
                style={{ display: "block", flexShrink: 0 }}
                decoding="async"
              />
            </div>
          </button>
        ) : null}
      </div>

      <p
        style={{
          margin: `${PROMPTS_TITLE_TOP}px 0 0`,
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "normal",
          letterSpacing: "-0.64px",
          color: "var(--foreground)",
        }}
      >
        Prompts
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: CARD_GAP,
          marginTop: CARD_GAP,
        }}
      >
        {PROMPT_OPTIONS.map((question, i) => {
          const answer = promptAnswers[i] ?? "";
          return (
            <div key={question} style={hubCard}>
              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
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
                  onBlur={() => handleSavePrompt(i)}
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
                    color: answer.trim()
                      ? "var(--foreground)"
                      : "var(--foreground-muted)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: FOOTER_TOP,
          display: "flex",
          flexDirection: "column",
          gap: FOOTER_BTN_GAP,
        }}
      >
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          style={{
            ...pillBtn,
            opacity: signingOut ? 0.65 : 1,
            cursor: signingOut ? "wait" : "pointer",
          }}
          className="app-cta active:opacity-90"
        >
          {signingOut ? "Signing out…" : "Logout"}
        </button>
      </div>

      <div style={{ marginTop: FOOTER_TOP }}>
        <LegalFooterLinks />
      </div>

      {passwordOpen ? (
        <ChangePasswordSheet onClose={() => setPasswordOpen(false)} />
      ) : null}
    </SettingsShell>
  );
}
