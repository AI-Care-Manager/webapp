"use client"

import type React from "react"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { format, addMonths, subMonths, setHours, setMinutes, isBefore, isAfter } from "date-fns"
import { cn } from "../../lib/utils"

import { useState, useEffect, useRef, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../../components/ui/form"

import { useCreateScheduleMutation, useUpdateScheduleMutation, ScheduleInput } from "../../state/api"
import { useAppSelector } from "../../state/redux"

const formSchema = z.object({
    agencyId: z.string({
        required_error: "Agency ID is required",
    }),
    clientId: z.string({
        required_error: "Please select a client",
    }),
    userId: z.string({
        required_error: "Please select a staff member",
    }),
    date: z.date({
        required_error: "Please select a date",
    }),
    startTime: z.string({
        required_error: "Please select a start time",
    }),
    endTime: z.string({
        required_error: "Please select an end time",
    }),
    type: z.enum(["WEEKLY_CHECKUP", "APPOINTMENT", "HOME_VISIT", "OTHER"], {
        required_error: "Please select an appointment type",
    }),
    status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"], {
        required_error: "Please select a status",
    }),
    notes: z.string().optional(),
    chargeRate: z
        .number()
        .min(25, "Charge rate must be at least 25 CAD")
        .max(50, "Charge rate must not exceed 50 CAD")
        .default(25),
})

type FormValues = z.infer<typeof formSchema>

interface AppointmentFormProps {
    isOpen: boolean
    onClose: () => void
    event?: any
    isNew?: boolean
    spaceTheme?: boolean
}

// Generate time options in 10-minute intervals
const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
            const hourStr = hour.toString().padStart(2, "0")
            const minuteStr = minute.toString().padStart(2, "0")
            const time = `${hourStr}:${minuteStr}`
            const label = format(setMinutes(setHours(new Date(), hour), minute), "h:mm a")
            options.push({ value: time, label })
        }
    }
    return options
}

// Generate charge rate options in intervals of 5
const generateChargeRateOptions = () => {
    const options = []
    for (let rate = 25; rate <= 50; rate += 5) {
        options.push({ value: rate, label: `${rate} CAD` })
    }
    return options
}

