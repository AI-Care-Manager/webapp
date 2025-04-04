"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { UserActionsMenu } from "./users-actions-menu"
import type { User } from "@/types/prismaTypes"
// import { useDeleteUserMutation } from "@/state/api"

interface UserTableUserProps {
    users: User[]
    isLoading: boolean
}

export function UserTableUser({ users, isLoading }: UserTableUserProps) {
    //   const [deleteUser] = useDeleteUserMutation()

    // Handle user deletion
    const handleDeleteUser = async (userId: string) => {
        try {
            //   await deleteUser(userId)
            return Promise.resolve()
        } catch (error) {
            return Promise.reject(error)
        }
    }

    // Get status badge color
    const getStatusBadge = (status?: string) => {
        if (!status) return null

        switch (status.toLowerCase()) {
            case "active":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Active</Badge>
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Inactive</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">Pending</Badge>
            default:
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">{status}</Badge>
        }
    }

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString()
    }

    // Get initials for avatar
    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName && !lastName) return "??"
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
    }

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">No users found</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subrole</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profile?.avatarUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </div>
                                        {user.role === "CLIENT" && user.clientId && (
                                            <div className="text-xs text-muted-foreground">ID: {user.clientId.substring(0, 8)}</div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{getStatusBadge(user.status || "Active")}</TableCell>
                            <TableCell>
                                {user.subRole ? (
                                    <span className="text-sm">{user.subRole.replace(/_/g, " ")}</span>
                                ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                )}
                            </TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                                <UserActionsMenu user={user} onDeleteUser={handleDeleteUser} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

