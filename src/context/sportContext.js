import { createContext, useContext } from "react";

/**
 * SportContext — the active sport for every sport-dependent admin screen.
 *
 * Phase 1 (this commit) is PRESENTATIONAL ONLY: the provider loads the real
 * sports catalogue and remembers the selection, but no screen reads `sportId`
 * to filter anything yet. Wiring the queries is Phase 3, per-module.
 *
 * Shape:
 *   sportId   string|null  active sport's uuid (null while loading / none active)
 *   sport     object|null  the full row: { _id, name, image, activate, ... }
 *   sports    array        active sports only, name-ordered
 *   setSport  (id) => void persists to localStorage + updates context
 *   loading   boolean      true until the first fetch settles
 */
const SportContext = createContext({
  sportId: null,
  sport: null,
  sports: [],
  setSport: () => {},
  loading: true,
});

export const useSport = () => useContext(SportContext);

export default SportContext;
