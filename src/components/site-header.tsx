"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, MessageCircle, ArrowRight } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";

const fallbackOrigins = [
  {
    routeId: 1,
    name: "From Sharm El Sheikh",
    slug: "from-sharm-el-sheikh",
  },
  {
    routeId: 2,
    name: "From Hurghada",
    slug: "from-hurghada",
  },
  {
    routeId: 3,
    name: "From Marsa Alam",
    slug: "from-marsa-alam",
  },
];

export function SiteHeader() {
  const [settings, setSettings] = useState({
    whatsapp_number: "+40725124853",
  });

  const [origins, setOrigins] = useState(fallbackOrigins);
  const [open, setOpen] = useState(false);
  const [exc, setExc] = useState(false);

  const whatsapp = (settings.whatsapp_number || "+40725124853").replace(
    /\D/g,
    "",
  );

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const [settingsRes, categoriesRes] = await Promise.all([
          fetch("/api/site-settings"),
          fetch("/api/trip-categories"),
        ]);

        if (!active) return;

        if (settingsRes.ok) {
          const data = await settingsRes.json();

          if (active && data && typeof data === "object") {
            setSettings((prev) => ({
              ...prev,
              ...data,
            }));
          }
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();

          if (active && Array.isArray(data) && data.length) {
            setOrigins(data);
          }
        }
      } catch {
        // Keep fallback settings and categories.
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setExc(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setExc(false);
  }

  const navLinks = [
    { name: "Special Offers", href: "/special-offers" },
    { name: "Price List", href: "/prices" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      data-no-translate
      className="site-header fixed inset-x-0 top-0 z-50 w-full text-white lg:absolute"
    >
      {/* Full-width navbar background */}
      <div className="w-full border-b border-white/10 bg-[#2b211c] shadow-lg lg:border-white/20 lg:bg-transparent lg:shadow-none">
        {/* Inner content only is constrained */}
        <div className="container-x flex min-h-19 items-center justify-between gap-3 py-3 lg:min-h-24 lg:gap-5 lg:py-4">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
            data-no-translate
          >
            <Image
              src="/excursii-egipt-logo.png"
              alt="Excursii Egipt"
              width={70}
              height={70}
              priority
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
            />

            <span className="serif text-base font-bold tracking-tight sm:text-lg">
              EXCURSII <span className="text-[#e7c58e]">EGIPT</span>
              <small className="mt-1 block text-[8px] font-normal tracking-[.2em] text-white/65 sm:text-[9px]">
                DISCOVER EGYPT
              </small>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 text-sm text-white/90 lg:flex xl:gap-7">
            <Link href="/" className="transition-colors hover:text-[#e7c58e]">
              Home
            </Link>

            {/* Desktop excursions dropdown */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 py-4 transition-colors hover:text-[#e7c58e]"
                aria-haspopup="true"
              >
                Excursions
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </button>

              <div className="invisible absolute left-0 top-full z-50 w-72 pt-1 opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#2b211c] p-2 shadow-2xl">
                  {origins.map((o) => (
                    <Link
                      key={o.routeId}
                      href={`/excursii?category=${o.slug}`}
                      className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-white/10 hover:text-[#e7c58e]"
                    >
                      <span>{o.name}</span>

                      <ArrowRight size={14} className="shrink-0 opacity-40" />
                    </Link>
                  ))}

                  <Link
                    href="/excursii"
                    className="mt-1 flex items-center justify-between border-t border-white/10 px-4 py-3 font-semibold text-[#e7c58e] hover:bg-white/5"
                  >
                    All excursions
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[#e7c58e]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Language Selector */}
          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSelector />
          </div>

          {/* Mobile Actions */}
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact us on WhatsApp"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#e7c58e] transition-colors hover:bg-white/10"
            >
              <MessageCircle size={19} />
            </a>

            <button
              type="button"
              onClick={() => {
                setOpen((prev) => !prev);
                setExc(false);
              }}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-white/10"
            >
              {open ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu: full viewport width, no container-x on background */}
      <div
        id="mobile-navigation"
        aria-hidden={!open}
        inert={!open}
        className={`absolute inset-x-0 top-full z-50 w-full overflow-hidden border-b border-white/10 bg-[#2b211c] shadow-2xl transition-[opacity,visibility] duration-200 ease-out lg:hidden ${
          open
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      >
        {/* Only the menu content is padded */}
        <nav
          className={`max-h-[calc(100dvh-76px)] overflow-y-auto overscroll-contain px-4 pb-6 pt-3 sm:px-6 transition-transform duration-200 ${
            open ? "translate-y-0" : "-translate-y-2"
          }`}
        >
          {/* Home */}
          <Link
            href="/"
            tabIndex={open ? 0 : -1}
            onClick={closeMenu}
            className="flex items-center justify-between border-b border-white/10 py-4 text-[15px] font-medium transition-colors hover:text-[#e7c58e]"
          >
            Home
            <ArrowRight size={16} className="text-white/35" />
          </Link>

          {/* Excursions accordion */}
          <div className="border-b border-white/10">
            <button
              type="button"
              onClick={() => setExc((prev) => !prev)}
              aria-expanded={exc}
              className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium transition-colors hover:text-[#e7c58e]"
            >
              Excursions
              <ChevronDown
                size={18}
                className={`text-[#e7c58e] transition-transform duration-200 ${
                  exc ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                exc
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="mb-4 space-y-1 rounded-xl bg-black/20 p-2">
                  {origins.map((o) => (
                    <Link
                      key={o.routeId}
                      href={`/excursii?category=${o.slug}`}
                      tabIndex={open && exc ? 0 : -1}
                      onClick={closeMenu}
                      className="flex items-center justify-between rounded-lg px-4 py-3.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-[#e7c58e]"
                    >
                      <span>{o.name}</span>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-white/30"
                      />
                    </Link>
                  ))}

                  <Link
                    href="/excursii"
                    tabIndex={open && exc ? 0 : -1}
                    onClick={closeMenu}
                    className="mt-1 flex items-center justify-between rounded-lg border-t border-white/10 px-4 py-4 text-sm font-semibold text-[#e7c58e] transition-colors hover:bg-white/5"
                  >
                    All excursions
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Other links */}
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={closeMenu}
              className="flex items-center justify-between border-b border-white/10 py-4 text-[15px] font-medium transition-colors hover:text-[#e7c58e]"
            >
              {item.name}
              <ArrowRight size={16} className="text-white/35" />
            </Link>
          ))}

          {/* Mobile language selector */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.15em] text-white/45">
              Choose language
            </p>

            <LanguageSelector />
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            onClick={closeMenu}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7c58e] px-5 py-4 text-sm font-bold text-[#2b211c] transition-colors hover:bg-[#d6b47b]"
          >
            <MessageCircle size={18} />
            Contact us on WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
