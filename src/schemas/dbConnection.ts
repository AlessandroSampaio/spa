import { z } from "zod";

const ipv4Regex =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export const dbConnectionSchema = z.object({
  host: z
    .string()
    .min(1, "Obrigatório")
    .regex(ipv4Regex, "IP inválido (ex: 192.168.0.1)"),
  port: z
    .string()
    .min(1, "Obrigatório")
    .regex(/^\d{1,4}$/, "Deve ter 1 a 4 dígitos numéricos"),
  database: z
    .string()
    .min(1, "Obrigatório")
    .regex(/\.fdb$/, "Deve ser um arquivo com extensão .fdb"),
  username: z.string().min(1, "Obrigatório"),
  password: z.string().min(1, "Obrigatório"),
});

export type DbConnectionForm = z.infer<typeof dbConnectionSchema>;
