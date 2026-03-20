"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

/** Textarea that grows and shrinks with its text (no fixed row count). */
export function AutoHeightTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { value, style, rows = 1, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      {...rest}
      style={{ overflow: "hidden", boxSizing: "border-box", ...style }}
    />
  );
}
