import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Star,
  ShieldCheck,
  Cookie,
} from "lucide-react";

export async function SiteFooter() {
  let settings: Record<string, string> = {};

  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "contact_address",
            "contact_phone",
            "contact_email",
            "whatsapp_number",
            "instagram_url",
            "tripadvisor_url",
            "facebook_url",
          ],
        },
      },
    });

    settings = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  } catch {
    // Keep the footer available if settings cannot be loaded.
  }

  return (
    <footer className="bg-[#211915] py-12 text-white">
      <div className="container-x">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-3">
          {/* Logo and description */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="Excursii Egipt homepage"
            >
              <Image
                src="/excursii-egipt-logo.png"
                alt="Excursii Egipt"
                width={240}
                height={100}
                className="h-auto max-h-24 w-auto max-w-[220px] object-contain object-left"
                priority={false}
              />
            </Link>

            <p className="mt-4 serif text-2xl font-bold" data-no-translate>
              EXCURSII <span className="text-[#d7ac69]">EGIPT</span>
            </p>

            <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">
              Memorable adventures in Egypt. Discover unforgettable experiences,
              historical treasures, and beautiful destinations.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3 text-sm text-white/65">
            <strong className="mb-1 text-base text-white">Contact</strong>

            {settings.contact_address && (
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#d7ac69]" />
                <span>{settings.contact_address}</span>
              </p>
            )}

            {settings.contact_phone && (
              <a
                className="flex items-center gap-2 hover:text-white"
                href={`tel:${settings.contact_phone}`}
              >
                <Phone size={15} className="text-[#d7ac69]" />
                {settings.contact_phone}
              </a>
            )}

            {settings.contact_email && (
              <a
                className="flex items-center gap-2 hover:text-white"
                href={`mailto:${settings.contact_email}`}
              >
                <Mail size={15} className="text-[#d7ac69]" />
                {settings.contact_email}
              </a>
            )}

            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(
                  /[^0-9]/g,
                  "",
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white"
              >
                <MessageCircle size={15} className="text-[#d7ac69]" />
                WhatsApp
              </a>
            )}
          </div>

          {/* Navigation and social links */}
          <div className="flex flex-col gap-3 text-sm text-white/65">
            <strong className="mb-1 text-base text-white">
              Explore & follow
            </strong>

            <div className="flex flex-wrap gap-x-4 gap-y-3">
              <Link href="/excursii" className="hover:text-white">
                Tours
              </Link>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
              <Link href="/gallery" className="hover:text-white">
                Gallery
              </Link>
              <Link href="/special-offers" className="hover:text-white">
                Offers
              </Link>
              <Link href="/prices" className="hover:text-white">
                Prices
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-white/10 pt-4">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Facebook size={15} />
                  Facebook
                </a>
              )}

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Instagram size={15} />
                  Instagram
                </a>
              )}

              {settings.tripadvisor_url && (
                <a
                  href={settings.tripadvisor_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Star size={15} />
                  Tripadvisor
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright and legal links */}
        <div className="flex flex-col justify-between gap-5 pt-6 text-xs text-white/40 md:flex-row md:items-center">
          <span>
            © {new Date().getFullYear()}{" "}
            <span data-no-translate>Excursii Egipt</span>. All rights reserved.
          </span>

          <nav
            aria-label="Legal information"
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <ShieldCheck size={14} />
              Privacy Policy
            </Link>

            <Link
              href="/cookie-policy"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Cookie size={14} />
              Cookie Policy
            </Link>
          </nav>

          <span>Made for memorable experiences.</span>
        </div>
      </div>
    </footer>
  );
}
