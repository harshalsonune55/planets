const BASE = "http://localhost:3001";

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
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || "Request failed");
  return (json.data ?? json) as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return (json.data ?? json) as T;
}

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
  panchanga: (data: {
    year: number; month: number; day: number;
    hour?: number; minute?: number;
    latitude: number; longitude: number; timezone: number;
  }) => post("/api/predictions/panchanga", data),
  transit: (data?: { year?: number; month?: number; day?: number; timezone?: number }) =>
    post("/api/predictions/transit", data ?? {}),
};
