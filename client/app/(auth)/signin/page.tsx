"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { useAppSelector } from "../../../state/redux";
import ResetPasswordForm from "./resetpasswordform";
import SigninForm from "./signinform";

const SigninPage = () => {
    const { isPasswordReset } = useAppSelector((state) => state.auth);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [usernameForReset, setUsernameForReset] = useState("");

    // Reset the password reset form when isPasswordReset changes
    React.useEffect(() => {
        if (isPasswordReset) {
            setShowResetPassword(true);
        }
    }, [isPasswordReset]);

    const toggleResetPasswordForm = () => {
        setShowResetPassword(!showResetPassword);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                    <CardDescription className="text-center">Login to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    {showResetPassword ? (
                        <ResetPasswordForm
                            usernameProp={usernameForReset}
                            toggleForm={toggleResetPasswordForm}
                        />
                    ) : (
                        <SigninForm
                            setUsernameForReset={setUsernameForReset}
                            toggleForm={toggleResetPasswordForm}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SigninPage;