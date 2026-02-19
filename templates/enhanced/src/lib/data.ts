import type { ClientData } from "./types";
import rawData from "../../public/data/client-data.json";

const data = rawData as ClientData;

/** Returns the full dashboard dataset from client-data.json */
export function useDashboardData(): ClientData {
  return data;
}
