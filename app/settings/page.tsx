"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { isRealMode } from "@/lib/data-adapter";

export default function SettingsPage() {
  const router = useRouter();
  const { user, hydrated, updateUser } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameInput, setNameInput] = useState("");
  const [nameReady, setNameReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!nameReady && hydrated) {
    setNameInput(user.name);
    setNameReady(true);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isRealMode) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        showToast("Upload failed — make sure the avatars bucket exists.");
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      updateUser({ avatarUrl: publicUrl });
      showToast("Photo updated!");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user.name) return;
    updateUser({ name: trimmed });
    showToast("Name saved!");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      if (isRealMode) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      if (isRealMode) {
        const supabase = createClient();
        const { error } = await supabase.rpc("delete_own_account");
        if (error) {
          showToast("Failed to delete account.");
          setShowDeleteConfirm(false);
          return;
        }
        await supabase.auth.signOut();
      }
      router.push("/login");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        paddingBottom: 64,
      }}
    >
      {/* Header */}
      <div style={{ padding: "max(env(safe-area-inset-top), 20px) 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              color: "var(--foreground)",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
              <path d="M21 12H3" />
              <path d="M10 19L3 12l7-7" />
            </svg>
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 428, margin: "0 auto", padding: "0 16px" }}>
        {/* Avatar Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 36,
              overflow: "hidden",
              marginBottom: 12,
              position: "relative",
              cursor: isRealMode ? "pointer" : "default",
            }}
            onClick={() => isRealMode && fileRef.current?.click()}
          >
            <UserAvatar avatarUrl={user.avatarUrl} name={user.name} fillParent />
            {isRealMode && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: uploading ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                  {uploading ? "Uploading…" : ""}
                </span>
              </div>
            )}
          </div>
          {isRealMode && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
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
                {uploading ? "Uploading…" : "Change photo"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </>
          )}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Handle (read-only) */}
          <div>
            <label style={labelStyle}>Handle</label>
            <div
              style={{
                ...inputStyle,
                backgroundColor: "var(--background)",
                color: "var(--foreground-muted)",
                cursor: "default",
              }}
            >
              @{user.handle}
            </div>
          </div>

          {/* Email (read-only) */}
          {user.email && (
            <div>
              <label style={labelStyle}>Email</label>
              <div
                style={{
                  ...inputStyle,
                  backgroundColor: "var(--background)",
                  color: "var(--foreground-muted)",
                  cursor: "default",
                }}
              >
                {user.email}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" onClick={handleSignOut} disabled={signingOut} style={actionBtnStyle}>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ ...actionBtnStyle, color: "#e53e3e", borderColor: "rgba(229,62,62,0.2)" }}
            >
              Delete account
            </button>
          ) : (
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                border: "1.5px solid rgba(229,62,62,0.3)",
                backgroundColor: "rgba(229,62,62,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e53e3e" }}>
                This permanently deletes your account, workouts, and follows. This can&apos;t be undone.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-strong)",
                    backgroundColor: "var(--surface)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    backgroundColor: "#e53e3e",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p
          style={{
            marginTop: 48,
            textAlign: "center",
            fontSize: 12,
            color: "var(--foreground-faint)",
          }}
        >
          To All You Athletes
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "max(24px, env(safe-area-inset-bottom))",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--foreground)",
            color: "var(--surface)",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            zIndex: 100,
            animation: "fade-in-up 0.25s var(--ease-out-expo)",
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--foreground-subtle)",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  backgroundColor: "var(--surface)",
  fontSize: 15,
  fontFamily: "inherit",
  fontWeight: 500,
  color: "var(--foreground)",
  outline: "none",
  boxSizing: "border-box",
};

const actionBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
};
