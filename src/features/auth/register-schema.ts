import { z } from "zod";
import { loginSchema } from "./login-schema";

export const registerSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(2, "Nama panggilan minimal 2 karakter.")
      .max(40, "Nama panggilan maksimal 40 karakter."),
    confirmPassword: z.string().min(1, "Ulangi kata sandimu."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Konfirmasi kata sandi belum cocok.",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
