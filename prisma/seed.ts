import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import path from "node:path";
const prisma = new PrismaClient();
const packages: [string, number][] = [
  ["CAIRO STANDARD + LUXOR STANDARD + ORANGE BAY ISLAND + MAGIC SAFARI", 158],
  ["PRIVATE LUXOR + PRIVATE CAIRO + PARADISE ISLAND + PRIVATE CITY TOUR", 282],
  ["LUXOR STANDARD + CAIRO STANDARD + GRAND AQUARIUM + ORANGE BAY", 167],
  ["LUXOR STANDARD + CAIRO STANDARD + ROYAL DIVING + PRIVATE CITY TOUR", 166],
  [
    "PRIVATE LUXOR + SWIMMING WITH DOLPHINS + MAGIC SAFARI + PARADISE ISLAND",
    210,
  ],
  ["PRIVATE CAIRO + PRIVATE LUXOR + FISHING + ATV TRIP", 285],
  [
    "MONASTERY OF ST. ANTHONY AND ST. PAUL + PRIVATE LUXOR + PARADISE ISLAND + MAGIC SAFARI",
    215,
  ],
  [
    "CAIRO STANDARD + LUXOR STANDARD + MONASTERY OF ST. ANTHONY AND ST. PAUL STANDARD + ORANGE BAY ISLAND",
    182,
  ],
  [
    "FAMILY WATER PACKAGE: ROYAL DIVING + SWIMMING WITH DOLPHINS + PARADISE ISLAND + SIMBAD SUBMARINE",
    139,
  ],
  [
    "FAMILY WATER PACKAGE: ROYAL DIVING + ORANGE BAY ISLAND + JUNGLE AQUA PARK + SIMBAD SUBMARINE + SWIMMING WITH DOLPHINS",
    172,
  ],
  [
    "VIP HISTORICAL TRIP: PRIVATE CAIRO + PRIVATE LUXOR + PRIVATE ASWAN + DANDARAH",
    446,
  ],
];


const regionalPrices: [string,string,number][] = [
  ...[["CAIRO STANDARD",48],["PRIVATE CAIRO",120],["CAIRO LUXURY",85],["ARABIAN HORSE RIDING",30],["THE SAND BEAR",30],["CAIRO OVERNIGHT STANDARD",200],["CAIRO OVERNIGHT LUXURY",230],["CAIRO BY PLANE",200],["LUXOR STANDARD VALLEY OF THE KINGS",49],["LUXOR ELITE",200],["PRIVATE LUXOR",120],["PRIVATE ASWAN",200],["CAIRO VIP",180],["DANDARAH",45],["MONASTERY OF SAINT ANTHONY AND SAINT PAUL",50],["ORANGE BAY",25],["PARADISE ISLAND",25],["GIFTUN ISLAND",20],["THE SUBMARINE SINDBAD",35],["SEMI-SUBMAIR",15],["Standard dives",25],["Royal Diving",40],["Elite Diving",55],["DOLPHIN HOUSE",25],["TURTLE HOUSE",50],["FISHING FOR A DAY",30],["PARASAILING",30],["DOLPHIN SHOW",22],["Swimming with dolphins",60],["DIVING COURSE",300],["SPEED BOAT",35],["REEF EXCURSION",50],["MAGIC SAFARI",20],["BUGGY CAR SAFARI",30],["ATV SAFARI",15],["JUNGLE AQUA PARK",35],["Grand aquarium",30],["TURKISH BATH SPA- 2",40],["CITY TOUR",10],["CLEOPATRA SPA PACKAGE",55],["TURKISH BATH SPA",20],["SPA - Cleopatra package 2",65],["LUXOR - VALLEY OF THE QUEENS",45],["MINI EGYPT PARK",29],["SWIMMING WITH SHARKS",130],["ARABIAN HORSE RIDING",55]].map(([n,v])=>["From Hurghada",String(n),Number(v)] as [string,string,number]),
  ...[["Cairo standard",60],["Cairo by plane",190],["Luxor by plane",210],["Sharm dolphin show",20],["Parasailing sharm",26],["Sharm Turtle House",35],["Royal Sharm Diving",40],["Elite Diving Sharm",55],["Standard dives sharm",30],["Semi-submarine sharm",20],["RAS MOHAMMED",35],["TYRANN ISLAND",35],["ATV Safari Sharm",30],["St. Catherine's Church Sharm",35],["SAINT MINA CHURCH",14],["CHAPEL OF MOSES – MOUNT SINAI",35],["JERUSALEM – One day",170]].map(([n,v])=>["From Sharm El Sheikh",String(n),Number(v)] as [string,string,number]),
  ...[["CAIRO STANDARD",70],["Cairo private marsa alam",150],["Cairo luxury marsa brass",100],["Cairo vip maras alam",180],["Marsa Alam Turtle House",35],["Cairo overnight standard Marsa Alam",250],["Cairo overnight luxury Marsa Alam",295],["Cairo by plane Marsa Alam",225],["Diving course Marsa Alam",300],["VIP airport transfer",25]].map(([n,v])=>["From Marsa Alam",String(n),Number(v)] as [string,string,number]),
];

