export const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * A failed `fetch` only ever says "Failed to fetch", which tells nobody
 * anything. Name the address that could not be reached instead — it is almost
 * always the API being down, or NEXT_PUBLIC_API_URL not set on the deploy.
 */
class ApiUnreachableError extends Error {
  constructor() {
    super(
      `Could not reach the astrology API at ${BASE}. ` +
        (BASE.includes("localhost")
          ? "Start it with `npm run dev` in the backend folder."
          : "Check that the API is running and that NEXT_PUBLIC_API_URL points at it."),
    );
    this.name = "ApiUnreachableError";
  }
}

/** Distinguish "the server said no" from "there was no server". */
async function request(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiUnreachableError();
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || `Request failed (${res.status})`);
  return json;
}

export type BirthData = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  latitude: number;
  longitude: number;
  timezone: number;
  ayanamsha: "lahiri" | "raman" | "kp" | "fagan";
  houseSystem: "wholesign" | "equal";
};

// All API responses wrap in { success, data } — unwrap automatically
async function post<T>(path: string, body: unknown): Promise<T> {
  const json = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (json.data ?? json) as T;
}

async function get<T>(path: string): Promise<T> {
  const json = await request(path);
  return (json.data ?? json) as T;
}

/** A place and date to compute an almanac for. */
export type PanchangaQuery = {
  year: number;
  month: number;
  day: number;
  latitude: number;
  longitude: number;
  timezone: number;
  ayanamsha?: BirthData["ayanamsha"];
};

export const api = {
  chart: (data: BirthData) => post("/api/chart", data),
  chartTest: () => get("/api/chart/test"),
  planets: (data: Pick<BirthData, "year" | "month" | "day" | "timezone">) =>
    post("/api/chart/planets", data),
  dasha: (data: BirthData & { queryYear?: number; queryMonth?: number; queryDay?: number }) =>
    post("/api/dasha", data),
  antardasha: (data: BirthData & { mahaLord: string }) =>
    post("/api/dasha/antardasha", data),
  predictions: (birth: BirthData, query?: { year: number; month: number; day: number }) =>
    post("/api/predictions", { birth, query }),

  /** Full almanac for one day: 5 limbs with end times, Hora, Choghadiya, Kaal periods. */
  panchanga: (data: PanchangaQuery) => post("/api/panchanga", data),
  /** The same, for `days` consecutive days starting at the given date. */
  panchangaRange: (data: PanchangaQuery & { days: number }) =>
    post("/api/panchanga/range", data),

  transit: (data?: { year?: number; month?: number; day?: number; timezone?: number }) =>
    post("/api/predictions/transit", data ?? {}),
};
