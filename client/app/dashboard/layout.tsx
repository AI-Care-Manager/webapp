"use client";

import { usePathname } from "next/navigation"
import { SidebarProvider } from "../../components/ui/sidebar"
import { SidebarLeft } from "../../components/sidebar/sidebar-left"
import { SidebarInset } from "../../components/ui/sidebar"
import { SidebarRight } from "../../components/sidebar/sidebar-right"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "../../components/ui/breadcrumb"
import { Separator } from "../../components/ui/separator"
import { SidebarTrigger } from "../../components/ui/sidebar"
import { ReactNode, useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "../../state/redux";
import { setUser, setOfficeStaff, setCareWorkers, setClients, setSidebarMode } from "../../state/slices/userSlice";
import { setCurrentDate, setActiveView } from "../../state/slices/calendarSlice";
import { useGetUserQuery, useGetAgencyUsersQuery } from "../../state/api";
import { redirect } from "next/navigation"
import * as React from "react"
import type { SidebarMode } from "../../components/scheduler/calender/types"

interface DashboardLayoutProps {
    children: ReactNode
    params: {
        id: string
    }
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
    const pathname = usePathname()
    const dispatch = useAppDispatch()
    const { user, careWorkers, clients, officeStaff, sidebarMode } = useAppSelector((state) => state.user)
    const { activeView, currentDate: currentDateStr } = useAppSelector((state) => state.calendar)
    const { data: userInformation } = useGetUserQuery()
    const { data: agencyUsers } = useGetAgencyUsersQuery(userInformation?.userInfo?.agencyId || "")
    const isSchedulePage = pathname === "/dashboard/schedule"

    const [isLoading, setIsLoading] = useState(true)
    const currentDate = useMemo(() => {
        const date = new Date(currentDateStr)
        return isNaN(date.getTime()) ? new Date() : date
    }, [currentDateStr])

    useEffect(() => {
        if (userInformation) {
            dispatch(setUser(userInformation))
            setIsLoading(false)
        }
    }, [userInformation, dispatch])

    useEffect(() => {
        if (agencyUsers?.data) {
            const careWorkers = agencyUsers.data.filter((user: any) => user.role === "CARE_WORKER")
            const officeStaff = agencyUsers.data.filter((user: any) => user.role === "OFFICE_STAFF")
            const clients = agencyUsers.data.filter((user: any) => user.role === "CLIENT")

            dispatch(setCareWorkers(careWorkers))
            dispatch(setOfficeStaff(officeStaff))
            dispatch(setClients(clients))
        }
    }, [agencyUsers, dispatch])

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    if (!user) {
        redirect("/login")
    }

    // Get breadcrumb items based on current path
    const getBreadcrumbItems = () => {
        const paths = pathname?.split("/").filter(Boolean) || []
        const items = []

        // Always show Dashboard as first item
        items.push({
            title: "Dashboard",
            href: "/dashboard",
            isCurrent: paths.length === 1
        })

        // Add other path segments
        let currentPath = "/dashboard"
        for (let i = 1; i < paths.length; i++) {
            currentPath += `/${paths[i]}`
            const title = paths[i].charAt(0).toUpperCase() + paths[i].slice(1)
            items.push({
                title,
                href: currentPath,
                isCurrent: i === paths.length - 1
            })
        }

        return items
    }

    // Handle toggle functions
    const handleToggleCareWorkerSelection = (staffId: string) => {
        const updatedCareWorkers = careWorkers.map((worker: any) => ({
            ...worker,
            selected: worker.id === staffId ? !worker.selected : worker.selected,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleToggleOfficeStaffSelection = (staffId: string) => {
        const updatedOfficeStaff = officeStaff.map((staff: any) => ({
            ...staff,
            selected: staff.id === staffId ? !staff.selected : staff.selected,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleToggleClientSelection = (clientId: string) => {
        const updatedClients = clients.map((client: any) => ({
            ...client,
            selected: client.id === clientId ? !client.selected : client.selected,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleSelectAllCareWorkers = () => {
        const updatedCareWorkers = careWorkers.map((worker: any) => ({
            ...worker,
            selected: true,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleDeselectAllCareWorkers = () => {
        const updatedCareWorkers = careWorkers.map((worker: any) => ({
            ...worker,
            selected: false,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleSelectAllOfficeStaff = () => {
        const updatedOfficeStaff = officeStaff.map((staff: any) => ({
            ...staff,
            selected: true,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleDeselectAllOfficeStaff = () => {
        const updatedOfficeStaff = officeStaff.map((staff: any) => ({
            ...staff,
            selected: false,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleSelectAllClients = () => {
        const updatedClients = clients.map((client: any) => ({
            ...client,
            selected: true,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleDeselectAllClients = () => {
        const updatedClients = clients.map((client: any) => ({
            ...client,
            selected: false,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleSetSidebarMode = (mode: SidebarMode) => {
        dispatch(setSidebarMode(mode))
    }

    const handleViewChange = (view: "day" | "week" | "month") => {
        dispatch(setActiveView(view))
    }

    const handleDateChange = (date: Date) => {
        // Ensure we're passing a valid Date object
        if (date instanceof Date && !isNaN(date.getTime())) {
            dispatch(setCurrentDate(date.toISOString()))
        }
    }

    return (
        <SidebarProvider className="flex h-screen">
            <div className="flex h-full w-full">
                <div className="flex h-full">
                    <SidebarLeft />
                    <SidebarInset />
                </div>
                <main className="flex-1 overflow-y-auto">
                    <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
                        <div className="flex flex-1 items-center gap-2 px-3">
                            <SidebarTrigger />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {getBreadcrumbItems().map((item, index) => (
                                        <React.Fragment key={item.href}>
                                            <BreadcrumbItem>
                                                {item.isCurrent ? (
                                                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {index < getBreadcrumbItems().length - 1 && <BreadcrumbSeparator />}
                                        </React.Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        {children}
                    </div>
                </main>
                {isSchedulePage && (
                    <SidebarRight
                        sidebarMode={sidebarMode}
                        careWorkers={careWorkers}
                        officeStaff={officeStaff}
                        clients={clients}
                        toggleCareWorkerSelection={handleToggleCareWorkerSelection}
                        toggleOfficeStaffSelection={handleToggleOfficeStaffSelection}
                        toggleClientSelection={handleToggleClientSelection}
                        selectAllCareWorkers={handleSelectAllCareWorkers}
                        deselectAllCareWorkers={handleDeselectAllCareWorkers}
                        selectAllOfficeStaff={handleSelectAllOfficeStaff}
                        deselectAllOfficeStaff={handleDeselectAllOfficeStaff}
                        selectAllClients={handleSelectAllClients}
                        deselectAllClients={handleDeselectAllClients}
                        setSidebarMode={handleSetSidebarMode}
                        currentDate={currentDate}
                        onDateChange={handleDateChange}
                        onViewChange={handleViewChange}
                        viewMode={activeView}
                    />
                )}
            </div>
        </SidebarProvider>
    )
}
