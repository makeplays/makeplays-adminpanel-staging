// Supabase implementation of the coupon-code admin endpoints.
// Same exported return shapes as the rest of the panel ({status, message,
// result, count}) so the screens follow existing conventions.
//
// BACKED BY migration 20260908000003_coupon_codes.sql. Two layers:
//
//   discount_slots — the offers registered in App Store Connect / Play Console.
//                    These carry the PRICE and need App Review. Admin does not
//                    create them here; they are seeded and their store ids are
//                    filled in once registered.
//   coupons        — the codes admin invents freely. Name, category, expiry,
//                    cap. No store involvement, no review, instant.
//
// Admin creating a coupon therefore never changes a price — it maps a code onto
// a slot that already exists in the stores. `category` is free text ('support',
// 'friend', anything else) and carries no behaviour; it exists for grouping and
// reporting only.
import { supabase } from "./supabase";

const fail = (err) => ({ status: false, message: err?.message || "Something went wrong!" });

// <input type="datetime-local"> yields a NAIVE local string ("2026-09-09T12:57")
// with no timezone. Sending that straight to a timestamptz column makes Postgres
// read it as UTC, so an admin in IST (UTC+5:30) who picks "now" gets a start
// time 5.5 hours in the FUTURE and the coupon reads as Scheduled.
// new Date(naive) parses it in the browser's local zone, and toISOString()
// converts to real UTC — so what admin picked is what takes effect.
const localInputToIso = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// Rows are mapped to `_id` to match every other screen in the panel.
const slotRow = (s) => s && ({
  _id: s.id,
  label: s.label,
  targetProductId: s.target_product_id,
  discountPercent: s.discount_percent,
  appleOfferId: s.apple_offer_id,
  googleOfferId: s.google_offer_id,
  active: s.active,
  // A slot with no store id on a platform cannot be redeemed there — the app
  // shows "not available yet" rather than charging full price. Surfaced so
  // admin can see at a glance which slots are actually live.
  registeredOn: [s.apple_offer_id ? "iOS" : null, s.google_offer_id ? "Android" : null]
    .filter(Boolean).join(" + ") || "Not registered",
  createdAt: s.created_at,
});

const couponRow = (c) => c && ({
  _id: c.id,
  code: c.code,
  category: c.category,
  discountSlotId: c.discount_slot_id,
  slotLabel: c.discount_slots?.label ?? "—",
  discountPercent: c.discount_slots?.discount_percent ?? null,
  targetProductId: c.discount_slots?.target_product_id ?? null,
  appleOfferId: c.discount_slots?.apple_offer_id ?? null,
  googleOfferId: c.discount_slots?.google_offer_id ?? null,
  validFrom: c.valid_from,
  validUntil: c.valid_until,
  maxRedemptions: c.max_redemptions,
  redeemedCount: c.redeemed_count,
  oncePerUserEver: c.once_per_user_ever,
  active: c.active,
  notes: c.notes,
  createdAt: c.created_at,
  // Derived so the table can show one honest status instead of making the
  // reader combine three columns in their head.
  state: couponState(c),
});

function couponState(c) {
  if (!c.active) return "Disabled";
  if (c.valid_from && new Date(c.valid_from) > new Date()) return "Scheduled";
  if (c.valid_until && new Date(c.valid_until) <= new Date()) return "Expired";
  if (c.max_redemptions != null && c.redeemed_count >= c.max_redemptions) return "Fully claimed";
  return "Live";
}

// ─── discount slots ─────────────────────────────────────────────────────────
export const listDiscountSlots = async () => {
  const { data, error, count } = await supabase
    .from("discount_slots")
    .select("*", { count: "exact" })
    .order("target_product_id")
    .order("discount_percent");
  if (error) return fail(error);
  return {
    status: true,
    message: "Discount slots listed successfully",
    result: (data ?? []).map(slotRow),
    count: count ?? 0,
  };
};

// Record the store-side identifiers once an offer has actually been registered
// in App Store Connect / Play Console. This is the only field admin edits on a
// slot — label, product and percent are fixed by what was registered.
export const UpdateSlotStoreIds = async (data) => {
  const { slotId, appleOfferId, googleOfferId } = data || {};
  if (!slotId) return fail({ message: "Missing slot" });
  const update = {};
  // Empty string clears the id (slot no longer live on that platform); the
  // distinction from `undefined` matters, so only skip when truly absent.
  if (appleOfferId !== undefined) update.apple_offer_id = appleOfferId || null;
  if (googleOfferId !== undefined) update.google_offer_id = googleOfferId || null;
  const { error } = await supabase.from("discount_slots").update(update).eq("id", slotId);
  if (error) return fail(error);
  return { status: true, message: "Store IDs updated successfully" };
};