// Import data extracted directly from the supplied legacy MySQL dump. Idempotent by stable keys.
async function importLegacy() {
  const file = path.join(process.cwd(), "prisma", "legacy-data.json");
  let legacy: any;
  try {
    legacy = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return;
  }
  const rows = (t: string) => {
    const table = legacy[t];
    return (table?.rows || []).map((r: any[]) =>
      Object.fromEntries(
        table.columns.map((c: string, i: number) => [c, r[i]]),
      ),
    );
  };
  for (const c of rows("contacts")) {
    const n = String(c.name || "")
      .toLowerCase()
      .trim();
    const map: Record<string, string> = {
      whatsapp: "whatsapp_number",
      phone: "contact_phone",
      email: "contact_email",
      facebook: "facebook_url",
      instagram: "instagram_url",
      tripadvisor: "tripadvisor_url",
      location: "contact_address",
      address: "contact_address",
      site_name: "site_name",
    };
    const key = map[n];
    if (key && c.content)
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(c.content).trim() },
        create: { key, value: String(c.content).trim() },
      });
  }
  for (const tr of rows("trips")) {
    const name = String(tr.name || "");
    const lower = name.toLowerCase();
    const routeId = lower.includes("sharm")
      ? 1
      : lower.includes("hurghada")
        ? 2
        : lower.includes("marsa")
          ? 3
          : undefined;
    if (routeId) {
      const slug =
        routeId === 1
          ? "sharm-el-sheikh"
          : routeId === 2
            ? "hurghada"
            : "marsa-alam";
      await prisma.tripCategory.upsert({
        where: { routeId },
        update: {
          name: name.replace(/^Din /i, "From "),
          description: String(tr.description || name),
          image: tr.image ? `/${String(tr.image).replace(/^\//, "")}` : null,
        },
        create: {
          routeId,
          slug,
          name: name.replace(/^Din /i, "From "),
          description: String(tr.description || name),
          image: tr.image ? `/${String(tr.image).replace(/^\//, "")}` : null,
          sortOrder: routeId,
        },
      });
    }
  }
  for (const g of rows("galleries")) {
    const image = String(g.image || "");
    if (!image) continue;
    const title = String(g.name || `Legacy gallery ${g.id}`);
    const id = `legacy-gallery-${g.id}`;
    await prisma.galleryItem.upsert({
      where: { id },
      update: { title, image: `/${image.replace(/^\//, "")}`, active: true },
      create: {
        id,
        title,
        image: `/${image.replace(/^\//, "")}`,
        category: "Legacy",
        alt: title,
        sortOrder: Number(g.id) || 0,
        active: true,
      },
    });
  }
  // Migrate legacy posts into current Tour records (preserve source fields in mapped model).
  for (const post of rows("posts")) {
    const title = String(post.name || `Legacy excursion ${post.id}`);
    const slug =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `legacy-tour-${post.id}`;
    const rawPrice = String(post.price ?? "0")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    const price = Number.parseFloat(rawPrice) || 0;
    const legacyTripId = Number(post.trip_id || 0);
    const categoryRouteId = legacyTripId === 1 ? 1 : legacyTripId === 2 ? 2 : legacyTripId === 3 ? 3 : null;
    const category = categoryRouteId ? await prisma.tripCategory.findUnique({ where: { routeId: categoryRouteId } }) : null;
    const dest = category?.name || String(post.trip_id || "Egypt");
    const isOffer = Boolean(Number(post.offer));
    const isRecommended = Boolean(Number(post.recommend));
    await prisma.tour.upsert({
      where: { slug },
      update: {
        title,
        excerpt: String(post.description || title).slice(0, 500),
        description: String(post.description || title),
        destination: dest,
        origin: "Hurghada",
        duration: "Full day",
        price,
        currency: "EUR",
        image: post.image ? `/${String(post.image).replace(/^\//, "")}` : "",
        featured: isRecommended || isOffer,
        recommended: isRecommended,
        offer: isOffer,
        private: Boolean(Number(post.private)),
        tripCategoryId: category?.id || null,
        active: true,
      },
      create: {
        slug,
        title,
        excerpt: String(post.description || title).slice(0, 500),
        description: String(post.description || title),
        destination: dest,
        origin: "Hurghada",
        duration: "Full day",
        price,
        currency: "EUR",
        image: post.image ? `/${String(post.image).replace(/^\//, "")}` : "",
        featured: isRecommended || isOffer,
        recommended: isRecommended,
        offer: isOffer,
        private: Boolean(Number(post.private)),
        tripCategoryId: category?.id || null,
        active: true,
      },
    });
  }
  // Preserve legacy contact/order requests as manageable enquiries.
  for (const order of rows("orders")) {
    const reference = `LEGACY-${order.id}`;
    await prisma.enquiry.upsert({
      where: { reference },
      update: {
        name: String(order.name || "Legacy request"),
        email: String(order.email || "not-provided@example.invalid"),
        phone: order.phone ? String(order.phone) : null,
        message: `Type: ${order.type || "General"}\\n${String(order.message || "")}`,
        status: String(order.status || "NEW").toUpperCase(),
      },
      create: {
        reference,
        name: String(order.name || "Legacy request"),
        email: String(order.email || "not-provided@example.invalid"),
        phone: order.phone ? String(order.phone) : null,
        message: `Type: ${order.type || "General"}\\n${String(order.message || "")}`,
        status: String(order.status || "NEW").toUpperCase(),
      },
    });
  }
  for (const post of rows("posts")) {
    const title = String(post.name || "Legacy page");
    const slug =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `legacy-page-${post.id}`;
    await prisma.page.upsert({
      where: { slug },
      update: {
        title,
        content: String(post.description || ""),
        published: true,
      },
      create: {
        slug,
        title,
        content: String(post.description || ""),
        published: true,
      },
    });
  }
  for (const offer of rows("offers")) {
    if (offer.description) {
      const title = String(offer.name || "Legacy special offer");
      const idPart = String(offer.id ?? "offer");
      const slug = `legacy-${idPart.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
      const image = offer.image
        ? `/${String(offer.image).replace(/^\//, "")}`
        : null;
      await prisma.specialOffer.upsert({
        where: { slug },
        update: {
          title,
          description: String(offer.description),
          image,
          price: 0,
          currency: "EUR",
          active: true,
        },
        create: {
          slug,
          title,
          description: String(offer.description),
          image,
          price: 0,
          currency: "EUR",
          active: true,
        },
      });
      await prisma.page.upsert({
        where: { slug: "legacy-special-offers" },
        update: { title, content: String(offer.description), published: true },
        create: {
          slug: "legacy-special-offers",
          title,
          content: String(offer.description),
          published: true,
        },
      });
    }
  }
  for (const slider of rows("sliders")) {
    if (slider.name)
      await prisma.siteSetting.upsert({
        where: { key: "home_hero_title" },
        update: { value: String(slider.en_name || slider.name) },
        create: {
          key: "home_hero_title",
          value: String(slider.en_name || slider.name),
        },
      });
    if (slider.photo)
      await prisma.siteSetting.upsert({
        where: { key: "home_hero_image" },
        update: { value: `/${String(slider.photo).replace(/^\//, "")}` },
        create: {
          key: "home_hero_image",
          value: `/${String(slider.photo).replace(/^\//, "")}`,
        },
      });
  }
  for (const intro of rows("intros")) {
    const key = `legacy_intro_${intro.id}`;
    await prisma.siteSetting.upsert({
      where: { key },
      update: {
        value: JSON.stringify({
          title: intro.name,
          description: intro.description,
          image: intro.image ? `/${intro.image}` : null,
        }),
      },
      create: {
        key,
        value: JSON.stringify({
          title: intro.name,
          description: intro.description,
          image: intro.image ? `/${intro.image}` : null,
        }),
      },
    });
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) to seed admin.",
    );
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
  await importLegacy();
  for (let i=0; i<regionalPrices.length; i++) {
    const [category,name,price]=regionalPrices[i];
    const slug=name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const uniqueName = `${name} (${category})`;
    await prisma.priceItem.upsert({where:{id:`regional-price-${category.toLowerCase().replace(/[^a-z]+/g,"-")}-${i}`},update:{name:uniqueName,category,price,currency:"EUR",unit:"per person",sortOrder:i,active:true},create:{id:`regional-price-${category.toLowerCase().replace(/[^a-z]+/g,"-")}-${i}`,name:uniqueName,category,price,currency:"EUR",unit:"per person",sortOrder:i,active:true}});
  }
  const contactSettings: Record<string,string> = {
    contact_address: "203 St. Mountain View, San Francisco, California, USA",
    contact_phone: "+40725124853",
    contact_email: "contact@excursiiegipt.com",
    whatsapp_number: "+40725124853",
    instagram_url: "https://www.instagram.com/excuriiegipt/",
    tripadvisor_url: "https://www.tripadvisor.co.uk/Profile/ExcursiiEgipt",
    facebook_url: "https://www.facebook.com/Excursii-Egipt-100620649345495",
  };
  for (const [key,value] of Object.entries(contactSettings)) await prisma.siteSetting.upsert({where:{key},update:{value},create:{key,value}});
  const defaultSettings: Record<string, string> = {
    home_hero_title: "Egypt",
    home_hero_title_highlight: "is calling.",
    home_hero_eyebrow: "Authentic experiences · Memories for a lifetime",
    home_hero_description: "Discover Egypt’s treasures with local guides, thoughtfully curated experiences, and moments that stay with you.",
    home_hero_primary_cta: "Explore tours",
    home_hero_secondary_cta: "Plan your trip",
    home_recommended_title: "Our recommended excursions",
    home_offers_title: "Our special offers",
    home_gallery_title: "Moments in Egypt",
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  const origins = [
    {
      routeId: 1,
      slug: "sharm-el-sheikh",
      name: "From Sharm El Sheikh",
      description:
        "Discover Egypt’s most iconic sights and experiences with excursions departing from Sharm El Sheikh.",
      sortOrder: 1,
    },
    {
      routeId: 2,
      slug: "hurghada",
      name: "From Hurghada",
      description:
        "Explore ancient wonders, Red Sea islands and desert adventures with departures from Hurghada.",
      sortOrder: 2,
    },
    {
      routeId: 3,
      slug: "marsa-alam",
      name: "From Marsa Alam",
      description:
        "Experience the Red Sea, cultural landmarks and unforgettable day trips from Marsa Alam.",
      sortOrder: 3,
    },
  ];
  for (const o of origins)
    await prisma.tripCategory.upsert({
      where: { routeId: o.routeId },
      update: o,
      create: o,
    });
  for (let i = 0; i < packages.length; i++) {
    const [title, price] = packages[i];
    const slug = `special-package-${i + 1}`;
    await prisma.specialOffer.upsert({
      where: { slug },
      update: {
        title,
        description:
          "Special package combining selected excursions. Contact us to confirm availability, pickup and inclusions.",
        price,
        currency: "EUR",
        active: true,
      },
      create: {
        slug,
        title,
        description:
          "Special package combining selected excursions. Contact us to confirm availability, pickup and inclusions.",
        price,
        currency: "EUR",
        active: true,
      },
    });
  }
  console.log(
    `Admin ready: ${email}; imported legacy backup content, seeded departure regions and ${packages.length} special packages.`,
  );
}
main().finally(() => prisma.$disconnect());
