import { loginSchema } from "./login-schema";

export const forgotPasswordSchema = loginSchema.pick({ email: true });
