import { createSignal } from "solid-js";

export type ProforlinFilter = "N" | "S" | "ambos";

/** "N" = Em linha (default) · "S" = Fora de Linha · "ambos" = sem filtro */
export const [proforlinFilter, setProforlinFilter] =
  createSignal<ProforlinFilter>("N");
