"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../../state/redux";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/form";
import { confirmAuthResetPassword, resetAuthPassword } from "../../../state/slices/authSlice";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Form } from "../../../components/ui/form";

interface ResetPasswordFormProps {
    usernameProp?: string;
    toggleForm: () => void;
}

// Schema for requesting password reset
const requestResetSchema = z.object({
    username: z.string().min(1, "Username is required"),
});

// Schema for confirming password reset
const confirmResetSchema = z.object({
    confirmationCode: z.string().min(1, "Confirmation code is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RequestResetFormValues = z.infer<typeof requestResetSchema>;
export type ConfirmResetFormValues = z.infer<typeof confirmResetSchema>;

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    usernameProp,
    toggleForm
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, isPasswordReset } = useAppSelector((state) => state.auth);
    const [username, setUsername] = useState(usernameProp || "");
    const [resetStatus, setResetStatus] = useState("");
    const [resetStep, setResetStep] = useState<"request" | "confirm">("request");

    const requestForm = useForm<RequestResetFormValues>({
        resolver: zodResolver(requestResetSchema),
        defaultValues: {
            username: usernameProp || "",
        },
    });

    const confirmForm = useForm<ConfirmResetFormValues>({
        resolver: zodResolver(confirmResetSchema),
        defaultValues: {
            confirmationCode: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        // If usernameProp is provided, use it
        if (usernameProp) {
            setUsername(usernameProp);
            requestForm.setValue("username", usernameProp);
        }

        // If isPasswordReset is true, move to confirm step
        if (isPasswordReset) {
            setResetStep("confirm");
        }
    }, [usernameProp, isPasswordReset, requestForm]);

    const handleRequestReset = async (values: RequestResetFormValues) => {
        try {
            setResetStatus("Requesting password reset...");
            setUsername(values.username);

            await dispatch(resetAuthPassword({
                username: values.username
            })).unwrap();

            setResetStatus("Reset code sent to your email. Please check your inbox.");
            setResetStep("confirm");
        } catch (err) {
            console.error("Password reset request failed:", err);
            setResetStatus(`Password reset request failed: ${err}`);
        }
    };

    const handleConfirmReset = async (values: ConfirmResetFormValues) => {
        try {
            setResetStatus("Resetting password...");

            await dispatch(confirmAuthResetPassword({
                username,
                confirmationCode: values.confirmationCode,
                newPassword: values.newPassword,
            })).unwrap();

            setResetStatus("Password reset successful! Redirecting to login...");

            // Redirect back to login form after successful reset
            setTimeout(() => {
                toggleForm();
            }, 2000);
        } catch (err) {
            console.error("Password reset confirmation failed:", err);
            setResetStatus(`Password reset confirmation failed: ${err}`);
        }
    };

    return (
        <>
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Reset Your Password</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    {resetStep === "request"
                        ? "Enter your username to receive a password reset code"
                        : "We've sent a verification code to your email"}
                </p>
                {resetStatus && (
                    <p className="text-sm text-blue-500 mt-2">{resetStatus}</p>
                )}
            </div>

            {resetStep === "request" ? (
                <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-6">
                        <FormField
                            control={requestForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    <span>Processing...</span>
                                </>
                            ) : "Request Reset Code"}
                        </Button>
                    </form>
                </Form>
            ) : (
                <Form {...confirmForm}>
                    <form onSubmit={confirmForm.handleSubmit(handleConfirmReset)} className="space-y-6">
                        <FormField
                            control={confirmForm.control}
                            name="confirmationCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmation Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter confirmation code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={confirmForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Enter new password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={confirmForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Confirm new password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    <span>Resetting Password...</span>
                                </>
                            ) : "Reset Password"}
                        </Button>
                    </form>
                </Form>
            )}

            <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <button
                        type="button"
                        onClick={toggleForm}
                        className="text-primary hover:underline"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </>
    );
};

export default ResetPasswordForm;