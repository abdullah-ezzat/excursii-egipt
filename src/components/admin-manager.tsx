"use client";
import { useEffect, useState } from "react";
const config: any = {
  tour: {
    label: "Tours",
    fields: [
      "slug",
      "title",
      "excerpt",
      "description",
      "destination",
      "duration",
      "price",
      "currency",
      "image",
      "featured",
      "recommended",
      "offer",
      "private",
      "subtitle",
      "tag",
      "sortOrder",
      "tripCategoryId",
      "itinerary",
      "included",
      "excluded",
      "origin",
      "active",
    ],
  },
  page: {
    label: "Pages",
    fields: [
      "slug",
      "title",
      "content",
      "seoTitle",
      "seoDescription",
      "published",
    ],
  },
  specialOffer: {
    label: "Special offers",
    fields: [
      "slug",
      "title",
      "description",
      "image",
      "price",
      "oldPrice",
      "currency",
      "validUntil",
      "active",
    ],
  },
  galleryItem: {
    label: "Gallery",
    fields: ["title", "image", "category", "alt", "sortOrder", "active"],
  },
  priceItem: {
    label: "Price list",
    fields: [
      "name",
      "category",
      "description",
      "price",
      "unit",
      "currency",
      "sortOrder",
      "active",
    ],
  },
  siteSetting: { label: "Site settings", fields: ["key", "value"] },
  tripCategory: {
    label: "Trip categories",
    fields: [
      "routeId",
      "slug",
      "name",
      "description",
      "image",
      "active",
      "sortOrder",
    ],
  },
  booking: { label: "Bookings", fields: ["reference", "tourId", "name", "email", "phone", "date", "guests", "notes", "status"] },
  enquiry: { label: "Enquiries", fields: ["reference", "name", "email", "phone", "message", "status"] },
};
export function AdminManager() {
  const [resource, setResource] = useState("tour");
  const [rows, setRows] = useState<any[]>([]);
  const [raw, setRaw] = useState("{}");
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [friendly, setFriendly] = useState(true);
  async function load() {
    setMessage("");
    const r = await fetch(`/api/admin/${resource}`);
    const d = await r.json();
    if (!r.ok) {
      setRows([]);
      setMessage(d.error || "Unable to load. Please sign in.");
      return;
    }
    setRows(d);
    setEditId("");
    setRaw(
      JSON.stringify(
        Object.fromEntries(
          config[resource].fields.map((f: string) => [
            f,
            ["active", "featured", "recommended", "offer", "private", "published"].includes(f)
              ? true
              : ["price", "oldPrice", "sortOrder"].includes(f)
                ? 0
                : "",
          ]),
        ),
        null,
        2,
      ),
    );
  }
  useEffect(() => {
    load();
  }, [resource]);
  useEffect(() => {
    const syncResource = () => {
      const key = window.location.hash.replace("#resource-", "");
      if (config[key]) setResource(key);
    };
    syncResource();
    window.addEventListener("hashchange", syncResource);
    return () => window.removeEventListener("hashchange", syncResource);
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = JSON.parse(raw);
      const r = await fetch(`/api/admin/${resource}`, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...data, id: editId } : data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(editId ? "Changes saved." : "Item created.");
      await load();
    } catch (e: any) {
      setMessage(
        e instanceof SyntaxError
          ? "Invalid JSON. Please check the editor."
          : e.message || "Save failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  function edit(row: any) {
    setEditId(row.id || row.key);
    const obj = { ...row };
    delete obj.id;
    delete obj.createdAt;
    delete obj.updatedAt;
    setRaw(JSON.stringify(obj, null, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function current() {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  function setField(field: string, value: any) {
    const obj = current();
    obj[field] = value;
    setRaw(JSON.stringify(obj, null, 2));
  }
  async function remove(id: string) {
    if (!confirm("Permanently delete this item?")) return;
    const r = await fetch(
      `/api/admin/${resource}?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const d = await r.json();
    setMessage(r.ok ? "Item deleted." : d.error);
    await load();
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }
  return (
    <div>
      <nav aria-label="Admin content navigation" className="mb-6 flex flex-wrap gap-2 rounded border border-[#e7dfd3] bg-white p-3">
        {Object.entries(config).map(([key, value]: any) => (
          <button id={`resource-${key}`} key={key} type="button" onClick={() => { setResource(key); history.replaceState(null, "", `#resource-${key}`); }} className={`rounded px-3 py-2 text-xs font-bold ${resource === key ? "bg-[#702f2b] text-white" : "bg-[#fbf8f2] text-[#5e5147] hover:bg-[#eee6db]"}`}>
            {value.label}
          </button>
        ))}
      </nav>
      <div className="grid gap-7 xl:grid-cols-[.9fr_1.1fr]">
      <section className="border border-[#e7dfd3] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="serif text-2xl">
            {editId ? "Edit item" : "Add / edit content"}
          </h2>
          <button onClick={logout} className="text-xs font-bold text-[#702f2b]">
            Sign out
          </button>
        </div>
        <label className="mt-5 block text-xs font-bold uppercase tracking-wider">
          Content type
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="mt-2 w-full border border-[#e7dfd3] bg-[#fbf8f2] p-3 text-sm"
          >
            {Object.entries(config).map(([k, v]: any) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs leading-5 text-gray-500">
            Edit each field below. Required fields depend on the content type.
          </p>
          <button
            type="button"
            className="text-xs font-bold underline"
            onClick={() => setFriendly(!friendly)}
          >
            {friendly ? "Advanced JSON" : "Easy editor"}
          </button>
        </div>
        <div className="mt-4 rounded border border-dashed border-[#c9b99f] bg-[#fbf8f2] p-4">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Upload image (JPG, PNG, WEBP, GIF, AVIF · max 8 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={uploading}
              className="mt-2 block w-full text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setMessage("");
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: fd,
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Upload failed");
                  const obj = JSON.parse(raw);
                  const field = resource === "siteSetting" ? "value" : "image";
                  obj[field] = data.url;
                  setRaw(JSON.stringify(obj, null, 2));
                  setMessage(`Uploaded ${file.name}; image path inserted.`);
                } catch (err: any) {
                  setMessage(err.message || "Upload failed");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <p className="mt-2 text-xs text-gray-500">
            Upload stores the image in this site's public/uploads folder and
            inserts its local path into the image field below. Save the record
            to publish it.
          </p>
        </div>
        <form onSubmit={save}>
          {friendly ? (
            <div className="mt-4 grid gap-3">
              {config[resource].fields.map((field: string) => {
                const val = current()[field] ?? "";
                const bool = ["active", "featured", "recommended", "offer", "private", "published"].includes(
                  field,
                );
                const numeric = [
                  "price",
                  "oldPrice",
                  "sortOrder",
                  "routeId",
                ].includes(field);
                const long = [
                  "description",
                  "content",
                  "excerpt",
                  "itinerary",
                  "included",
                  "excluded",
                  "value",
                  "message",
                ].includes(field);
                return (
                  <label
                    key={field}
                    className="block text-xs font-bold capitalize text-[#55463b]"
                  >
                    {field.replace(/([A-Z])/g, " $1")}{" "}
                    {bool ? (
                      <select
                        value={String(val)}
                        onChange={(e) =>
                          setField(field, e.target.value === "true")
                        }
                        className="mt-1 w-full border bg-[#fbf8f2] p-3 text-sm"
                      >
                        <option value="true">Enabled / Yes</option>
                        <option value="false">Disabled / No</option>
                      </select>
                    ) : long ? (
                      <textarea
                        value={
                          typeof val === "string"
                            ? val
                            : JSON.stringify(val ?? "")
                        }
                        onChange={(e) => setField(field, e.target.value)}
                        rows={4}
                        className="mt-1 w-full border bg-[#fbf8f2] p-3 text-sm"
                      />
                    ) : (
                      <input
                        type={
                          numeric
                            ? "number"
                            : field === "validUntil"
                              ? "date"
                              : "text"
                        }
                        step={numeric ? "any" : undefined}
                        value={
                          field === "validUntil" && val
                            ? String(val).slice(0, 10)
                            : val instanceof Object
                              ? JSON.stringify(val)
                              : (val ?? "")
                        }
                        onChange={(e) =>
                          setField(
                            field,
                            numeric
                              ? e.target.value === ""
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        className="mt-1 w-full border bg-[#fbf8f2] p-3 text-sm"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              rows={18}
              className="mt-4 w-full border border-[#e7dfd3] bg-[#211915] p-4 font-mono text-xs leading-5 text-[#f5e8d4]"
            />
          )}
          <div className="mt-4 flex gap-3">
            <button
              disabled={busy}
              className="bg-[#702f2b] px-5 py-3 text-sm font-bold text-white"
            >
              {busy ? "Saving…" : editId ? "Save changes" : "Create item"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId("");
                  load();
                }}
                className="border px-5 py-3 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {message && (
          <p className="mt-4 wrap-break-word text-sm text-[#702f2b]">{message}</p>
        )}
      </section>
      <section className="border border-[#e7dfd3] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="serif text-2xl">{config[resource].label}</h2>
          <button onClick={load} className="text-xs font-bold text-[#a8793d]">
            Refresh
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">
              No items found, or sign in is required.
            </p>
          )}
          {rows.map((row) => (
            <div
              key={row.id || row.key}
              className="flex items-start justify-between gap-3 border-b border-[#eee6db] py-3"
            >
              <div className="min-w-0">
                <p className="wrap-break-word text-sm font-semibold">
                  {row.title || row.name || row.key || row.slug || row.id}
                </p>
                <p className="mt-1 break-all text-xs text-gray-500">
                  {row.slug ||
                    row.category ||
                    row.id ||
                    row.value?.slice(0, 90)}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  onClick={() => edit(row)}
                  className="text-xs font-bold text-[#a8793d]"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(row.id || row.key)}
                  className="text-xs font-bold text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