// ─── coupons ────────────────────────────────────────────────────────────────
export const listAllCoupons = async () => {
  const { data, error, count } = await supabase
    .from("coupons")
    .select(
      "*, discount_slots(label, discount_percent, target_product_id, apple_offer_id, google_offer_id)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });
  if (error) return fail(error);
  return {
    status: true,
    message: "Coupons listed successfully",
    result: (data ?? []).map(couponRow),
    count: count ?? 0,
  };
};

export const AddCoupon = async (data) => {
  const {
    code, discountSlotId, category, validFrom, validUntil,
    maxRedemptions, oncePerUserEver, notes,
  } = data || {};

  if (!code || !String(code).trim()) return fail({ message: "Code is required" });
  if (!discountSlotId) return fail({ message: "Choose a discount" });

  // Number("abc") is NaN, which serialises to JSON null — silently creating an
  // UNCAPPED coupon when admin meant a capped one. Refuse instead.
  const parsedCap =
    maxRedemptions === "" || maxRedemptions == null ? null : Number(maxRedemptions);
  if (parsedCap !== null && (!Number.isInteger(parsedCap) || parsedCap < 1)) {
    return fail({ message: "Maximum redemptions must be a whole number of 1 or more, or blank for unlimited." });
  }

  const { data: u } = await supabase.auth.getUser();

  const { error } = await supabase.from("coupons").insert({
    // Stored uppercase; validate_coupon folds case, so the user may type
    // 'save20' and still match.
    code: String(code).trim().toUpperCase(),
    discount_slot_id: discountSlotId,
    category: (category || "support").trim().toLowerCase(),
    valid_from: localInputToIso(validFrom) || new Date().toISOString(),
    valid_until: localInputToIso(validUntil),
    // Blank means uncapped, which is different from 0 — coerce carefully.
    max_redemptions: parsedCap,
    once_per_user_ever: !!oncePerUserEver,
    notes: notes || null,
    created_by: u?.user?.id ?? null,
  });
  if (error) {
    // 23505 = unique violation on `code`. Say which problem it is rather than
    // surfacing a Postgres string.
    if (error.code === "23505") return fail({ message: "That code already exists" });
    return fail(error);
  }
  return { status: true, message: "Coupon created successfully" };
};

export const EditCoupon = async (data) => {
  const {
    couponId, _id, category, validFrom, validUntil,
    maxRedemptions, oncePerUserEver, active, notes,
  } = data || {};
  const id = couponId ?? _id;
  if (!id) return fail({ message: "Missing coupon" });

  // `code` and `discount_slot_id` are deliberately NOT editable: people may
  // already have been given the code, and repointing it at a different discount
  // would silently change what an outstanding code is worth.
  // updated_at is maintained by a BEFORE UPDATE trigger (20260909000002)
  // using server time — never the client clock, which is spoofable and skews.
  const update = {};
  if (category !== undefined) update.category = (category || "support").trim().toLowerCase();
  if (validFrom !== undefined) {
    update.valid_from = localInputToIso(validFrom) || new Date().toISOString();
  }
  if (validUntil !== undefined) update.valid_until = localInputToIso(validUntil);
  if (maxRedemptions !== undefined) {
    const cap =
      maxRedemptions === "" || maxRedemptions == null ? null : Number(maxRedemptions);
    if (cap !== null && (!Number.isInteger(cap) || cap < 1)) {
      return fail({ message: "Maximum redemptions must be a whole number of 1 or more, or blank for unlimited." });
    }
    update.max_redemptions = cap;
  }
  if (oncePerUserEver !== undefined) update.once_per_user_ever = !!oncePerUserEver;
  if (active !== undefined) update.active = !!active;
  if (notes !== undefined) update.notes = notes || null;

  // An empty patch would be a no-op that still reports success. The edit form
  // always sends its fields, so this only guards programmatic callers.
  if (Object.keys(update).length === 0) {
    return { status: true, message: "Nothing to update" };
  }

  const { error } = await supabase.from("coupons").update(update).eq("id", id);
  if (error) return fail(error);
  return { status: true, message: "Coupon updated successfully" };
};

// Disable rather than delete. A deleted coupon loses its redemption history,
// and people may still be holding the code — disabling refuses new redemptions
// while keeping the campaign's numbers intact.
export const DisableCoupon = async (data) => {
  const id = data?.couponId ?? data?._id;
  if (!id) return fail({ message: "Missing coupon" });
  const { error } = await supabase
    .from("coupons")
    .update({ active: false })
    .eq("id", id);
  if (error) return fail(error);
  return { status: true, message: "Coupon disabled successfully" };
};

// ─── Apple one-time code pool ───────────────────────────────────────────────
// Apple offer codes must be pre-generated in App Store Connect and downloaded
// as CSV. This loads that list against a slot so the app can hand each redeemer
// an unused code and prefill Apple's redemption sheet.
export const getApplePoolStatus = async () => {
  // Counts come from the SERVER via head-only count queries. The previous
  // version selected every row and counted in JS, which Supabase silently caps
  // at 1000 — so a pool of 5,000 codes reported "1000" and admin had no way to
  // know the number was wrong (audit finding, 2026-09-09).
  const { data: slots, error: slotErr } = await supabase
    .from("discount_slots")
    .select("id, label");
  if (slotErr) return fail(slotErr);

  const result = await Promise.all(
    (slots ?? []).map(async (slot) => {
      const [totalRes, availableRes] = await Promise.all([
        supabase
          .from("apple_offer_codes")
          .select("id", { count: "exact", head: true })
          .eq("discount_slot_id", slot.id),
        supabase
          .from("apple_offer_codes")
          .select("id", { count: "exact", head: true })
          .eq("discount_slot_id", slot.id)
          .is("assigned_to", null)
          .is("consumed_at", null),
      ]);
      // Surface a failed count as UNKNOWN, never as 0. A silent zero on a
      // stocked slot reads as "codes exhausted" — admin's rational response is
      // to upload a duplicate batch, or to tell a customer the campaign is
      // dead. Same class of bug as the 1000-row cap this replaced.
      if (totalRes.error || availableRes.error) {
        return { _id: slot.id, label: slot.label, unknown: true };
      }
      const total = totalRes.count ?? 0;
      const available = availableRes.count ?? 0;
      return {
        _id: slot.id,
        label: slot.label,
        total,
        available,
        // Clamped: the two counts are separate queries, so a code claimed
        // between them could otherwise render a negative "assigned".
        assigned: Math.max(0, total - available),
      };
    }),
  );

  return { status: true, message: "Pool status listed successfully", result };
};

// Exported so the screen's "N codes ready to add" preview counts EXACTLY what
// the upload will insert. When the two had separate implementations the preview
// said 1000 for a 500-row CSV, which is how the double-count shipped unnoticed.
export const parseAppleCodes = (codes) => {
  // Apple's one-time-code export is TWO columns per row:
  //
  //   E73KNLLPJEM7NAH4XH,https://apps.apple.com/redeem?ctx=offercodes&id=…&code=E73KNLLPJEM7NAH4XH
  //
  // The previous version split on /[\s,]+/, which flattened rows AND columns
  // into one list — so a 500-row CSV produced 1000 "codes", half of them
  // redemption URLs. Those would sit in the pool looking valid and be handed
  // to a customer as something to paste into the App Store, where they can
  // never work.
  //
  // So: split into ROWS first, then take the code from each row. A row may be
  //   "CODE"                    (a pasted single column)
  //   "CODE,https://…"          (Apple's export)
  //   "https://…?code=CODE"     (just the URL)
  // and the code is recovered from whichever of those it is.
  const CODE_RE = /^[A-Z0-9]{8,}$/;
  const parsed = String(codes || "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const row = line.trim();
      if (!row) return [];
      // A row carrying a URL is Apple's export: "CODE,https://…?code=CODE".
      // Take the code= parameter and STOP — the bare first column is the same
      // code, so reading both is exactly the double-count this fixes.
      const fromUrl = row.match(/[?&]code=([A-Za-z0-9]+)/);
      if (fromUrl) return [fromUrl[1].toUpperCase()];
      // No URL, so this is a hand-pasted row. The placeholder tells admins
      // "one per line, or comma-separated", so take EVERY code-shaped field
      // here rather than just the first — otherwise pasting a comma list
      // silently imports only its first code.
      return row
        .split(",")
        .map((f) => f.trim().toUpperCase())
        .filter((f) => CODE_RE.test(f));
    })
    .filter((c) => c && !/^CODE$/i.test(c));
  return Array.from(new Set(parsed));
};

