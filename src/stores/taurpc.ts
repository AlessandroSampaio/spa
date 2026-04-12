import { createTauRPCProxy } from "../bindings";

// Single proxy instance shared across the entire app.
export const taurpc = createTauRPCProxy();
