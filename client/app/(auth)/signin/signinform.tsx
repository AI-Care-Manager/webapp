"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../../state/redux";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../components/ui/form";
import { clearAuthError, login } from "../../../state/slices/authSlice";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Form } from "../../../components/ui/form";

const signinSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export type SigninFormValues = z.infer<typeof signinSchema>;

interface SigninFormProps {
    setUsernameForReset: (username: string) => void;
    toggleForm: () => void;
}

const SigninForm: React.FC<SigninFormProps> = ({
    setUsernameForReset,
    toggleForm
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, isVerificationStep } = useAppSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const form = useForm<SigninFormValues>({
        resolver: zodResolver(signinSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    // Clear error when form changes
    useEffect(() => {
        const subscription = form.watch(() => {
            if (error) {
                dispatch(clearAuthError());
            }
        });
        return () => subscription.unsubscribe();
    }, [form, dispatch, error]);

    const onSubmit = async (values: SigninFormValues) => {
        try {
            // Store username for verification or reset steps
            setUsernameForReset(values.username);

            const result = await dispatch(login({
                username: values.username,
                password: values.password,
            })).unwrap();

            console.log("result", result);

            if (isVerificationStep) {
                // Navigate to verification page
                router.push("/verify");
            } else {
                // Navigate to dashboard after successful login
                router.push("/dashboard");
                // Force navigation to dashboard
                window.location.href = "/dashboard";
            }
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <>
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            {...field}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                            <button
                                                type="button"
                                                className="text-muted-foreground"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowPassword(!showPassword);
                                                }}
                                            >
                                                {showPassword ? (
                                                    <Eye className="w-4 h-4" />
                                                ) : (
                                                    <EyeOff className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
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
                                <span>Signing In...</span>
                            </>
                        ) : "Sign In"}
                    </Button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:underline">
                                Sign Up
                            </Link>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Forgot your password?{" "}
                            <button
                                type="button"
                                onClick={toggleForm}
                                className="text-primary hover:underline"
                            >
                                Reset Password
                            </button>
                        </p>
                    </div>
                </form>
            </Form>
        </>
    );
};

export default SigninForm;