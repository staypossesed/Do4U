"use client";

import { useEffect, useState } from "react";
function safeImageUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function initialsFromName(name: string | null | undefined, email: string): string {
  const n = name?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  avatarUrl,
  name,
  email,
  sizeClass = "w-20 h-20",
  textClass = "text-lg",
}: {
  avatarUrl: string | null;
  name: string | null;
  email: string;
  sizeClass?: string;
  textClass?: string;
}) {
  const [broken, setBroken] = useState(false);
  const safe = safeImageUrl(avatarUrl);

  useEffect(() => {
    setBroken(false);
  }, [avatarUrl]);

  const showImg = Boolean(safe && !broken);

  if (!showImg) {
    return (
      <div
        className={`${sizeClass} rounded-full brand-gradient flex items-center justify-center border-2 border-primary shadow-inner`}
        aria-hidden
      >
        <span className={`font-extrabold text-white ${textClass}`}>{initialsFromName(name, email)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safe!}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      className={`${sizeClass} rounded-full object-cover border-2 border-primary bg-muted`}
      onError={() => setBroken(true)}
    />
  );
}
