import "server-only";
import type { HTMLAttributes } from "react";
import DOMPurify from "isomorphic-dompurify";

type RichTextProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  content?: string | null;
  fallback?: string;
};
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["target", "rel", "loading", "width", "height", "allow", "allowfullscreen", "frameborder", "referrerpolicy"],
  FORBID_TAGS: ["script", "style", "object", "embed", "form", "input", "button", "textarea", "select", "meta", "link", "base"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onmouseenter", "onanimationstart"],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: true,
  RETURN_TRUSTED_TYPE: false,
};
function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ...SANITIZE_OPTIONS,
    FORBID_TAGS: [
      ...(SANITIZE_OPTIONS.FORBID_TAGS || []),
      "iframe",
    ],
    ADD_TAGS: [],
    ADD_ATTR: [
      "target",
      "rel",
      "loading",
      "width",
      "height",
    ],
    RETURN_TRUSTED_TYPE: false,
  }) as string;
}
function hasHtmlMarkup(value: string) { return /<\/?[a-z][^>]*>/i.test(value); }
export function RichText({ content, fallback, className = "", ...props }: RichTextProps) {
  const value = content?.trim() || fallback?.trim() || "";
  if (!value) return null;
  if (!hasHtmlMarkup(value)) return <div className={className} {...props}>{value}</div>;
  const html = sanitizeHtml(value);
  if (!html.trim()) return null;
  return <div className={className} {...props} dangerouslySetInnerHTML={{ __html: html }} />;
}
