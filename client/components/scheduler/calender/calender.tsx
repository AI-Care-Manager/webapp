"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import moment from "moment"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useMediaQuery } from "../../../hooks/use-mobile"
import { useTheme } from "next-themes"
import { CalendarIcon, Moon, PlusCircle, PlusIcon, Sun } from "lucide-react"
import { Button } from "../../ui/button"
import type { AppointmentEvent } from "./types"
import { useGetSchedulesQuery } from "../../../state/api"
import { setEvents } from "../../../state/slices/userSlice"
import { setClients, setCareWorkers, setOfficeStaff, setSidebarMode } from "../../../state/slices/userSlice"
import { useAppSelector, useAppDispatch } from "../../../state/redux"
import { setActiveView, setCurrentDate } from "../../../state/slices/calendarSlice"

import { CalendarHeader } from "./calender-header"
import { AppointmentForm } from "../appointment-form"

import { CustomCalendar } from "./custom-calender"
import type { CalendarProps, StaffMember, Client, SidebarMode } from "./types"
import { CalendarSidebar } from "./calender-sidebar"
import { getRandomColor } from "./calender-utils"

// Helper function to deserialize an event
function deserializeEvent(event: any) {
    return {
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        date: new Date(event.date),
    }
}

export function Calendar({ view, onEventSelect, dateRange }: CalendarProps) {
    const dispatch = useAppDispatch()
    const { activeView, currentDate: currentDateStr } = useAppSelector((state) => state.calendar)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<AppointmentEvent | null>(null)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const calendarRef = useRef<HTMLDivElement>(null)
    const { theme, setTheme } = useTheme()
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Get data from Redux store
    const {
        officeStaff,
        careWorkers,
        clients,
        events,
        filteredEvents,
        sidebarMode,
        loading: isLoading,
    } = useAppSelector((state) => state.user)

    // Get user info from Redux store
    const { user } = useAppSelector((state) => state.user)

    // Convert currentDate string to Date object
    const currentDate = useMemo(() => {
        const date = new Date(currentDateStr)
        return isNaN(date.getTime()) ? new Date() : date
    }, [currentDateStr])

    // Deserialize events for the calendar
    const deserializedEvents = useMemo(() => {
        return events.map(deserializeEvent)
    }, [events])

    const deserializedFilteredEvents = useMemo(() => {
        return filteredEvents.map(deserializeEvent)
    }, [filteredEvents])

    // Fetch schedules using the API hook
    const { data: schedulesData, isLoading: isSchedulesLoading } = useGetSchedulesQuery({
        agencyId: user?.userInfo?.agencyId,
        startDate: moment(currentDate).startOf(activeView).toISOString(),
        endDate: moment(currentDate).endOf(activeView).toISOString(),
    }, {
        skip: !user?.userInfo?.agencyId,
    })

    // Debug logs
    useEffect(() => {
        console.log('User:', user)
        console.log('Agency ID:', user?.userInfo?.agencyId)
        console.log('Schedules Data:', schedulesData)
        console.log('Events:', events)
        console.log('Filtered Events:', filteredEvents)
    }, [user, schedulesData, events, filteredEvents])

    // Update events in Redux when schedules data changes
    useEffect(() => {
        if (schedulesData?.data) {
            console.log('Raw schedules data:', JSON.stringify(schedulesData.data, null, 2));
            // Transform ScheduleResponse to AppointmentEvent
            const transformedEvents: AppointmentEvent[] = schedulesData.data
                .map(schedule => {
                    try {
                        // Helper function to safely create and serialize dates
                        const createDate = (dateStr: string | Date, timeStr?: string): string => {
                            try {
                                let date: Date;

                                // If we have a time string, combine it with the date
                                if (timeStr) {
                                    const [hours, minutes] = timeStr.split(':').map(Number);
                                    date = new Date(dateStr);
                                    date.setHours(hours, minutes, 0, 0);
                                } else {
                                    date = new Date(dateStr);
                                }

                                // Check if the date is valid
                                if (isNaN(date.getTime())) {
                                    console.warn('Invalid date string received:', dateStr);
                                    return new Date().toISOString();
                                }

                                return date.toISOString();
                            } catch (error) {
                                console.warn('Error creating date from:', dateStr, error);
                                return new Date().toISOString();
                            }
                        };

                        // Create base event with required fields
                        const event: AppointmentEvent = {
                            id: schedule.id,
                            title: `${schedule.client?.firstName || 'Client'} with ${schedule.careWorker?.firstName || 'Care Worker'}`,
                            // Use the date and time strings to create proper ISO dates
                            start: createDate(schedule.date, schedule.startTime),
                            end: createDate(schedule.date, schedule.endTime),
                            date: createDate(schedule.date),
                            startTime: schedule.startTime || "00:00",
                            endTime: schedule.endTime || "00:00",
                            resourceId: schedule.resourceId,
                            clientId: schedule.clientId,
                            type: schedule.type || "APPOINTMENT",
                            status: schedule.status || "PENDING",
                            notes: schedule.notes || "",
                            color: schedule.color || getRandomColor(schedule.type),
                            careWorker: schedule.careWorker || {},
                            client: schedule.client || {},
                        };

                        // Ensure all required fields are present
                        if (!event.id || !event.start || !event.end || !event.date) {
                            console.warn('Missing required fields in event:', event);
                            return null;
                        }

                        console.log('Transformed event:', JSON.stringify(event, null, 2));
                        return event;
                    } catch (error) {
                        console.error('Error transforming schedule:', error);
                        return null;
                    }
                })
                .filter((event): event is AppointmentEvent => event !== null);

            console.log('All transformed events:', JSON.stringify(transformedEvents, null, 2));
            dispatch(setEvents(transformedEvents));
        }
    }, [schedulesData, dispatch])

    // Update schedule fetch when view or date changes
    useEffect(() => {
        // This will trigger a refetch of schedules when the view or date changes
        if (user?.userInfo?.agencyId) {
            const startDate = moment(currentDate).startOf(activeView).toISOString()
            const endDate = moment(currentDate).endOf(activeView).toISOString()
            console.log('Fetching schedules for:', { startDate, endDate, view: activeView })
        }
    }, [currentDate, activeView, user?.userInfo?.agencyId])

    // Format staff members for the calendar
    const careWorkerMembers: StaffMember[] = useMemo(() => {
        return careWorkers.map((staff) => ({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: staff.role || "CARE_WORKER",
            color: staff.color || getRandomColor(staff.id),
            avatar: staff.profile?.avatarUrl || "",
            selected: true,
        }))
    }, [careWorkers])

    const officeStaffMembers: StaffMember[] = useMemo(() => {
        return officeStaff.map((staff) => ({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: staff.role || "OFFICE_STAFF",
            color: staff.color || getRandomColor(staff.id),
            avatar: staff.profile?.avatarUrl || "",
            selected: true,
        }))
    }, [officeStaff])

    // Format clients for the calendar
    const formattedClients: Client[] = useMemo(() => {
        return clients.map((client) => ({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            color: client.color || getRandomColor(client.id),
            avatar: client.profile?.avatarUrl || "",
            selected: true,
        }))
    }, [clients])

    // Handle toggle functions directly in the Calendar component
    const handleToggleCareWorkerSelection = (staffId: string) => {
        const updatedCareWorkers = careWorkers.map((worker) => ({
            ...worker,
            selected: worker.id === staffId ? !worker.selected : worker.selected,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleToggleOfficeStaffSelection = (staffId: string) => {
        const updatedOfficeStaff = officeStaff.map((staff) => ({
            ...staff,
            selected: staff.id === staffId ? !staff.selected : staff.selected,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleToggleClientSelection = (clientId: string) => {
        const updatedClients = clients.map((client) => ({
            ...client,
            selected: client.id === clientId ? !client.selected : client.selected,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleSelectAllCareWorkers = () => {
        const updatedCareWorkers = careWorkers.map((worker) => ({
            ...worker,
            selected: true,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleDeselectAllCareWorkers = () => {
        const updatedCareWorkers = careWorkers.map((worker) => ({
            ...worker,
            selected: false,
        }))
        dispatch(setCareWorkers(updatedCareWorkers))
    }

    const handleSelectAllOfficeStaff = () => {
        const updatedOfficeStaff = officeStaff.map((staff) => ({
            ...staff,
            selected: true,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleDeselectAllOfficeStaff = () => {
        const updatedOfficeStaff = officeStaff.map((staff) => ({
            ...staff,
            selected: false,
        }))
        dispatch(setOfficeStaff(updatedOfficeStaff))
    }

    const handleSelectAllClients = () => {
        const updatedClients = clients.map((client) => ({
            ...client,
            selected: true,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleDeselectAllClients = () => {
        const updatedClients = clients.map((client) => ({
            ...client,
            selected: false,
        }))
        dispatch(setClients(updatedClients))
    }

    const handleSetSidebarMode = (mode: SidebarMode) => {
        dispatch(setSidebarMode(mode))
    }

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen)
        if (!isSearchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
        if (isSearchOpen) {
            setSearchQuery("")
        }
    }

    // Media queries for responsive design
    const isMobile = useMediaQuery("(max-width: 768px)")

    // Format the date range for display
    const formatDateRange = () => {
        if (activeView === "day") {
            return moment(currentDate).format("MMM D, YYYY")
        } else if (activeView === "week") {
            const startDate = moment(currentDate).startOf("week").format("MMM D")
            const endDate = moment(currentDate).endOf("week").format("MMM D, YYYY")
            return `${startDate} - ${endDate}`
        } else {
            return moment(currentDate).format("MMMM YYYY")
        }
    }

    // Handle navigation
    const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
        let newDate

        if (action === "PREV") {
            if (activeView === "day") {
                newDate = moment(currentDate).subtract(1, "day").toDate()
            } else if (activeView === "week") {
                newDate = moment(currentDate).subtract(1, "week").toDate()
            } else {
                newDate = moment(currentDate).subtract(1, "month").toDate()
            }
        } else if (action === "NEXT") {
            if (activeView === "day") {
                newDate = moment(currentDate).add(1, "day").toDate()
            } else if (activeView === "week") {
                newDate = moment(currentDate).add(1, "week").toDate()
            } else {
                newDate = moment(currentDate).add(1, "month").toDate()
            }
        } else {
            newDate = new Date()
        }

        dispatch(setCurrentDate(newDate.toISOString()))
    }

    // Handle view change
    const handleViewChange = (newView: "day" | "week" | "month") => {
        dispatch(setActiveView(newView))
    }

    // Handle date change
    const handleDateChange = (date: Date) => {
        if (date instanceof Date && !isNaN(date.getTime())) {
            dispatch(setCurrentDate(date.toISOString()))
        }
    }

    const handleEventSelect = (event: any) => {
        // If this is a slot selection (new event), create a default event
        if (!event.id) {
            const defaultEvent = {
                start: new Date(event.start),
                end: new Date(event.end),
                date: new Date(event.start),
                startTime: format(new Date(event.start), "HH:mm"),
                endTime: format(new Date(event.end), "HH:mm"),
                type: "APPOINTMENT",
                status: "PENDING",
                notes: "",
            }
            setEditingEvent(defaultEvent as any)
        } else {
            // For existing events, ensure all required fields are present
            const formattedEvent = {
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
                date: new Date(event.date),
                startTime: event.startTime || format(new Date(event.start), "HH:mm"),
                endTime: event.endTime || format(new Date(event.end), "HH:mm"),
            }
            setEditingEvent(formattedEvent)
        }
        setIsFormOpen(true)
        if (onEventSelect && event.id) {
            onEventSelect(event)
        }
    }

    // Handle event updates from drag operations
    const handleEventUpdate = (updatedEvent: any) => {
        // In a real app, you would update the event in your database
        console.log("Event updated:", updatedEvent)
    }

    // Handle form close with refresh
    const handleFormClose = () => {
        setIsFormOpen(false)
        setEditingEvent(null)
        // Refresh data would be handled by Redux
    }

    // Create a new appointment
    const handleCreateAppointment = () => {
        // Create a default event with the current date
        const defaultEvent = {
            start: new Date(currentDate),
            end: new Date(new Date(currentDate).setHours(currentDate.getHours() + 1)),
            date: currentDate,
        }
        setEditingEvent(defaultEvent as any)
        setIsFormOpen(true)
    }

    // Check if we have any data
    const hasNoData = !isSchedulesLoading && !events.length && !filteredEvents.length

    const isDark = theme === "dark"

    return (
        <div className={`flex flex-col h-full w-full relative ${isDark ? "dark-theme" : ""}`}>
            {/* Dark mode background with improved gradient */}
            {isDark && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 opacity-90"></div>
                    <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-green-500/10 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-purple-500/10 blur-3xl rounded-full"></div>
                </div>
            )}

            {/* Header with improved spacing and visual hierarchy */}



            {/* Main content area with improved layout */}
            <div className="flex flex-1 h-full relative z-10 gap-3 overflow-hidden">
                {/* Main calendar area with improved styling */}
                <div
                    className={`${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} border rounded-lg overflow-hidden transition-all duration-200 ease-in-out flex-1`}
                >
                    {hasNoData ? (
                        <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
                            <div className="text-center max-w-md">
                                <div
                                    className={`w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                                >
                                    <CalendarIcon className={`h-6 w-6 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                                </div>
                                <h3 className={`text-xl font-semibold mb-3 ${isDark ? "text-white" : "text-slate-800"}`}>
                                    Create a schedule
                                </h3>
                                <p className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                    You don't have any appointments scheduled. Create your first appointment to get started.
                                </p>
                                <Button
                                    onClick={handleCreateAppointment}
                                    className="mx-auto"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Create Appointment
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <CustomCalendar
                            events={deserializedFilteredEvents}
                            currentDate={currentDate}
                            activeView={activeView}
                            onSelectEvent={handleEventSelect}
                            onEventUpdate={handleEventUpdate}
                            onNavigate={handleDateChange}
                            isLoading={isSchedulesLoading}
                            staffMembers={[...careWorkers, ...officeStaff]}
                            isMobile={isMobile}
                            sidebarMode={sidebarMode}
                            clients={clients}
                            spaceTheme={theme === "dark"}
                        />
                    )}
                </div>
            </div>

            {/* Mobile floating action button for creating appointments */}
            {isMobile && (
                <Button
                    onClick={handleCreateAppointment}
                    size="icon"
                    className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20 ${isDark ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                >
                    <PlusCircle className="h-6 w-6" />
                    <span className="sr-only">New Appointment</span>
                </Button>
            )}

            {/* Appointment form dialog with improved styling */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent
                    className={`${isDark ? "bg-slate-900 border-slate-800 text-white" : ""} max-w-lg w-full max-h-[90vh] overflow-auto`}
                >
                    <VisuallyHidden>
                        <DialogTitle>{editingEvent?.id ? "Edit Appointment" : "New Appointment"}</DialogTitle>
                    </VisuallyHidden>
                    <AppointmentForm
                        isOpen={true}
                        onClose={handleFormClose}
                        event={editingEvent}
                        isNew={!editingEvent?.id}

                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

