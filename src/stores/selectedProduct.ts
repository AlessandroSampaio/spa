import { createSignal } from "solid-js";
import type { Product } from "../bindings";

export const [selectedProduct, setSelectedProduct] =
  createSignal<Product | null>(null);
