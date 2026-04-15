import { createSignal } from "solid-js";

export type Interval =
  | "OneWeek"
  | "TwoWeeks"
  | "OneMonth"
  | "TwoMonths"
  | "ThreeMonths"
  | "SixMonths";

export const INTERVAL_LABELS: Record<Interval, string> = {
  OneWeek: "1 semana",
  TwoWeeks: "2 semanas",
  OneMonth: "1 mês",
  TwoMonths: "2 meses",
  ThreeMonths: "3 meses",
  SixMonths: "6 meses",
};

export const [interval, setInterval] = createSignal<Interval>("SixMonths");
