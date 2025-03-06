"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import {
    useGetUserQuery,
    useGetUserInvitationsQuery,
    useCreateInvitationMutation,
    useCancelInvitationMutation,
    Client,
    useGetInvitationsByEmailQuery,
    useAcceptInvitationMutation
} from "../../state/api";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Bell, MoreHorizontal, Plus, Check, X, Loader } from "lucide-react";
import { Input } from "../../components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";


const DashboardPage = () => {
    const router = useRouter();
    const { data: authUser, isLoading: isUserLoading, error: userError } = useGetUserQuery();
    const { signOut, user } = useAuthenticator((context) => [context.signOut, context.user]);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [newClientEmail, setNewClientEmail] = useState("");
    const [newClientName, setNewClientName] = useState("");
    const [shouldRedirect, setShouldRedirect] = useState(false);

    const [notifications, setNotifications] = useState([]);

    console.log("authUser", authUser);

    const { data: invitations = [], isLoading: isInvitationsLoading } = useGetInvitationsByEmailQuery(
        authUser?.userInfo?.email || '',
        { skip: !authUser?.userInfo?.email }
    );

    console.log("invitations received", invitations);

    // RTK Query hooks
    const { data: clients = [], isLoading: isClientsLoading } = useGetUserInvitationsQuery(
        authUser?.userInfo?.id || '',
        { skip: !authUser?.userInfo?.id }
    );

    console.log("clients", clients);
    const [createInvitation, { isLoading: isCreatingInvitation }] = useCreateInvitationMutation();
    const [cancelInvitation, { isLoading: isCancellingInvitation }] = useCancelInvitationMutation();
    const [acceptInvitation, { isLoading: isAcceptingInvitation }] = useAcceptInvitationMutation();

    // Combined loading state
    const isLoading = isUserLoading || isClientsLoading || isCreatingInvitation || isCancellingInvitation;

    // Display toast if user creation fails
    useEffect(() => {
        if (userError) {
            toast.error(`${userError}`);
            console.log("User error:", userError);
        }
    }, [userError]);

    // Check authentication and set redirect flag
    useEffect(() => {
        if (!user && !isUserLoading) {
            setShouldRedirect(true);
        }
    }, [user, isUserLoading]);

    // Handle redirect in useEffect instead of during render
    useEffect(() => {
        if (shouldRedirect) {
            router.push("/");
        }
    }, [shouldRedirect, router]);

    const handleSignOut = async () => {
        await signOut();
        // Clear any auth headers/tokens
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to sign in page
        router.push("/");
    };

    const handleAddClient = async () => {
        if (newClientEmail && authUser?.userInfo?.id) {
            try {
                await createInvitation({
                    inviterUserId: authUser.userInfo.id,
                    email: newClientEmail,
                    role: "CLIENT", // Assuming client role
                    expirationDays: 7 // Default expiration
                }).unwrap();

                toast.success(`Invitation sent to ${newClientEmail}`);

                // Reset form and close dialog
                setNewClientEmail("");
                setNewClientName("");
                setIsAddClientOpen(false);
            } catch (error: any) {
                toast.error(error.data?.error || "Failed to send invitation");
            }
        }
    };

    const handleSendInvite = async (client: Client) => {
        if (authUser?.userInfo?.id) {
            try {
                // Resend invitation by creating a new one
                await createInvitation({
                    inviterUserId: authUser.userInfo.id,
                    email: client.email,
                    role: "CLIENT",
                    expirationDays: 7
                }).unwrap();

                toast.success(`Invitation resent to ${client.email}`);
            } catch (error: any) {
                toast.error(error.data?.error || "Failed to resend invitation");
            }
        }
    };

    const handleCancelInvitation = async (client: Client) => {
        if (authUser?.userInfo?.id) {
            try {
                await cancelInvitation({
                    invitationId: client.id,
                    userId: authUser.userInfo.id
                }).unwrap();

                toast.success(`Invitation to ${client.email} has been cancelled`);
            } catch (error: any) {
                toast.error(error.data?.error || "Failed to cancel invitation");
            }
        }
    };

    const handleAcceptInvitation = async (invitationId: string) => {
        try {
            await acceptInvitation({
                invitationId,
                userId: authUser?.userInfo?.id || ''
            })
            toast.success("Invitation accepted");
            setIsNotificationsOpen(false);
        } catch (error: any) {
            toast.error(error.data?.error || "Failed to accept invitation");
        }
    };

    const handleRejectInvitation = async (invitationId: string) => {
        // TODO: Implement reject invitation functionality
        toast.success("Invitation rejected");
        setIsNotificationsOpen(false);
    };

    // Return null during loading or if should redirect
    if (shouldRedirect || isUserLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col p-6 gap-6 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Client Dashboard</h1>
                    {authUser?.userInfo && (
                        <>
                            <p className="text-muted-foreground">
                                Welcome, {authUser.cognitoInfo.username} ({authUser.userInfo.email})
                            </p>

                        </>

                    )}
                </div>
                <div className="flex gap-2 relative">

                    <Button
                        size={"icon"}
                        variant={"secondary"}
                        onClick={() => setIsNotificationsOpen(true)}
                    >
                        <Bell className="h-4 w-4 " />
                        {invitations.length > 0 && (
                            <span className="absolute left-6 -top-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                {invitations.length}
                            </span>
                        )}
                    </Button>
                    <Button onClick={handleSignOut} variant="secondary">Sign Out</Button>
                </div>
            </div>

            <div>
                <p className="text-md text-muted-foreground ">
                    {authUser?.userInfo?.role === "SOFTWARE_OWNER"
                        ? "SOFTWARE OWNER: You own the place and can invite clients"
                        : `You are a ${authUser?.userInfo?.role} and you were invited by ID ${authUser?.userInfo?.invitedById}`}
                </p>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Clients</h2>
                <Button onClick={() => setIsAddClientOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isClientsLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    <div className="flex justify-center items-center">
                                        <Loader className="h-5 w-5 animate-spin mr-2" />
                                        Loading clients...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No clients yet. Add your first client to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client: any) => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.name || "USER"} {client.role === "CLIENT" && <span className="text-xs text-muted-foreground">({client.role})</span>}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full font-semibold text-xs ${client.status === "Active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                            }`}>
                                            {client.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleSendInvite(client)}>
                                                    {isCreatingInvitation ? (
                                                        <>
                                                            <Loader className="h-3 w-3 animate-spin mr-2" />
                                                            Sending...
                                                        </>
                                                    ) : "Resend Invite"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCancelInvitation(client)}>
                                                    {isCancellingInvitation ? (
                                                        <>
                                                            <Loader className="h-3 w-3 animate-spin mr-2" />
                                                            Cancelling...
                                                        </>
                                                    ) : "Cancel Invitation"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={newClientEmail}
                                onChange={(e) => setNewClientEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="client@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddClient}
                            disabled={!newClientEmail || isLoading}
                        >
                            {isCreatingInvitation ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin mr-2" />
                                    Sending...
                                </>
                            ) : "Send Invite"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Notifications</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        {isInvitationsLoading ? (
                            <div className="flex justify-center items-center py-6">
                                <Loader className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">Loading notifications...</p>
                            </div>
                        ) : invitations.length === 0 ? (
                            <p className="text-center text-muted-foreground">You have no new notifications.</p>
                        ) : (
                            <div className="space-y-4">
                                {invitations.map((invitation: any) => (
                                    <div key={invitation.id} className="border rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-medium text-sm">Invitation from {invitation.inviter?.firstName || invitation.inviter?.email}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(invitation.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                {invitation.status}
                                            </span>
                                        </div>
                                        <p className="text-sm mb-3">
                                            You have been invited to join the AI Care Manager as a {invitation.role}.
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRejectInvitation(invitation.id)}
                                                className="flex items-center"
                                            >
                                                <X className="h-4 w-4 mr-1" /> Decline
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAcceptInvitation(invitation.id)}
                                                className="flex items-center"
                                                disabled={isAcceptingInvitation}
                                            >
                                                {isAcceptingInvitation ? (
                                                    <>
                                                        <Loader className="h-4 w-4 animate-spin mr-1" /> Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" /> Accept
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsNotificationsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardPage;