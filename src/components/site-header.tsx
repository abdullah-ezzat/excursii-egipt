"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";

export function SiteHeader() {
  const [settings, setSettings] = useState<any>({
    whatsapp_number: "+40725124853",
  });
  const whatsapp = (settings.whatsapp_number || "+40725124853").replace(
    /\D/g,
    "",
  );
  const [open, setOpen] = useState(false);
  const [exc, setExc] = useState(false);
  const [origins, setOrigins] = useState([
    { routeId: 1, name: "From Sharm El Sheikh", slug: "from-sharm-el-sheikh" },
    { routeId: 2, name: "From Hurghada", slug: "from-hurghada" },
    { routeId: 3, name: "From Marsa Alam", slug: "from-marsa-alam" },
  ]);
  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setSettings)
      .catch(() => {});
    fetch("/api/trip-categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d) && d.length) setOrigins(d);
      })
      .catch(() => {});
  }, []);
  return (
    <header className="absolute z-40 w-full text-white">
      <div className="container-x flex min-h-24 items-center justify-between gap-5 border-b border-white/20 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          data-no-translate
        >
          <Image
            src="/excursii-egipt-logo.png"
            alt="Excursii Egipt"
            width={70}
            height={70}
            className="h-14 w-14 object-contain"
          />
          <span className="serif text-lg font-bold tracking-tight">
            EXCURSII <span className="text-[#e7c58e]">EGIPT</span>
            <small className="mt-1 block text-[9px] font-normal tracking-[.2em] text-white/65">
              DISCOVER EGYPT
            </small>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-white/90 lg:flex">
          <Link className="hover:text-[#e7c58e]" href="/">
            Home
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setExc(true)}
            onMouseLeave={() => setExc(false)}
          >
            <button
              onClick={() => setExc(!exc)}
              className="flex items-center gap-1 hover:text-[#e7c58e]"
              aria-expanded={exc}
            >
              Excursions <ChevronDown size={14} />
            </button>
            {exc && (
              <div className="absolute left-0 top-full min-w-60 bg-[#2b211c] p-2 shadow-xl">
                {origins.map((o) => (
                  <Link
                    key={o.routeId}
                    className="block px-4 py-3 hover:bg-white/10"
                    href={`/excursii?category=${o.slug}`}
                  >
                    {o.name}
                  </Link>
                ))}
                <Link
                  className="block border-t border-white/10 px-4 py-3 hover:bg-white/10"
                  href="/excursii"
                >
                  All excursions
                </Link>
              </div>
            )}
          </div>
          <Link className="hover:text-[#e7c58e]" href="/special-offers">
            Special Offers
          </Link>
          <Link className="hover:text-[#e7c58e]" href="/prices">
            Price List
          </Link>
          <Link className="hover:text-[#e7c58e]" href="/contact">
            Contact
          </Link>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
        </div>
        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-x space-y-3 bg-[#2b211c] p-6 lg:hidden">
          <Link className="block" href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <button
            className="flex items-center gap-2"
            onClick={() => setExc(!exc)}
          >
            Excursions <ChevronDown size={14} />
          </button>
          {exc &&
            origins.map((o) => (
              <Link
                key={o.routeId}
                className="block pl-4 text-white/75"
                href={`/trips/${o.routeId}`}
                onClick={() => setOpen(false)}
              >
                {o.name}
              </Link>
            ))}
          <Link
            className="block"
            href="/special-offers"
            onClick={() => setOpen(false)}
          >
            Special Offers
          </Link>
          <Link className="block" href="/prices" onClick={() => setOpen(false)}>
            Price List
          </Link>
          <a className="block" href={`https://wa.me/${whatsapp}`}>
            Contact / WhatsApp
          </a>
          <LanguageSelector />
        </nav>
      )}
    </header>
  );
}
