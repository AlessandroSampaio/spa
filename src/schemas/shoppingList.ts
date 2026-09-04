import { z } from "zod";

export const shoppingListSchema = z.object({
  name: z.string().min(1, "Obrigatório").max(80, "Máximo de 80 caracteres"),
});

export type ShoppingListForm = z.infer<typeof shoppingListSchema>;
