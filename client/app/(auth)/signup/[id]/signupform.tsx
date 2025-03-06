"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "../../../../components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../../components/ui/select";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "../../../../state/redux";
import { signupUser, verifyCode } from "../../../../state/slices/authSlice";
import { withToast } from "../../../../lib/utils";
import { useCreateUserMutation } from "../../../../state/api";

const signupSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    role: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignupForm = ({
    setEmailForVerification,
    setUsernameForVerification,
    toggleForm,
    invitationData,
    isInvitation
}: {
    setEmailForVerification: (email: string) => void,
    setUsernameForVerification: (username: string) => void,
    toggleForm: () => void,
    invitationData: {
        token: string;
        role: string;
        inviterId: string;
        email: string;
    } | null,
    isInvitation: boolean
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, isVerificationStep } = useAppSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [createUser] = useCreateUserMutation();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: invitationData?.email || "",
            username: "",
            firstName: "",
            lastName: "",
            role: invitationData?.role || "CLIENT",
            password: "",
            confirmPassword: "",
        },
    });

    // Update form values when invitation data changes
    useEffect(() => {
        if (isInvitation && invitationData) {
            form.setValue("email", invitationData.email);
            form.setValue("role", invitationData.role);
        }
    }, [invitationData, isInvitation, form]);

    // Show error toast when error state changes
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const onSubmit = async (values: SignupFormValues) => {
        try {
            // Store email for verification step
            setEmailForVerification(values.email);
            setUsernameForVerification(values.username);

            const result = await withToast(
                dispatch(signupUser({
                    email: values.email,
                    password: values.password,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    username: values.username,
                    role: values.role,
                    agencyId: invitationData?.inviterId // Changed from inviterId to agencyId
                })).unwrap(),
                {
                    success: "Account created successfully!",
                    error: "Failed to create account. Please try again."
                }
            );

            if (isVerificationStep) {
                // If verification is needed, automatically switch to verification form
                toggleForm();
            } else if (result) {
                //CREATE USER IN DATABASE
                const user = await createUser({
                    id: crypto.randomUUID(),
                    cognitoId: result.user.cognitoId ?? "",
                    email: values.email,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    role: values.role,
                    invitedById: invitationData?.inviterId
                })
                toast.success("Account created successfully!");
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Signup failed:", err);
            toast.error("Signup failed. Please try again.");
        }
    };

    // This function is not used in the current component, removing it
    // If needed, it should be implemented in the verification component

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your email"
                                        {...field}
                                        disabled={isInvitation}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your username"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isInvitation}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CLIENT">Client</SelectItem>
                                        <SelectItem value="FAMILY">Family</SelectItem>
                                        <SelectItem value="HEALTH_WORKER">Health Worker</SelectItem>
                                        <SelectItem value="OFFICE_STAFF">Office Staff</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }: { field: any }) => (
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

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Confirm your password" {...field} />
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
                                <span>Signing Up...</span>
                            </>
                        ) : isInvitation ? "Complete Registration" : "Sign Up"}
                    </Button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-primary hover:underline">
                                Log In
                            </Link>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Need to verify your account?{" "}
                            <button
                                type="button"
                                onClick={toggleForm}
                                className="text-primary hover:underline"
                            >
                                Verify Account
                            </button>
                        </p>
                    </div>
                </form>
            </Form>
        </>
    );
};

export default SignupForm;