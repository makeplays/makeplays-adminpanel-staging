import React, { useEffect, useRef, useState } from "react";
import { useSport } from "../context/sportContext";
import { assetUrl } from "../lib/assetUrl";
import key from "../config/index";

/**
 * Active-sport switcher, rendered under the sidebar brand.
 *
 * A dropdown rather than the pill/segmented style used elsewhere in the panel:
 * the sidebar column is `Col xl={2}` (~200px, and `.sidebar li` caps children at
 * 90% of that) while the catalogue seeds 10 active sports. Pills would wrap to
 * four-plus rows and push the navigation below the fold. The dropdown holds one
 * row regardless of how many sports exist, and keeps the panel's dark-red
 * (--static-primary1) identity.
 */
function SportSwitcher() {
  const { sport, sports, setSport, loading } = useSport();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sportImg = (s) =>
    s?.image && s.image !== "undefined"
      ? assetUrl(s.image, `${key.IMAGE_URL}/Sports/`)
      : null;

  if (loading) {
    return (
      <div className="sport_switcher px-4 py-3">
        <p className="sport_switcher_label">ACTIVE SPORT</p>
        <div className="sport_switcher_btn sport_switcher_btn--loading">
          <span className="sport_switcher_name">Loading…</span>
        </div>
      </div>
    );
  }

  // No active sports: the Sports CRUD is a global screen, so the admin can still
  // navigate there and activate one.
  if (!sports.length) {
    return (
      <div className="sport_switcher px-4 py-3">
        <p className="sport_switcher_label">ACTIVE SPORT</p>
        <div className="sport_switcher_btn sport_switcher_btn--empty">
          <span className="sport_switcher_name">No active sports</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sport_switcher px-4 py-3" ref={rootRef}>
      <p className="sport_switcher_label">ACTIVE SPORT</p>

      <button
        type="button"
        className="sport_switcher_btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {sportImg(sport) ? (
          <img src={sportImg(sport)} alt="" className="sport_switcher_icon" />
        ) : (
          <span className="sport_switcher_icon sport_switcher_icon--fallback">
            {(sport?.name ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <span className="sport_switcher_name">{sport?.name ?? "Select sport"}</span>
        <span className={`sport_switcher_caret ${open ? "is_open" : ""}`}>▾</span>
      </button>

      {open && (
        <ul className="sport_switcher_menu" role="listbox">
          {sports.map((s) => {
            const isActive = s._id === sport?._id;
            return (
              <li key={s._id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`sport_switcher_option ${isActive ? "is_active" : ""}`}
                  onClick={() => {
                    setSport(s._id);
                    setOpen(false);
                  }}
                >
                  {sportImg(s) ? (
                    <img src={sportImg(s)} alt="" className="sport_switcher_icon" />
                  ) : (
                    <span className="sport_switcher_icon sport_switcher_icon--fallback">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="sport_switcher_name">{s.name}</span>
                  {isActive && <span className="sport_switcher_check">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SportSwitcher;
