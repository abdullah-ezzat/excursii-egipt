import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminManager } from "@/components/admin-manager";
import { ArrowUpRight } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminHome() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  let tours = 0,
    bookings = 0,
    newBookings = 0,
    enquiries = 0,
    offers = 0,
    gallery = 0;
  try {
    [tours, bookings, newBookings, enquiries, offers, gallery] =
      await Promise.all([
        prisma.tour.count(),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "NEW" } }),
        prisma.enquiry.count(),
        prisma.specialOffer.count(),
        prisma.galleryItem.count(),
      ]);
  } catch {}
  return (
    <main className="min-h-screen bg-[#f6f3ed] text-[#251b17]">
      <aside className="fixed hidden h-screen w-64 flex-col bg-[#2b211c] p-7 text-white md:flex">
        <Link href="/" className="serif text-xl font-bold">
          EXCURSII <span className="text-[#d7ac69]">EGIPT</span>
        </Link>
        <p className="mt-2 text-[10px] uppercase tracking-[.2em] text-white/40">
          Content management
        </p>
        <nav className="mt-12 space-y-2 text-sm">
          {[
            { label: "Tours", key: "tour" },
            { label: "Trip categories", key: "tripCategory" },
            { label: "Pages", key: "page" },
            { label: "Special offers", key: "specialOffer" },
            { label: "Gallery", key: "galleryItem" },
            { label: "Price list", key: "priceItem" },
            { label: "Site settings", key: "siteSetting" },
            { label: "Bookings", key: "booking" },
            { label: "Enquiries", key: "enquiry" },
          ].map((x) => (
            <a key={x.key} href={`#resource-${x.key}`} className="block rounded-sm px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white">
              {x.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto text-xs text-white/40">CMS · MySQL</div>
      </aside>
      <section className="md:ml-64">
        <header className="flex items-center justify-between border-b border-[#e7dfd3] bg-white px-6 py-5 md:px-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#a8793d]">
              Secure workspace
            </p>
            <h1 className="serif mt-1 text-2xl">Website management</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#702f2b]"
          >
            View website <ArrowUpRight size={16} />
          </Link>
        </header>
        <div className="p-5 md:p-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { l: "Tours", v: tours },
              { l: "Bookings", v: bookings },
              { l: "New bookings", v: newBookings },
              { l: "Contact enquiries", v: enquiries },
              { l: "Special offers", v: offers },
              { l: "Gallery items", v: gallery },
            ].map((x) => (
              <div key={x.l} className="border border-[#e7dfd3] bg-white p-5">
                <p className="text-sm text-[#776b61]">{x.l}</p>
                <p className="serif mt-3 text-3xl">{x.v}</p>
              </div>
            ))}
          </div>
          <div id="manager" className="mt-8">
            <AdminManager />
          </div>
          <div className="mt-8 border border-amber-200 bg-amber-50 p-5 text-xs leading-5 text-amber-900">
            Important: configure HTTPS, a strong AUTH_SECRET, database backups,
            rate limiting, and a real admin account before production. Booking
            review and email workflows should be verified before accepting
            payments or promising confirmations.
          </div>
        </div>
      </section>
    </main>
  );
}
