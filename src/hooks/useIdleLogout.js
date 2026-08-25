import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useAlert } from "./useAlert";
import { logoutUser } from "../lib/localStorage";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  markActivity,
  getLastActivity,
} from "../lib/session";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
// How often we bookkeep an activity timestamp to storage. Doesn't need to be
// every event — cross-tab awareness only needs a coarse resolution.
const ACTIVITY_WRITE_THROTTLE_MS = 5000;
// How often we check elapsed idle time against the thresholds.
const CHECK_INTERVAL_MS = 5000;

// Signs the admin out after IDLE_TIMEOUT_MS of no mouse/keyboard/touch/scroll
// activity anywhere in the app, warning IDLE_WARNING_MS beforehand. No-ops
// entirely when not authenticated (never runs on the login screen).
export const useIdleLogout = () => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state) => state.isRun?.isAuth);
  const { showAlert } = useAlert();
  const lastWriteRef = useRef(0);
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (!isAuth) return undefined;

    markActivity();
    warningShownRef.current = false;

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWriteRef.current = now;
      markActivity(now);
      if (warningShownRef.current) {
        warningShownRef.current = false;
        Swal.close();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onActivity);

    const intervalId = setInterval(() => {
      const lastActivity = getLastActivity() ?? Date.now();
      const idleFor = Date.now() - lastActivity;

      if (idleFor >= IDLE_TIMEOUT_MS) {
        clearInterval(intervalId);
        logoutUser(dispatch);
        return;
      }

      if (idleFor >= IDLE_TIMEOUT_MS - IDLE_WARNING_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        showAlert({
          title: "Still there?",
          text: "You'll be signed out in 2 minutes due to inactivity.",
          icon: "warning",
          showConfirmButton: true,
          confirmButtonText: "Stay signed in",
          onConfirm: () => {
            warningShownRef.current = false;
            markActivity();
          },
        });
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity));
      document.removeEventListener("visibilitychange", onActivity);
      clearInterval(intervalId);
    };
    // showAlert is a fresh function reference every render (useAlert.jsx
    // creates it inline) — omitting it from deps is deliberate so the
    // interval/listeners aren't torn down and recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, dispatch]);
};

export default useIdleLogout;
