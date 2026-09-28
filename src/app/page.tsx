import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Compass,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RichText } from "@/components/rich-text";
import { ReadMore } from "@/components/read-more";

export const dynamic = "force-dynamic";

const richTextBase =
  "[&_p]:mb-3 [&_p:last-child]:mb-0 " +
  "[&_h1]:mb-3 [&_h1]:font-bold " +
  "[&_h2]:mb-3 [&_h2]:font-bold " +
  "[&_h3]:mb-2 [&_h3]:font-bold " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:mb-1 " +
  "[&_strong]:font-bold " +
  "[&_em]:italic " +
  "[&_a]:underline [&_a]:underline-offset-4 " +
  "[&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full " +
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse " +
  "[&_th]:border [&_th]:border-[#e7dfd3] [&_th]:bg-[#f0e8dc] [&_th]:p-2 " +
  "[&_td]:border [&_td]:border-[#e7dfd3] [&_td]:p-2 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#b98a48] [&_blockquote]:pl-4";

export default async function HomePage() {
  let tours: any[] = [];
  let offers: any[] = [];
  let recommended: any[] = [];
  let gallery: any[] = [];
  let settings: Record<string, string> = {};

  try {
    const [tourRows, offerRows, recommendedRows, galleryRows, settingRows] =
      await Promise.all([
        prisma.tour.findMany({
          where: { active: true },
          orderBy: [
            { sortOrder: "asc" },
            { featured: "desc" },
            { createdAt: "desc" },
          ],
          take: 6,
        }),

        prisma.specialOffer.findMany({
          where: { active: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),

        prisma.tour.findMany({
          where: {
            active: true,
            recommended: true,
          },
          orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
          take: 3,
        }),

        prisma.galleryItem.findMany({
          where: { active: true },
          orderBy: { sortOrder: "asc" },
          take: 8,
        }),

        prisma.siteSetting.findMany(),
      ]);

    tours = tourRows;
    offers = offerRows;
    recommended = recommendedRows;
    gallery = galleryRows;

    settings = Object.fromEntries(
      settingRows.map((item: any) => [item.key, item.value]),
    );
  } catch (error) {
    console.error("Failed to load homepage content:", error);
  }

  return (
    <main>
      <SiteHeader />

      {/* HERO */}
      <section
        className="hero-bg relative flex min-h-[730px] items-center text-white md:min-h-[820px]"
        style={
          settings.home_hero_image
            ? {
                backgroundImage: `linear-gradient(90deg,rgba(20,15,12,.72),rgba(20,15,12,.18)),url("${settings.home_hero_image}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="container-x relative z-10 py-28">
          <div className="max-w-3xl">
            <div className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.28em] text-[#f0d6a7]">
              <span className="h-px w-10 shrink-0 bg-[#d7ac69]" />

              <div className="min-w-0">
                <RichText
                  content={settings.home_hero_eyebrow}
                  fallback="Authentic experiences · Memories for a lifetime"
                  className={`[&_p]:mb-0 ${richTextBase}`}
                />
              </div>
            </div>

            <h1 className="serif max-w-2xl text-6xl leading-[.98] tracking-[-.04em] md:text-8xl">
              {settings.home_hero_title || "Egypt"}

              <br />

              <em className="font-normal text-[#e7c58e]">
                {settings.home_hero_title_highlight || "is calling."}
              </em>
            </h1>

            <RichText
              content={settings.home_hero_description}
              fallback="Discover Egypt’s treasures with local guides, thoughtfully curated experiences, and moments that stay with you."
              className={`mt-8 max-w-xl text-base leading-7 text-white/80 md:text-lg ${richTextBase} [&_a]:text-[#e7c58e]`}
            />

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#excursii"
                className="inline-flex items-center gap-3 bg-[#b98a48] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#9d7036]"
              >
                {settings.home_hero_primary_cta || "Explore tours"}
                <ArrowRight size={17} />
              </Link>

              <Link
                href="#contact"
                className="glass inline-flex items-center gap-3 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {settings.home_hero_secondary_cta || "Plan your trip"}
              </Link>
            </div>
          </div>

          <div className="mt-20 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs tracking-wide text-white/80">
            <span className="flex items-center gap-2">
              <Star size={15} className="shrink-0 text-[#e7c58e]" />
              Thoughtfully curated experiences
            </span>

            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="shrink-0 text-[#e7c58e]" />
              Local support
            </span>

            <span className="flex items-center gap-2">
              <Sparkles size={15} className="shrink-0 text-[#e7c58e]" />
              Authentic memories
            </span>
          </div>
        </div>

        <a
          href="#excursii"
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[.3em] text-white/70 md:flex"
        >
          Discover
          <ArrowDown size={14} />
        </a>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#fbf8f2] to-transparent" />
      </section>

      {/* TOURS */}
      <section id="excursii" className="container-x py-20 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-[#a8793d]">
              Handpicked adventures
            </p>

            <h2 className="serif text-4xl leading-tight md:text-6xl">
              Unmissable <em className="text-[#a8793d]">experiences</em>
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-[#776b61]">
              Choose the adventure that feels right for you, from ancient
              wonders to the crystal-clear waters of the Red Sea.
            </p>
          </div>

          <Link
            href="/excursii"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#702f2b]"
          >
            View all tours
            <ArrowRight size={17} />
          </Link>
        </div>

        {tours.length > 0 ? (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <article
                key={tour.id}
                className="tour-card group flex h-full min-w-0 flex-col overflow-hidden rounded-sm bg-white shadow-[0_10px_50px_rgba(56,38,22,.06)] transition-shadow hover:shadow-[0_15px_60px_rgba(56,38,22,.12)]"
              >
                {/* Image */}
                <Link
                  href={`/excursii/${tour.slug}`}
                  className="relative block h-64 shrink-0 overflow-hidden"
                  aria-label={`View ${tour.title}`}
                >
                  {tour.image ? (
                    <Image
                      unoptimized
                      src={tour.image}
                      alt={tour.title}
                      fill
                      className="card-image object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#c6a77c] to-[#5c392c]" />
                  )}

                  <span className="absolute left-4 top-4 max-w-[80%] truncate bg-[#fbf8f2] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#702f2b]">
                    {tour.tag || tour.destination}
                  </span>

                  {tour.duration && (
                    <span className="absolute bottom-4 right-4 bg-black/35 px-3 py-2 text-xs text-white backdrop-blur">
                      {tour.duration}
                    </span>
                  )}
                </Link>

                {/* Card content */}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a8793d]">
                    {tour.destination}
                  </p>

                  <Link href={`/excursii/${tour.slug}`} className="mt-3 block">
                    <h3 className="serif text-2xl leading-snug transition-colors group-hover:text-[#702f2b]">
                      {tour.title}
                    </h3>
                  </Link>

                  {/* Description: same collapsed height on every card */}
                  <div className="mt-3 min-h-[96px]">
                    <ReadMore lines={3}>
                      <RichText
                        content={
                          tour.subtitle || tour.excerpt || tour.description
                        }
                        fallback=""
                        className={`text-sm leading-6 text-[#776b61] ${richTextBase}`}
                      />
                    </ReadMore>
                  </div>

                  {/* Price stays at the bottom */}
                  <div className="mt-auto flex items-center justify-between border-t border-[#eee6db] pt-5">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8c8177]">
                        From
                      </span>

                      <strong className="serif text-2xl">
                        {tour.currency || "€"}
                        {tour.price != null ? tour.price.toString() : "0"}
                      </strong>

                      <span className="text-xs text-[#8c8177]"> / person</span>
                    </div>

                    <Link
                      href={`/excursii/${tour.slug}`}
                      aria-label={`View ${tour.title}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e5d8c5] transition group-hover:border-[#702f2b] group-hover:bg-[#702f2b] group-hover:text-white"
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-sm bg-white p-8 text-center text-sm text-[#776b61]">
            Tours will be available soon. Please contact us for information
            about our excursions.
          </p>
        )}
      </section>

      {/* RECOMMENDED TOURS */}
      {recommended.length > 0 && (
        <section className="container-x pb-20">
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#a8793d]">
              Recommended excursions
            </p>

            <RichText
              content={settings.home_recommended_title}
              fallback="Our recommended excursions"
              className={`serif text-4xl ${richTextBase} [&_p]:mb-0`}
            />
          </div>

          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((tour) => (
              <article
                key={tour.id}
                className="group flex h-full min-w-0 flex-col overflow-hidden border border-[#e7dfd3] bg-white transition hover:shadow-lg"
              >
                {/* Tour image */}
                <Link
                  href={`/excursii/${tour.slug}`}
                  className="relative block h-56 shrink-0 overflow-hidden bg-[#e7dfd3]"
                  aria-label={`View ${tour.title}`}
                >
                  {tour.image ? (
                    <Image
                      src={tour.image}
                      alt={tour.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#c6a77c] to-[#5c392c]" />
                  )}

                  {tour.duration && (
                    <span className="absolute bottom-4 right-4 bg-black/40 px-3 py-2 text-xs text-white backdrop-blur">
                      {tour.duration}
                    </span>
                  )}
                </Link>

                {/* Tour content */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs uppercase tracking-widest text-[#a8793d]">
                    {tour.destination}
                  </p>

                  <Link href={`/excursii/${tour.slug}`} className="mt-2 block">
                    <h3 className="serif text-2xl transition-colors group-hover:text-[#702f2b]">
                      {tour.title}
                    </h3>
                  </Link>

                  <div className="mt-3 min-h-[96px]">
                    <ReadMore lines={3}>
                      <RichText
                        content={
                          tour.excerpt || tour.subtitle || tour.description
                        }
                        className={`text-sm leading-6 text-[#776b61] ${richTextBase}`}
                      />
                    </ReadMore>
                  </div>

                  {/* Price and link stay at the bottom */}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eee6db] pt-4">
                    <p className="font-bold">
                      {tour.currency || "€"}{" "}
                      {tour.price != null ? tour.price.toString() : "0"}
                    </p>

                    <Link
                      href={`/excursii/${tour.slug}`}
                      className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#702f2b]"
                    >
                      View tour
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SPECIAL OFFERS */}
      {offers.length > 0 && (
        <section className="bg-[#f0e8dc] py-16">
          <div className="container-x">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#a8793d]">
                  Special offers
                </p>

                <RichText
                  content={settings.home_offers_title}
                  fallback="Our special offers"
                  className={`serif text-4xl ${richTextBase} [&_p]:mb-0`}
                />
              </div>

              <Link
                href="/special-offers"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#702f2b]"
              >
                All offers
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  className="flex h-full min-w-0 flex-col overflow-hidden bg-white shadow-[0_10px_40px_rgba(56,38,22,.05)]"
                >
                  {offer.image && (
                    <div className="relative h-48 shrink-0 overflow-hidden">
                      <Image
                        src={offer.image}
                        alt={offer.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="serif text-2xl">{offer.title}</h3>

                    <div className="mt-3 min-h-[120px]">
                      <ReadMore lines={4}>
                        <RichText
                          content={offer.description}
                          className={`text-sm leading-6 text-[#776b61] ${richTextBase}`}
                        />
                      </ReadMore>
                    </div>

                    {Number(offer.price) > 0 && (
                      <p className="mt-auto border-t border-[#eee6db] pt-4 font-bold">
                        {offer.currency || "€"} {offer.price.toString()}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="container-x py-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#a8793d]">
                Photo gallery
              </p>

              <RichText
                content={settings.home_gallery_title}
                fallback="Moments in Egypt"
                className={`serif text-4xl ${richTextBase} [&_p]:mb-0`}
              />
            </div>

            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#702f2b]"
            >
              View gallery
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.map((item) => (
              <Link
                href="/gallery"
                key={item.id}
                aria-label={item.alt || item.title || "View gallery"}
                className="group relative h-40 overflow-hidden md:h-56"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.alt || item.title || "Egypt gallery"}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#c6a77c] to-[#5c392c]" />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <section className="bg-[#2b211c] py-20 text-white md:py-28">
        <div className="container-x">
          <div className="grid gap-14 md:grid-cols-[.9fr_1.1fr] md:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-[#d7ac69]">
                More than just a tour
              </p>

              <h2 className="serif text-4xl leading-tight md:text-6xl">
                Travel with <em className="text-[#d7ac69]">confidence.</em>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
                We believe the best journeys are those where you feel welcome,
                safe, and free to explore.
              </p>

              <Link
                href="#contact"
                className="mt-8 inline-flex items-center gap-3 bg-[#b98a48] px-6 py-4 text-sm font-bold transition hover:bg-[#9d7036]"
              >
                Let’s talk
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {[
                {
                  icon: Compass,
                  title: "Local expertise",
                  text: "We know the places, stories and people that make Egypt special.",
                },
                {
                  icon: ShieldCheck,
                  title: "Care at every step",
                  text: "Clear communication and dedicated support before and during your excursion.",
                },
                {
                  icon: Sparkles,
                  title: "Thoughtfully curated experiences",
                  text: "Balanced itineraries, authentic moments and memories to treasure.",
                },
                {
                  icon: Waves,
                  title: "Your adventure, your pace",
                  text: "Options for couples, families and curious travellers.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="border-t border-white/15 pt-5">
                  <Icon className="mb-5 text-[#d7ac69]" size={22} />

                  <h3 className="serif text-2xl">{title}</h3>

                  <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="container-x py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.25em] text-[#a8793d]">
              Tell us what you’re dreaming of
            </p>

            <h2 className="serif text-4xl leading-tight md:text-6xl">
              Let’s plan <em className="text-[#a8793d]">your adventure.</em>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#776b61]">
              Have questions or want a custom excursion? Send us a message and
              we’ll get back to you.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#776b61]">
              <p className="flex items-center gap-3">
                <Check size={16} className="text-[#a8793d]" />
                Personal response
              </p>

              <p className="flex items-center gap-3">
                <Check size={16} className="text-[#a8793d]" />
                No obligation
              </p>
            </div>
          </div>

          <form
            action="/api/enquiries"
            method="POST"
            className="space-y-4 rounded-sm bg-white p-6 shadow-[0_10px_50px_rgba(56,38,22,.06)] md:p-9"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#776b61]">
                Your name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  className="mt-2 w-full border border-[#e8dfd3] bg-[#fbf8f2] px-4 py-3 text-sm outline-none focus:border-[#b98a48]"
                  placeholder="Full name"
                />
              </label>

              <label className="text-xs font-bold text-[#776b61]">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full border border-[#e8dfd3] bg-[#fbf8f2] px-4 py-3 text-sm outline-none focus:border-[#b98a48]"
                  placeholder="email@example.com"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-[#776b61]">
              Phone / WhatsApp
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className="mt-2 w-full border border-[#e8dfd3] bg-[#fbf8f2] px-4 py-3 text-sm outline-none focus:border-[#b98a48]"
                placeholder="+20..."
              />
            </label>

            <label className="block text-xs font-bold text-[#776b61]">
              How can we help?
              <textarea
                name="message"
                required
                rows={4}
                className="mt-2 w-full resize-y border border-[#e8dfd3] bg-[#fbf8f2] px-4 py-3 text-sm outline-none focus:border-[#b98a48]"
                placeholder="Tell us which excursion interests you..."
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 bg-[#702f2b] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#542320]"
            >
              Send enquiry
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-[11px] leading-5 text-[#9a8e83]">
              By submitting, you agree to be contacted about your enquiry.
            </p>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
