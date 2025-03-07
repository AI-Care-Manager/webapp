import { Loader } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { MoreHorizontal, Check, X } from "lucide-react";

export const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
);


// Components

export const AddUserDialog = ({ isOpen, setIsOpen, onAddUser, isLoading, userType }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void, onAddUser: (email: string, userType: string) => void, isLoading: boolean, userType: string }) => {
    const [email, setEmail] = useState("");
    const userTypeTitle = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();

    const handleAddUser = () => {
        onAddUser(email, userType);
        setEmail("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New {userTypeTitle}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3"
                            placeholder={`${userTypeTitle.toLowerCase()}@example.com`}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        disabled={!email || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : "Send Invite"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const NotificationsDialog = ({
    isOpen,
    setIsOpen,
    invitations,
    isLoading,
    onAccept,
    onReject,
    isAcceptingInvitation
}: {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    invitations: any[],
    isLoading: boolean,
    onAccept: (invitationId: string) => void,
    onReject: (invitationId: string) => void,
    isAcceptingInvitation: boolean
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-6">
                            <Loader className="h-5 w-5 animate-spin mr-2" />
                            <p className="text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : invitations.length === 0 ? (
                        <p className="text-center text-muted-foreground">You have no new notifications.</p>
                    ) : (
                        <div className="space-y-4">
                            {invitations.map((invitation) => (
                                <div key={invitation.id} className="border rounded-lg p-4">
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
                                            onClick={() => onReject(invitation.id)}
                                            className="flex items-center"
                                        >
                                            <X className="h-4 w-4 mr-1" /> Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => onAccept(invitation.id)}
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
                    <Button onClick={() => setIsOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const UsersTable = ({ users, isLoading, onSendInvite, onCancelInvitation, isCreatingInvitation, isCancellingInvitation, userType }: { users: any[], isLoading: boolean, onSendInvite: (user: any) => void, onCancelInvitation: (user: any) => void, isCreatingInvitation: boolean, isCancellingInvitation: boolean, userType: string }) => {
    // Filter users by role if needed
    const filteredUsers = users.filter(user => {
        if (userType === "CLIENT") return user.role === "CLIENT";
        if (userType === "CARE_WORKER") return user.role === "CARE_WORKER";
        if (userType === "OFFICE_STAFF") return user.role === "OFFICE_STAFF";
        return true;
    });

    return (
        <Card className="m-10">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>

                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    <div className="flex justify-center items-center">
                                        <Loader className="h-5 w-5 animate-spin mr-2" />
                                        Loading users...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No {userType.toLowerCase().replace('_', ' ')}s yet. Add your first one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>

                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full font-semibold text-xs ${user.status === "Active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                            }`}>
                                            {user.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                                                <DropdownMenuItem onClick={() => onSendInvite(user)}>
                                                    {isCreatingInvitation ? (
                                                        <>
                                                            <Loader className="h-3 w-3 animate-spin mr-2" />
                                                            Sending...
                                                        </>
                                                    ) : "Resend Invite"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onCancelInvitation(user)}>
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
            </CardContent>
        </Card>
    );
};