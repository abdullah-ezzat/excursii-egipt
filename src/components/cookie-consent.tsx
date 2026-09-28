"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(
      !document.cookie.split("; ").some((x) => x.startsWith("cookie_consent=")),
    );
  }, []);
  function save(choice: string) {
    document.cookie = `cookie_consent=${choice};path=/;max-age=15552000;samesite=lax;secure`;
    setShow(false);
  }
  if (!show) return null;
  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl border border-[#d9c7ad] bg-white p-5 shadow-2xl"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <h2 className="serif text-xl">Your privacy matters</h2>
      <p className="mt-2 text-sm leading-6 text-[#665b52]">
        We use essential cookies for site operation and to remember language
        preferences. Optional analytics or advertising cookies are not enabled
        by this consent banner. Read our{" "}
        <Link className="underline" href="/cookie-policy">
          Cookie Policy
        </Link>{" "}
        and{" "}
        <Link className="underline" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => save("essential")}
          className="border border-[#702f2b] px-5 py-3 text-sm font-bold text-[#702f2b]"
        >
          Essential only
        </button>
        <button
          onClick={() => save("all")}
          className="bg-[#702f2b] px-5 py-3 text-sm font-bold text-white"
        >
          Accept
        </button>
      </div>
    </aside>
  );
}