export function AppointmentForm({ isOpen, onClose, event, isNew = false, spaceTheme = false }: AppointmentFormProps) {
    const [clients, setClients] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [availableStaff, setAvailableStaff] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [calendarOpen, setCalendarOpen] = useState(false)
    const allTimeOptions = useMemo(() => generateTimeOptions(), [])
    const [availableEndTimes, setAvailableEndTimes] = useState(allTimeOptions)
    const chargeRateOptions = useMemo(() => generateChargeRateOptions(), [])
    const calendarRef = useRef<HTMLDivElement>(null)

    // Get agency ID from auth state
    const { userInfo } = useAppSelector((state) => state.auth)
    const agencyId = userInfo?.agencyId || ""

    // RTK Query hooks for creating and updating schedules
    const [createSchedule] = useCreateScheduleMutation()
    const [updateSchedule] = useUpdateScheduleMutation()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            agencyId,
            clientId: "",
            userId: "",
            date: new Date(),
            startTime: "09:00",
            endTime: "10:00",
            type: "APPOINTMENT",
            status: "PENDING",
            notes: "",
            chargeRate: 25,
        },
    })

    // Update available end times when start time changes
    useEffect(() => {
        const startTime = form.watch("startTime")
        if (startTime) {
            const [startHour, startMinute] = startTime.split(":").map(Number)
            const startDate = setMinutes(setHours(new Date(), startHour), startMinute)

            // Filter end times to only show times after the start time
            const filteredEndTimes = allTimeOptions.filter((option) => {
                const [endHour, endMinute] = option.value.split(":").map(Number)
                const endDate = setMinutes(setHours(new Date(), endHour), endMinute)
                return isAfter(endDate, startDate)
            })

            setAvailableEndTimes(filteredEndTimes)

            // If current end time is before start time, update it
            const currentEndTime = form.watch("endTime")
            if (currentEndTime) {
                const [endHour, endMinute] = currentEndTime.split(":").map(Number)
                const endDate = setMinutes(setHours(new Date(), endHour), endMinute)

                if (isBefore(endDate, startDate)) {
                    // Set end time to start time + 1 hour or next available time
                    const nextHour = (startHour + 1) % 24
                    const nextTime = `${nextHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`
                    form.setValue("endTime", nextTime)
                }
            }
        }
    }, [form.watch("startTime"), allTimeOptions, form])

    // Fetch clients and staff when the form opens
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Fetch clients
                const clientsResponse = await fetch(`/api/clients?agencyId=${agencyId}`)
                if (!clientsResponse.ok) throw new Error("Failed to fetch clients")
                const clientsData = await clientsResponse.json()
                setClients(clientsData.data || [])

                // Fetch staff (healthcare workers)
                const staffResponse = await fetch(`/api/users?role=HEALTH_WORKER&agencyId=${agencyId}`)
                if (!staffResponse.ok) throw new Error("Failed to fetch staff")
                const staffData = await staffResponse.json()
                setStaff(staffData.data || [])
                setAvailableStaff(staffData.data || [])

                // Set agency ID from auth state
                form.setValue("agencyId", agencyId)
            } catch (error) {
                console.error("Failed to fetch data:", error)
                toast.error("Failed to load form data")
            } finally {
                setIsLoading(false)
            }
        }

        if (isOpen) {
            fetchData()
        }
    }, [isOpen, agencyId, form])

    // Populate form with event data when editing
    useEffect(() => {
        if (event && !isNew) {
            const startDate = new Date(event.shiftStart || event.start)
            const endDate = new Date(event.shiftEnd || event.end)
            const appointmentDate = new Date(event.date || startDate)

            // Format the charge rate
            const chargeRate = event.chargeRate ? Math.min(Math.max(Math.round(event.chargeRate), 25), 50) : 25

            form.reset({
                agencyId: event.agencyId || agencyId,
                clientId: event.clientId,
                userId: event.userId || event.resourceId,
                date: appointmentDate,
                startTime: format(startDate, "HH:mm"),
                endTime: format(endDate, "HH:mm"),
                type: event.type || "APPOINTMENT",
                status: event.status || "PENDING",
                notes: event.notes || "",
                chargeRate: chargeRate,
            })

            // Set the current month to the event's month
            setCurrentMonth(appointmentDate)
        }
    }, [event, isNew, agencyId, form])

    // Add click outside handler for calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // Update the onSubmit function to handle API integration

    const onSubmit = async (data: FormValues) => {
        try {
            if (data.endTime <= data.startTime) {
                toast.error("End time must be after start time")
                return
            }

            setIsLoading(true)

            // Combine date and time
            const [startHour, startMinute] = data.startTime.split(":").map(Number)
            const [endHour, endMinute] = data.endTime.split(":").map(Number)

            const startDateTime = new Date(data.date)
            startDateTime.setHours(startHour, startMinute)

            const endDateTime = new Date(data.date)
            endDateTime.setHours(endHour, endMinute)

            // Prepare the data for API
            const scheduleData = {
                agencyId: data.agencyId,
                clientId: data.clientId,
                userId: data.userId,
                date: data.date.toISOString(),
                shiftStart: startDateTime.toISOString(),
                shiftEnd: endDateTime.toISOString(),
                status: data.status,
                type: data.type,
                notes: data.notes,
                chargeRate: data.chargeRate,
            }

            if (isNew) {
                // Create new schedule
                await createSchedule(scheduleData).unwrap()
                toast.success("Appointment created successfully")
            } else {
                // Update existing schedule
                await updateSchedule({
                    id: event.id,
                    ...scheduleData,
                }).unwrap()
                toast.success("Appointment updated successfully")
            }

            onClose()
        } catch (error) {
            console.error("Failed to save appointment:", error)
            toast.error(`Failed to ${isNew ? "create" : "update"} appointment`)
        } finally {
            setIsLoading(false)
        }
    }

    const goToPreviousMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentMonth((prevMonth) => subMonths(prevMonth, 1))
    }

    const goToNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))
    }

    const handleDateSelect = (e: React.MouseEvent, newDate: Date) => {
        e.stopPropagation()
        e.preventDefault()
        form.setValue("date", newDate)
        setCalendarOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={`sm:max-w-[600px] ${spaceTheme ? "dark-dialog" : ""}`}>
                <DialogHeader>
                    <DialogTitle>{isNew ? "Create New Appointment" : "Edit Appointment"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value)
                                                // Auto-fill charge rate when client is selected
                                                const selectedClient = clients.find((c) => c.id === value)
                                                if (selectedClient && selectedClient.chargeRate) {
                                                    // Round to nearest 5
                                                    const roundedRate = Math.round(selectedClient.chargeRate / 5) * 5
                                                    // Ensure the charge rate is within the allowed range
                                                    const rate = Math.min(Math.max(roundedRate, 25), 50)
                                                    form.setValue("chargeRate", rate)
                                                }
                                            }}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a client" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {clients.map((client) => (
                                                    <SelectItem key={client.id} value={client.id}>
                                                        {client.firstName} {client.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Care Worker</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a care worker" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableStaff.map((staffMember) => (
                                                    <SelectItem key={staffMember.id} value={staffMember.id}>
                                                        {staffMember.firstName} {staffMember.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-3">
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Date</FormLabel>
                                                <div className="relative">
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCalendarOpen(!calendarOpen)
                                                        }}
                                                        type="button"
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>

                                                    {calendarOpen && (
                                                        <div
                                                            ref={calendarRef}
                                                            className={`absolute top-full left-0 z-50 mt-1 w-[320px] rounded-md border ${spaceTheme ? "bg-slate-900 border-slate-700" : "bg-popover border-border"
                                                                } p-3 shadow-md`}
                                                        >
                                                            <div className="flex items-center justify-between py-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={goToPreviousMonth}
                                                                    type="button"
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </Button>
                                                                <div className="text-center font-medium">{format(currentMonth, "MMMM yyyy")}</div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={goToNextMonth}
                                                                    type="button"
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1 py-2">
                                                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                                                    <div key={day} className="text-center text-sm text-muted-foreground">
                                                                        {day}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1">
                                                                {Array.from({ length: 42 }, (_, i) => {
                                                                    const date = new Date(currentMonth)
                                                                    date.setDate(1)
                                                                    const firstDay = date.getDay()
                                                                    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
                                                                    const daysInPrevMonth = new Date(date.getFullYear(), date.getMonth(), 0).getDate()

                                                                    let day: number
                                                                    let month = date.getMonth()
                                                                    let year = date.getFullYear()
                                                                    let isCurrentMonth = true

                                                                    if (i < firstDay) {
                                                                        // Previous month
                                                                        day = daysInPrevMonth - (firstDay - i - 1)
                                                                        month = month - 1
                                                                        if (month < 0) {
                                                                            month = 11
                                                                            year = year - 1
                                                                        }
                                                                        isCurrentMonth = false
                                                                    } else if (i >= firstDay && i < firstDay + daysInMonth) {
                                                                        // Current month
                                                                        day = i - firstDay + 1
                                                                    } else {
                                                                        // Next month
                                                                        day = i - (firstDay + daysInMonth) + 1
                                                                        month = month + 1
                                                                        if (month > 11) {
                                                                            month = 0
                                                                            year = year + 1
                                                                        }
                                                                        isCurrentMonth = false
                                                                    }

                                                                    const dateToCheck = new Date(year, month, day)
                                                                    const isSelected =
                                                                        field.value &&
                                                                        dateToCheck.getDate() === field.value.getDate() &&
                                                                        dateToCheck.getMonth() === field.value.getMonth() &&
                                                                        dateToCheck.getFullYear() === field.value.getFullYear()

                                                                    const isToday =
                                                                        dateToCheck.getDate() === new Date().getDate() &&
                                                                        dateToCheck.getMonth() === new Date().getMonth() &&
                                                                        dateToCheck.getFullYear() === new Date().getFullYear()

                                                                    return (
                                                                        <Button
                                                                            key={i}
                                                                            variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                                                                            className={cn(
                                                                                "h-9 w-9 p-0 font-normal",
                                                                                !isCurrentMonth && "text-muted-foreground opacity-50",
                                                                                isSelected && "bg-primary text-primary-foreground",
                                                                                isToday && !isSelected && "border border-primary text-primary",
                                                                            )}
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                const newDate = new Date(year, month, day)
                                                                                handleDateSelect(e, newDate)
                                                                            }}
                                                                        >
                                                                            {day}
                                                                        </Button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time From</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select start time" />
                                                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="h-[200px]">
                                                        {allTimeOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Time To</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select end time" />
                                                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="h-[200px]">
                                                        {availableEndTimes.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Visit Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="WEEKLY_CHECKUP">Weekly Checkup</SelectItem>
                                                <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                                                <SelectItem value="HOME_VISIT">Home Visit</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="chargeRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Charge Rate (CAD/hour)</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            defaultValue={field.value?.toString()}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select charge rate" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {chargeRateOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value.toString()}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Range: 25-50 CAD per hour</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELED">Canceled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Add any additional notes here..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormDescription>Optional notes about the appointment</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        {isNew ? "Creating..." : "Updating..."}
                                    </>
                                ) : (
                                    <>{isNew ? "Create Appointment" : "Update Appointment"}</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

