// A static picture of what the app will show for these notes: the What's New
// sheet (optional or required), the one-line banner, or nothing. Mirrors
// apps/mobile/App/Components/WhatsNew/WhatsNewSheet.tsx / WhatsNewBanner.tsx
// closely enough to catch copy and layout mistakes before a release.
import React, { useState } from "react";
import { FeatherIcon } from "./featherIcons";

const NotesPreview = ({ notes }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const { mode, title, subtitle, imageUrl, items, ctaLabel } = notes;
  const shownItems = (items || []).filter((it) => String(it.title || "").trim()).slice(0, 8);
  const httpsImage = /^https:\/\//i.test(imageUrl || "") && !imageFailed;

  return (
    <div className="ota_preview">
      <p className="rp_label mb-2">Preview — what users see after the update</p>
      <div className="ota_phone">
        <div className="ota_phone_screen">
          <div className="ota_phone_app">
            <span>MakePlays</span>
          </div>

          {mode === "silent" && (
            <div className="ota_phone_silent">
              <p className="cp_hint m-0">Silent — nothing is shown. The update just runs.</p>
            </div>
          )}

          {mode === "banner" && (
            <div className="ota_phone_banner">
              <FeatherIcon name="gift" size={16} />
              <div className="flex-grow-1 min-w-0">
                <p className="ota_phone_banner_title">{title || "What's new"}</p>
                <p className="ota_phone_banner_line">{subtitle || shownItems[0]?.title || ""}</p>
              </div>
              <span aria-hidden>✕</span>
            </div>
          )}

          {(mode === "sheet" || mode === "required") && (
            <>
              <div className="ota_phone_scrim" />
              <div className="ota_phone_sheet">
                <div className="ota_phone_grab" />
                {mode === "sheet" && <span className="ota_phone_close" aria-hidden>✕</span>}
                {httpsImage && (
                  <img
                    src={imageUrl}
                    alt=""
                    className="ota_phone_image"
                    onError={() => setImageFailed(true)}
                  />
                )}
                <p className="ota_phone_title">{title || "What's new"}</p>
                {subtitle ? <p className="ota_phone_subtitle">{subtitle}</p> : null}
                <div className="ota_phone_items">
                  {shownItems.map((it, i) => (
                    <div key={i} className="ota_phone_item">
                      <span className="ota_phone_item_icon">
                        <FeatherIcon name={it.icon} size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="ota_phone_item_title">{it.title}</p>
                        {it.body ? <p className="ota_phone_item_body">{it.body}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ota_phone_cta">{ctaLabel || "Got it"}</div>
                {mode === "required" && (
                  <p className="ota_phone_required">Required — no close button; back does nothing.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {imageUrl && !/^https:\/\//i.test(imageUrl) && (
        <p className="cp_hint cp_hint_warn">The image must be an https link — the app drops anything else.</p>
      )}
      {imageFailed && <p className="cp_hint cp_hint_warn">That image didn't load. Check the link.</p>}
    </div>
  );
};

export default NotesPreview;
