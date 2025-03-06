"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card"
import { useAppSelector } from "../../../../state/redux"
import VerificationForm from "./verificationform"
import { decrypt } from "../../../../lib/utils"
import SignupForm from "./signupform"

const SignupPage = ({ params }: { params: Promise<{ id: string }> }) => {

    const [isInvitation, setIsInvitation] = useState(false)
    const [invitationData, setInvitationData] = useState<{
        token: string
        role: string
        inviterId: string
        email: string
    } | null>(null)

    // Unwrap the params Promise using React.use()
    const unwrappedParams = use(params)

    // Process invitation data if it exists
    useEffect(() => {
        if (unwrappedParams.id) {
            try {
                const decodedId = decodeURIComponent(unwrappedParams.id)
                const decryptedData = decrypt(decodedId)
                const parsedData = JSON.parse(decryptedData)

                if (parsedData.token && parsedData.email) {
                    setIsInvitation(true)
                    setInvitationData({
                        token: parsedData.token,
                        role: parsedData.role || "CLIENT",
                        inviterId: parsedData.inviterId || "",
                        email: parsedData.email,
                    })
                }
            } catch (error) {
                console.error("Error processing invitation data:", error)
            }
        }
    }, [unwrappedParams.id])

    const { isVerificationStep, error } = useAppSelector((state) => state.auth)
    const [showVerification, setShowVerification] = useState(false)
    const [emailForVerification, setEmailForVerification] = useState("")
    const [usernameForVerification, setUsernameForVerification] = useState("")

    useEffect(() => {
        // Check if error message indicates user exists but needs verification
        if (error && (error.includes("User already exists") || error.includes("UsernameExistsException"))) {
            setShowVerification(true)
            // Extract email from error message if possible
            const emailMatch = error.match(/email\s+([^\s]+)/i) || error.match(/username:\s*([^\s,]+)/i)
            if (emailMatch && emailMatch[1]) {
                setEmailForVerification(emailMatch[1])
                setUsernameForVerification(emailMatch[1])
            }
        } else {
            setShowVerification(isVerificationStep)
        }
    }, [error, isVerificationStep])

    const toggleVerificationForm = () => {
        setShowVerification(!showVerification)
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md m-20">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-left">Sign Up</CardTitle>
                    <CardDescription className="text-left">
                        {isInvitation
                            ? `Complete your registration for ${invitationData?.email}`
                            : "Create an account to get started..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {showVerification ? (
                        <VerificationForm
                            emailProp={emailForVerification}
                            usernameProp={usernameForVerification}
                            toggleForm={toggleVerificationForm}
                        />
                    ) : (
                        <SignupForm
                            setEmailForVerification={setEmailForVerification}
                            setUsernameForVerification={setUsernameForVerification}
                            toggleForm={toggleVerificationForm}
                            invitationData={invitationData}
                            isInvitation={isInvitation}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default SignupPage

