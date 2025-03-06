import { z } from "zod";

// Schema for sign in form
export const signinSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

// Schema for requesting password reset
export const requestResetSchema = z.object({
    username: z.string().min(1, "Username is required"),
});

// Schema for confirming password reset
export const confirmResetSchema = z.object({
    confirmationCode: z.string().min(1, "Confirmation code is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// Type definitions
export type SigninFormValues = z.infer<typeof signinSchema>;
export type RequestResetFormValues = z.infer<typeof requestResetSchema>;
export type ConfirmResetFormValues = z.infer<typeof confirmResetSchema>;