import { RichText } from "@/components/rich-text";
import { ReadMore } from "@/components/read-more";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Egypt Excursions",
  description:
    "Explore excursions from Sharm El Sheikh, Hurghada, Marsa Alam and other destinations in Egypt.",
};

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

type ToursPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const params = await searchParams;

  let tours: any[] = [];
  let categories: any[] = [];
  let selected: any = null;

  try {
    categories = await prisma.tripCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    selected =
      categories.find((category: any) => category.slug === params.category) ||
      null;

    tours = await prisma.tour.findMany({
      where: {
        active: true,
        ...(selected ? { tripCategoryId: selected.id } : {}),
      },
      orderBy: [
        { sortOrder: "asc" },
        { featured: "desc" },
        { createdAt: "desc" },
      ],
    });
  } catch (error) {
    console.error("Failed to load excursions:", error);
  }

  return (
    <>
      {/* PAGE HEADER */}
      <div className="bg-[#2b211c] text-white">
        <SiteHeader />

        <div className="container-x pb-16 pt-40">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#d7ac69]">
            Our collection
          </p>

          <h1 className="serif mt-4 text-5xl leading-tight md:text-7xl">
            {selected ? selected.name : "Tours in Egypt"}
          </h1>

          <RichText
            className={`mt-5 max-w-xl text-sm leading-7 text-white/65 ${richTextBase}`}
            content={selected?.description}
            fallback="Thoughtfully curated experiences to discover Egypt’s history, culture and beauty."
          />
        </div>
      </div>

      {/* TOURS LISTING */}
      <main className="container-x py-10 md:py-16">
        {/* CATEGORY FILTERS */}
        <nav
          aria-label="Excursion categories"
          className="mb-10 flex flex-wrap gap-3"
        >
          <Link
            href="/excursii"
            className={`border px-4 py-2 text-sm transition ${
              !selected
                ? "border-[#702f2b] bg-[#702f2b] text-white"
                : "border-[#e7dfd3] bg-white text-[#776b61] hover:border-[#702f2b] hover:text-[#702f2b]"
            }`}
          >
            All excursions
          </Link>

          {categories.map((category: any) => (
            <Link
              key={category.id}
              href={`/excursii?category=${encodeURIComponent(category.slug)}`}
              aria-current={selected?.id === category.id ? "page" : undefined}
              className={`border px-4 py-2 text-sm transition ${
                selected?.id === category.id
                  ? "border-[#702f2b] bg-[#702f2b] text-white"
                  : "border-[#e7dfd3] bg-white text-[#776b61] hover:border-[#702f2b] hover:text-[#702f2b]"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* RESULTS COUNT */}
        {tours.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[#776b61]">
              {tours.length} {tours.length === 1 ? "excursion" : "excursions"}
              {selected ? ` in ${selected.name}` : ""}
            </p>
          </div>
        )}

        {/* TOUR CARDS */}
        {tours.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="serif text-3xl text-[#2b211c]">
              No excursions found
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#776b61]">
              No excursions have been published in this category yet.
            </p>

            {selected && (
              <Link
                href="/excursii"
                className="mt-6 inline-flex items-center gap-2 bg-[#702f2b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#542320]"
              >
                View all excursions
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour: any) => (
              <article
                key={tour.id || tour.slug}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-sm bg-white shadow-[0_10px_50px_rgba(56,38,22,.06)] transition-shadow hover:shadow-[0_15px_60px_rgba(56,38,22,.12)]"
              >
                {/* TOUR IMAGE */}
                <Link
                  href={`/excursii/${tour.slug}`}
                  aria-label={`View ${tour.title}`}
                  className="relative block h-64 shrink-0 overflow-hidden bg-[#e7dfd3]"
                >
                  {tour.image ? (
                    <Image
                      unoptimized
                      src={tour.image}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-[#c6a77c] to-[#5c392c]" />
                  )}

                  {tour.tag && (
                    <span className="absolute left-4 top-4 max-w-[80%] truncate bg-[#fbf8f2] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#702f2b]">
                      {tour.tag}
                    </span>
                  )}

                  {tour.duration && (
                    <span className="absolute bottom-4 right-4 bg-black/40 px-3 py-2 text-xs text-white backdrop-blur">
                      {tour.duration}
                    </span>
                  )}
                </Link>

                {/* TOUR CONTENT */}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a8793d]">
                    {tour.destination}
                  </p>

                  <Link href={`/excursii/${tour.slug}`} className="mt-3 block">
                    <h2 className="serif text-2xl leading-snug transition-colors group-hover:text-[#702f2b]">
                      {tour.title}
                    </h2>
                  </Link>

                  {/* DESCRIPTION WITH READ MORE */}
                  <div className="mt-3 min-h-24">
                    <ReadMore lines={3}>
                      <RichText
                        className={`text-sm leading-6 text-[#776b61] ${richTextBase}`}
                        content={
                          tour.excerpt || tour.subtitle || tour.description
                        }
                      />
                    </ReadMore>
                  </div>

                  {/* PRICE AND DURATION */}
                  <div className="mt-auto">
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee6db] pt-4">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-[#8c8177]">
                          From
                        </span>

                        <strong className="serif text-2xl">
                          {tour.currency || "€"}{" "}
                          {tour.price != null ? tour.price.toString() : "0"}
                        </strong>

                        <span className="text-xs text-[#8c8177]">
                          {" "}
                          / person
                        </span>
                      </div>

                      {tour.duration && (
                        <span className="shrink-0 text-right text-xs text-[#776b61]">
                          {tour.duration}
                        </span>
                      )}
                    </div>

                    {/* DETAILS BUTTON */}
                    <Link
                      href={`/excursii/${tour.slug}`}
                      className="mt-5 flex items-center justify-between bg-[#702f2b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#542320]"
                    >
                      View details
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
