import {
  isSessionExpired,
  markLoginAt,
  getPersistMode,
  setPersistMode,
  ABSOLUTE_MAX_MS,
  LOGIN_AT_KEY,
} from "./session";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("isSessionExpired", () => {
  test("a freshly stamped login is not expired", () => {
    markLoginAt(Date.now());
    expect(isSessionExpired()).toBe(false);
  });

  test("just under the absolute cap is not expired", () => {
    markLoginAt(Date.now() - (ABSOLUTE_MAX_MS - 1000));
    expect(isSessionExpired()).toBe(false);
  });

  test("just over the absolute cap is expired", () => {
    markLoginAt(Date.now() - (ABSOLUTE_MAX_MS + 1000));
    expect(isSessionExpired()).toBe(true);
  });

  test("a missing timestamp is treated as expired", () => {
    expect(isSessionExpired()).toBe(true);
  });

  test("a timestamp in the future is treated as expired", () => {
    markLoginAt(Date.now() + 60_000);
    expect(isSessionExpired()).toBe(true);
  });
});

describe("persist mode", () => {
  test("defaults to session (Keep me signed in unchecked)", () => {
    expect(getPersistMode()).toBe("session");
  });

  test("setPersistMode('local') is read back as local", () => {
    setPersistMode("local");
    expect(getPersistMode()).toBe("local");
  });

  test("an unrecognized value falls back to session", () => {
    window.localStorage.setItem("mkpl-admin-persist", "garbage");
    expect(getPersistMode()).toBe("session");
  });

  test("login-at is written to the store selected by the persist mode", () => {
    setPersistMode("session");
    markLoginAt(Date.now());
    expect(window.sessionStorage.getItem(LOGIN_AT_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(LOGIN_AT_KEY)).toBeNull();

    setPersistMode("local");
    markLoginAt(Date.now());
    expect(window.localStorage.getItem(LOGIN_AT_KEY)).not.toBeNull();
  });
});
