import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("Masukkan alamat email yang valid.")),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});
export type LoginValues = z.infer<typeof loginSchema>;
