import React from "react";
import { useSport } from "../context/sportContext";

/**
 * "Applies to" scope picker — the active sport, or all sports.
 *
 * Deliberately only two options, both of which are always visible in the list
 * the admin returns to after saving. A full sport dropdown would let someone
 * sitting in Ice Hockey create a Baseball row and then not find it, because the
 * list shows this sport plus shared rows only. Two options make that state
 * unreachable rather than merely handled.
 *
 * Rendered ABOVE the content fields: scope frames everything below it, and
 * asking after the body is written risks the admin redoing the work.
 *
 * Defaults to the active sport, not All Sports — the safer accident. A stray
 * sport-scoped row affects one sport and is easy to spot; a stray shared row
 * silently changes every sport.
 */
function AppliesToPills({ allSports, onChange, disabled, sportName, allSportsHint }) {
  const { sport } = useSport();
  // When editing a row that belongs to another sport, name THAT sport rather
  // than the active one — otherwise the pill would offer to silently move the
  // row into whichever sport happens to be selected.
  const scopeName = sportName ?? sport?.name;

  return (
    <div className="rp_singleinput_holder mb-4">
      <p className="rp_label mb-2">Applies to</p>
      <div className="applies_pills">
        <button
          type="button"
          className={`applies_pill ${!allSports ? "is_active" : ""}`}
          onClick={() => !disabled && onChange(false)}
          disabled={disabled}
        >
          {scopeName ? `${scopeName} only` : "This sport only"}
        </button>
        <button
          type="button"
          className={`applies_pill ${allSports ? "is_active" : ""}`}
          onClick={() => !disabled && onChange(true)}
          disabled={disabled}
        >
          All Sports
        </button>
      </div>
      {disabled ? (
        <p className="applies_hint">
          Scope cannot be changed after creation — delete and re-create to move it.
        </p>
      ) : (
        <p className="applies_hint">
          {allSports
            ? allSportsHint ?? "Used by every sport, unless that sport has its own version."
            : `Only used for ${scopeName ?? "this sport"}.`}
        </p>
      )}
    </div>
  );
}

export default AppliesToPills;
