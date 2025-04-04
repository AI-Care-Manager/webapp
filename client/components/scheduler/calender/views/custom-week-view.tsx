"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import moment from "moment"
import { motion, type PanInfo } from "framer-motion"
import { toast } from "sonner"
import type { AppointmentEvent } from "../types"
import { cn } from "../../../../lib/utils"

interface CustomWeekViewProps {
    date: Date
    events: AppointmentEvent[]
    onSelectEvent: (event: AppointmentEvent) => void
    staffMembers: any[]
    getEventDurationInMinutes: (event: any) => number
    onEventUpdate?: (updatedEvent: AppointmentEvent) => void
    spaceTheme?: boolean
}

export function CustomWeekView({
    date,
    events,
    onSelectEvent,
    staffMembers,
    getEventDurationInMinutes,
    onEventUpdate,
    spaceTheme = false,
}: CustomWeekViewProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gridRef = useRef<HTMLDivElement>(null)
    const [weekDays, setWeekDays] = useState<Date[]>([])
    const [timeSlots, setTimeSlots] = useState<string[]>([])
    const [eventPositions, setEventPositions] = useState<{ [key: string]: any }>({})
    const [displayEvents, setDisplayEvents] = useState<{ [key: string]: AppointmentEvent }>({}) // Store display events
    const [gridDimensions, setGridDimensions] = useState({
        slotHeight: 40,
        dayWidth: 0,
        timeGutterWidth: 60,
        totalHeight: 0,
        totalWidth: 0,
    })

    // Hours to display (7am to 7pm)
    const startHour = 7
    const endHour = 19

    // Generate week days and time slots
    useEffect(() => {
        // Generate week days
        const startOfWeek = moment(date).startOf("week")
        const days: Date[] = []

        for (let i = 0; i < 7; i++) {
            days.push(startOfWeek.clone().add(i, "days").toDate())
        }
        setWeekDays(days)

        // Generate time slots
        const slots: string[] = []
        for (let hour = startHour; hour <= endHour; hour++) {
            slots.push(`${hour}:00`)
            slots.push(`${hour}:30`)
        }
        setTimeSlots(slots)
    }, [date, startHour, endHour])

    // Initialize display events
    useEffect(() => {
        console.log('Initializing display events for week view');
        const eventMap: { [key: string]: AppointmentEvent } = {};
        events.forEach((event) => {
            // Ensure dates are properly parsed
            const processedEvent = {
                ...event,
                start: moment(event.start).toDate(),
                end: moment(event.end).toDate(),
                date: moment(event.date).toDate(),
            };
            console.log('Processing event:', event.id, 'Start:', processedEvent.start.toISOString());
            eventMap[event.id] = processedEvent;
        });
        setDisplayEvents(eventMap);
    }, [events]);

    // Calculate grid dimensions and event positions
    useEffect(() => {
        if (!containerRef.current || !gridRef.current || weekDays.length === 0) return;

        console.log('Calculating grid dimensions and event positions');
        const containerWidth = gridRef.current.offsetWidth;
        const timeGutterWidth = 60;
        const dayWidth = (containerWidth - timeGutterWidth) / 7;
        const slotHeight = 40;
        const totalHeight = timeSlots.length * slotHeight;

        setGridDimensions({
            slotHeight,
            dayWidth,
            timeGutterWidth,
            totalHeight,
            totalWidth: containerWidth,
        });

        const positions: { [key: string]: any } = {};
        const currentWeek = moment(date).startOf('week');

        events.forEach((event) => {
            const eventStart = moment(event.start);
            const eventEnd = moment(event.end);

            // Skip events outside the current week
            if (!eventStart.isSame(currentWeek, "week")) {
                console.log('Skipping event outside current week:', event.id);
                return;
            }

            // Calculate day index (0-6)
            const dayIndex = eventStart.day();
            console.log('Event day index:', event.id, dayIndex);

            // Calculate top position based on time
            const startHourDecimal = eventStart.hours() + eventStart.minutes() / 60;
            const endHourDecimal = eventEnd.hours() + eventEnd.minutes() / 60;

            // Skip events outside the visible time range
            if (endHourDecimal < startHour || startHourDecimal > endHour) {
                console.log('Skipping event outside visible time range:', event.id);
                return;
            }

            // Clamp event times to visible range
            const clampedStartHour = Math.max(startHourDecimal, startHour);
            const clampedEndHour = Math.min(endHourDecimal, endHour);

            // Calculate minutes from start of day
            const startMinutes = (clampedStartHour - startHour) * 60;
            const endMinutes = (clampedEndHour - startHour) * 60;
            const durationMinutes = endMinutes - startMinutes;

            // Calculate exact pixel positions
            const top = Math.round((startMinutes / 30) * slotHeight);
            const height = Math.round((durationMinutes / 30) * slotHeight);

            // Ensure minimum height for visibility
            const minHeight = 20;
            const finalHeight = Math.max(height, minHeight);

            // Calculate left position based on day
            const left = timeGutterWidth + dayIndex * dayWidth;
            const width = dayWidth - 4; // 4px for gap

            positions[event.id] = {
                top,
                left,
                height: finalHeight,
                width,
                dayIndex,
                startMinutes,
                durationMinutes,
                originalEvent: { ...event },
                // Store original times for reference
                originalStartHour: eventStart.hours(),
                originalStartMinute: eventStart.minutes(),
                originalEndHour: eventEnd.hours(),
                originalEndMinute: eventEnd.minutes(),
            };
        });

        console.log('Calculated positions for events:', Object.keys(positions).length);
        setEventPositions(positions);
    }, [events, weekDays, date, timeSlots, startHour, endHour, containerRef, gridRef]);

    // Scroll to current time on initial render
    useEffect(() => {
        if (!containerRef.current) return

        const now = new Date()
        const currentHour = now.getHours()

        if (currentHour >= startHour && currentHour <= endHour) {
            const minutesSinceStart = (currentHour - startHour) * 60 + now.getMinutes()
            const scrollPosition = (minutesSinceStart / 30) * gridDimensions.slotHeight - 100 // 100px offset to show context

            containerRef.current.scrollTop = Math.max(0, scrollPosition)
        }
    }, [gridDimensions.slotHeight])

    // Get event background color based on type
    const getEventBackground = (event: AppointmentEvent) => {
        if (spaceTheme) {
            switch (event.type) {
                case "HOME_VISIT":
                    return "bg-green-900/30"
                case "VIDEO_CALL":
                    return "bg-blue-900/30"
                case "HOSPITAL":
                    return "bg-green-900/30"
                case "IN_PERSON":
                    return "bg-amber-900/30"
                case "AUDIO_CALL":
                    return "bg-red-900/30"
                default:
                    return "bg-zinc-800/30"
            }
        } else {
            switch (event.type) {
                case "HOME_VISIT":
                    return "bg-green-50"
                case "VIDEO_CALL":
                    return "bg-blue-50"
                case "HOSPITAL":
                    return "bg-green-50"
                case "IN_PERSON":
                    return "bg-amber-50"
                case "AUDIO_CALL":
                    return "bg-red-50"
                default:
                    return "bg-gray-50"
            }
        }
    }

    // Get staff color
    const getStaffColor = (event: AppointmentEvent, staffMembers: any[]) => {
        const staffMember = staffMembers.find((s) => s.id === event.resourceId)
        const staffColor = staffMember?.color || "#888888"
        const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Staff"
        return { staffColor, staffName }
    }

    // Format time slot label
    const formatTimeSlot = (timeSlot: string) => {
        const [hour, minute] = timeSlot.split(":")
        const hourNum = Number.parseInt(hour)
        return `${hourNum % 12 || 12}${minute === "00" ? "" : ":30"} ${hourNum >= 12 ? "PM" : "AM"}`
    }

    // Check if a time slot has events
    const hasEventsInTimeSlot = (day: Date, slotIndex: number) => {
        const slotStart = moment(day)
            .hour(Math.floor(slotIndex / 2) + startHour)
            .minute((slotIndex % 2) * 30)
        const slotEnd = moment(slotStart).add(30, "minutes")

        return events.some((event) => {
            const eventStart = moment(event.start)
            const eventEnd = moment(event.end)

            // Check if this event is on this day
            if (!eventStart.isSame(day, "day")) return false

            // Check if event overlaps with this time slot
            return (
                (eventStart.isSameOrAfter(slotStart) && eventStart.isBefore(slotEnd)) ||
                (eventEnd.isAfter(slotStart) && eventEnd.isSameOrBefore(slotEnd)) ||
                (eventStart.isSameOrBefore(slotStart) && eventEnd.isSameOrAfter(slotEnd))
            )
        })
    }

    // Snap time to 15-minute intervals
    const snapTimeToGrid = useCallback((minutes: number): number => {
        return Math.floor(minutes / 10) * 10
    }, [])

    // Handle drag end for events
    const handleDragEnd = useCallback(
        (event: AppointmentEvent, info: PanInfo, position: any) => {
            if (!gridRef.current) return

            // Calculate new day and time based on position
            const { dayWidth, slotHeight, timeGutterWidth } = gridDimensions

            // Calculate new day index
            const newLeft = position.left + info.offset.x
            const rawDayIndex = Math.floor((newLeft - timeGutterWidth + 20) / dayWidth) // Add 20 to account for the offset
            const dayIndex = Math.max(0, Math.min(6, rawDayIndex))

            // Calculate new start time with exact 10-minute snapping
            const newTop = Math.max(0, position.top + info.offset.y)
            const minutesFromStart = Math.floor((newTop / slotHeight) * 30)
            const startHourOffset = Math.floor(minutesFromStart / 60)
            const startMinuteOffset = minutesFromStart % 60

            // Ensure we snap to exactly 10-minute intervals
            const roundedStartMinute = Math.floor(startMinuteOffset / 10) * 10

            // Ensure we don't go beyond the visible time range
            const clampedStartHour = Math.min(startHour + startHourOffset, endHour - 0.5)

            // Create new start and end dates
            const newStartDate = moment(weekDays[dayIndex])
                .hour(clampedStartHour)
                .minute(roundedStartMinute)
                .second(0)
                .millisecond(0)

            // Maintain the original duration but ensure it's a multiple of 10 minutes
            const originalDurationMinutes = position.durationMinutes
            const roundedDurationMinutes = Math.floor(originalDurationMinutes / 10) * 10
            const newEndDate = moment(newStartDate).add(roundedDurationMinutes, "minutes")

            // Ensure end time doesn't exceed the visible range
            if (newEndDate.hour() > endHour) {
                newEndDate.hour(endHour).minute(0)
            }

            // Create updated event
            const updatedEvent: AppointmentEvent = {
                ...event,
                start: newStartDate.toDate(),
                end: newEndDate.toDate(),
            }

            // Update the display event immediately to reflect the new times in the UI
            setDisplayEvents((prev) => ({
                ...prev,
                [event.id]: updatedEvent,
            }))

            // Recalculate position values with precise snapping
            const updatedStartMinutes = (newStartDate.hour() - startHour) * 60 + newStartDate.minute()
            const updatedEndMinutes = (newEndDate.hour() - startHour) * 60 + newEndDate.minute()
            const updatedDurationMinutes = updatedEndMinutes - updatedStartMinutes

            // Calculate exact pixel positions - ensure they align with grid
            const updatedTop = Math.floor(updatedStartMinutes / 30) * slotHeight
            const updatedHeight = Math.floor(updatedDurationMinutes / 30) * slotHeight

            // Ensure minimum height for visibility
            const minHeight = 20
            const finalHeight = Math.max(updatedHeight, minHeight)

            // Calculate exact column position
            const exactColumnLeft = timeGutterWidth + dayIndex * dayWidth

            // Update event positions
            const updatedPositions = { ...eventPositions }
            updatedPositions[event.id] = {
                ...position,
                top: updatedTop,
                left: exactColumnLeft,
                height: finalHeight,
                width: dayWidth - 4, // Ensure consistent width
                dayIndex,
                startMinutes: updatedStartMinutes,
                durationMinutes: updatedDurationMinutes,
                originalEvent: { ...updatedEvent },
            }

            setEventPositions(updatedPositions)

            // Call onEventUpdate if provided
            if (onEventUpdate) {
                onEventUpdate(updatedEvent)
                toast.success("Event updated successfully")
            }
        },
        [gridDimensions, weekDays, startHour, endHour, onEventUpdate, eventPositions, setEventPositions, setDisplayEvents],
    )

    // Track if we're dragging to prevent click after drag
    const isDraggingRef = useRef(false)
    const eventRefs = useRef<{ [key: string]: HTMLElement }>({})

    return (
        <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className={`flex border-b ${spaceTheme ? "border-zinc-800" : ""}`}>
                <div className={`w-[60px] flex-shrink-0 ${spaceTheme ? "text-zinc-400" : ""}`}></div>
                <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day, i) => {
                        const isToday = moment(day).isSame(moment(), "day")
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "p-2 text-center border-r",
                                    isToday ? (spaceTheme ? "bg-zinc-900" : "bg-blue-50") : "",
                                    spaceTheme ? "border-zinc-800 text-white" : "",
                                )}
                            >
                                <div className={cn("text-xs", spaceTheme ? "text-zinc-400" : "text-gray-500")}>
                                    {moment(day).format("ddd").toUpperCase()}
                                </div>
                                <div
                                    className={cn(
                                        "text-sm font-medium mt-1",
                                        isToday ? (spaceTheme ? "text-green-400" : "text-blue-500") : spaceTheme ? "text-white" : "",
                                    )}
                                >
                                    {moment(day).format("D")}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Time grid */}
            <div
                className={`flex-1 overflow-y-auto ${spaceTheme ? "scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" : ""}`}
                ref={containerRef}
            >
                <div className="flex relative min-h-full">
                    {/* Time gutter */}
                    <div className={`w-[60px] flex-shrink-0 border-r ${spaceTheme ? "border-zinc-800" : ""}`}>
                        {timeSlots.map((slot, i) => (
                            <div
                                key={i}
                                className={cn("h-[40px] text-xs text-right pr-2 pt-1", spaceTheme ? "text-zinc-400" : "text-gray-500")}
                            >
                                {i % 2 === 0 && formatTimeSlot(slot)}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="flex-1 grid grid-cols-7 relative" ref={gridRef}>
                        {/* Time slot grid */}
                        {weekDays.map((day, dayIndex) => (
                            <div key={dayIndex} className={`border-r ${spaceTheme ? "border-zinc-800" : ""}`}>
                                {timeSlots.map((slot, slotIndex) => {
                                    const hasEvents = hasEventsInTimeSlot(day, slotIndex)
                                    return (
                                        <div
                                            key={slotIndex}
                                            className={cn(
                                                "h-[40px] border-b",
                                                slotIndex % 2 === 0
                                                    ? spaceTheme
                                                        ? "border-zinc-800"
                                                        : "border-gray-200"
                                                    : spaceTheme
                                                        ? "border-zinc-900"
                                                        : "border-gray-100",
                                                hasEvents ? "" : spaceTheme ? "bg-zinc-900" : "bg-gray-50/30",
                                            )}
                                        ></div>
                                    )
                                })}
                            </div>
                        ))}

                        {/* Current time indicator */}
                        {weekDays.some((day) => moment(day).isSame(moment(), "day")) && (
                            <div
                                className={`absolute left-0 right-0 border-t-2 z-10 ${spaceTheme ? "border-green-500" : "border-red-500"}`}
                                style={{
                                    top: (() => {
                                        const now = new Date()
                                        const currentHour = now.getHours()
                                        const currentMinute = now.getMinutes()

                                        if (currentHour < startHour || currentHour > endHour) return 0

                                        const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute
                                        return Math.round((minutesSinceStart / 30) * gridDimensions.slotHeight)
                                    })(),
                                }}
                            >
                                <div className={`w-2 h-2 rounded-full -mt-1 -ml-1 ${spaceTheme ? "bg-green-500" : "bg-red-500"}`}></div>
                            </div>
                        )}

                        {/* Events */}
                        {events.map((event) => {
                            const position = eventPositions[event.id]
                            if (!position) return null

                            // Use the display event for rendering (which will have updated times after drag)
                            const displayEvent = displayEvents[event.id] || event

                            const { staffColor, staffName } = getStaffColor(event, staffMembers)

                            return (
                                <motion.div
                                    key={event.id}
                                    ref={(el) => {
                                        if (el) {
                                            eventRefs.current[event.id] = el;
                                        }
                                    }}
                                    className={cn(
                                        "absolute rounded p-1 text-xs overflow-hidden cursor-move event-card",
                                        getEventBackground(event),
                                        "transition-shadow duration-200",
                                    )}
                                    style={{
                                        top: `${position.top}px`,
                                        left: `${position.left - 20}px`, // Apply -20px offset for proper alignment
                                        height: `${position.height}px`,
                                        width: `${position.width}px`,
                                        borderLeft: `3px solid ${staffColor}`,
                                        overflow: "hidden",
                                        zIndex: isDraggingRef.current ? 30 : 10,
                                        boxShadow: spaceTheme ? "0 2px 6px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.1)",
                                    }}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        transition: { type: "spring", stiffness: 300, damping: 30 },
                                    }}
                                    whileHover={{
                                        zIndex: 20,
                                        boxShadow: spaceTheme ? "0 4px 10px rgba(0,0,0,0.4)" : "0 4px 8px rgba(0,0,0,0.15)",
                                        scale: 1.02,
                                        transition: { duration: 0.2 },
                                    }}
                                    drag
                                    dragConstraints={gridRef}
                                    dragElastic={0}
                                    dragMomentum={false}
                                    dragSnapToOrigin={false}
                                    onDragStart={() => {
                                        isDraggingRef.current = true
                                    }}
                                    onDrag={(_, info) => {
                                        // Apply snapping during drag for visual feedback
                                        const { slotHeight } = gridDimensions
                                        const minutesFromStart = Math.floor(((position.top + info.offset.y) / slotHeight) * 30)
                                        const snappedMinutes = Math.floor(minutesFromStart / 10) * 10
                                        const snappedTop = (snappedMinutes / 30) * slotHeight

                                        // Update the transform to snap to grid lines during drag
                                        const dragElement = eventRefs.current[event.id]
                                        if (dragElement) {
                                            const snapDiff = snappedTop - (position.top + info.offset.y)
                                            dragElement.style.transform = `translate3d(${info.offset.x}px, ${info.offset.y + snapDiff}px, 0)`
                                        }
                                    }}
                                    onDragEnd={(_, dragInfo) => {
                                        handleDragEnd(event, dragInfo, position)
                                        // Reset dragging state after a short delay
                                        setTimeout(() => {
                                            isDraggingRef.current = false
                                        }, 100)
                                    }}
                                    onClick={(e) => {
                                        // Only trigger select if not dragging
                                        if (!isDraggingRef.current) {
                                            e.stopPropagation()
                                            onSelectEvent(event)
                                        }
                                    }}
                                >
                                    <div className={`font-medium truncate ${spaceTheme ? "text-white" : ""}`}>{displayEvent.title}</div>
                                    <div className={`text-[10px] ${spaceTheme ? "text-zinc-300" : "text-gray-500"}`}>
                                        {moment(displayEvent.start).format("h:mm A")} - {moment(displayEvent.end).format("h:mm A")}
                                    </div>
                                    {position.height > 60 && (
                                        <div className={`mt-1 truncate text-[10px] ${spaceTheme ? "text-zinc-300" : "text-gray-500"}`}>
                                            {event.title || "No staff assigned"}
                                        </div>
                                    )}
                                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] text-white shadow-sm"
                                        style={{ backgroundColor: staffColor }}
                                    >
                                        {staffName?.[0] || "?"}
                                    </div>
                                    <span className={`text-[10px] ${spaceTheme ? "text-slate-300" : "text-gray-600"} truncate`}>
                                        {staffName}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