export const UploadAppleCodes = async (data) => {
  const { discountSlotId, codes } = data || {};
  if (!discountSlotId) return fail({ message: "Choose a discount" });

  const parsed = parseAppleCodes(codes);

  if (!parsed.length) return fail({ message: "No codes found in that list" });

  // parseAppleCodes already de-duplicated.
  const unique = parsed;
  const { data: inserted, error } = await supabase
    .from("apple_offer_codes")
    .upsert(
      unique.map((code) => ({ discount_slot_id: discountSlotId, code })),
      // A code already in the pool is skipped rather than erroring the whole
      // batch — re-pasting an overlapping CSV is a normal thing to do.
      { onConflict: "code", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return fail(error);
  // Report what was ACTUALLY inserted. Reporting unique.length claimed "500
  // codes added" when re-pasting the same CSV added none.
  const added = inserted?.length ?? 0;
  const skipped = unique.length - added;
  return {
    status: true,
    message:
      added === 0
        ? `No new codes — all ${unique.length} were already in the pool`
        : `${added} codes added${skipped > 0 ? ` (${skipped} already present)` : ""}`,
  };
};

// List the individual codes in a slot's pool, so admin can inspect and prune.
// Assigned codes are included but flagged — they must not be deleted, since a
// user is mid-redemption with one.
export const listAppleCodes = async (discountSlotId) => {
  if (!discountSlotId) return fail({ message: "Missing discount" });
  const { data, error, count } = await supabase
    .from("apple_offer_codes")
    .select("*", { count: "exact" })
    .eq("discount_slot_id", discountSlotId)
    .order("assigned_to", { nullsFirst: true })
    .order("created_at")
    .limit(1000);
  if (error) return fail(error);
  return {
    status: true,
    message: "Codes listed successfully",
    result: (data ?? []).map((c) => ({
      _id: c.id,
      code: c.code,
      assigned: !!c.assigned_to,
      assignedAt: c.assigned_at,
      createdAt: c.created_at,
    })),
    count: count ?? 0,
  };
};

// Delete ONE unassigned code — a typo, or a code that shouldn't have been in
// the batch. Refuses if it has been handed to a user: deleting then would break
// a redemption already in flight, and the pooled code is that user's only way
// to get their discount.
export const DeleteAppleCode = async (data) => {
  const id = data?.codeId ?? data?._id;
  if (!id) return fail({ message: "Missing code" });
  const { data: rows, error } = await supabase
    .from("apple_offer_codes")
    .delete()
    .eq("id", id)
    .is("assigned_to", null)
    .select("id");
  if (error) return fail(error);
  if (!rows || rows.length === 0) {
    return fail({ message: "That code is already assigned to a customer and can't be removed." });
  }
  return { status: true, message: "Code removed" };
};

// Clear every UNASSIGNED code from a slot's pool — the recovery path for a
// batch pasted against the wrong discount. Assigned codes are deliberately
// left behind so in-flight redemptions keep working.
export const ClearUnassignedAppleCodes = async (data) => {
  const { discountSlotId } = data || {};
  if (!discountSlotId) return fail({ message: "Missing discount" });
  const { data: rows, error } = await supabase
    .from("apple_offer_codes")
    .delete()
    .eq("discount_slot_id", discountSlotId)
    .is("assigned_to", null)
    .select("id");
  if (error) return fail(error);
  const n = rows?.length ?? 0;
  return {
    status: true,
    message: n === 0 ? "No unassigned codes to remove" : `${n} unassigned codes removed`,
  };
};

// ─── redemption report ──────────────────────────────────────────────────────
export const listCouponRedemptions = async () => {
  const { data, error, count } = await supabase
    .from("coupon_redemptions")
    .select("*, coupons(code, category, discount_slots(label))", { count: "exact" })
    .order("reserved_at", { ascending: false })
    .limit(500);
  if (error) return fail(error);
  return {
    status: true,
    message: "Redemptions listed successfully",
    result: (data ?? []).map((r) => ({
      _id: r.id,
      code: r.coupons?.code ?? "—",
      category: r.coupons?.category ?? "—",
      slotLabel: r.coupons?.discount_slots?.label ?? "—",
      userId: r.user_id,
      // 'reserved' means validated but the purchase never confirmed — useful
      // signal on its own: lots of reserved rows means people are abandoning
      // checkout after applying a code.
      status: r.status,
      productId: r.product_id,
      reservedAt: r.reserved_at,
      confirmedAt: r.confirmed_at,
    })),
    count: count ?? 0,
  };
};
