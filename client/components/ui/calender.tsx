"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

// Import the Locale type from date-fns
import type { Locale } from "date-fns"

// Types to match the original component API
export interface CalendarProps {
    mode?: "single" | "range" | "multiple"
    selected?: Date | Date[] | { from: Date; to: Date }
    onSelect?: (date: Date | undefined) => void
    disabled?: { from: Date; to: Date }[] | ((date: Date) => boolean)
    className?: string
    classNames?: Record<string, string>
    showOutsideDays?: boolean
    month?: Date
    defaultMonth?: Date
    numberOfMonths?: number
    fromDate?: Date
    toDate?: Date
    captionLayout?: "dropdown" | "buttons"
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    fixedWeeks?: boolean
    ISOWeek?: boolean
    locale?: Locale
    modifiers?: Record<string, (date: Date) => boolean>
    modifiersClassNames?: Record<string, string>
    styles?: Record<string, React.CSSProperties>
}

function Calendar({
    mode = "single",
    selected,
    onSelect,
    disabled,
    className,
    classNames,
    showOutsideDays = true,
    month: propMonth,
    defaultMonth,
    numberOfMonths = 1,
    fromDate,
    toDate,
    captionLayout = "buttons",
    weekStartsOn = 0,
    fixedWeeks = false,
    ...props
}: CalendarProps) {
    // State for current month
    const [currentMonth, setCurrentMonth] = React.useState(() => {
        if (propMonth) return propMonth
        if (defaultMonth) return defaultMonth
        if (selected && !Array.isArray(selected) && !(selected as any).from) {
            return selected as Date
        }
        if (selected && Array.isArray(selected) && selected.length > 0) {
            return selected[0]
        }
        if (selected && (selected as any).from) {
            return (selected as { from: Date }).from
        }
        return new Date()
    })

    // Update month when prop changes
    React.useEffect(() => {
        if (propMonth) {
            setCurrentMonth(propMonth)
        }
    }, [propMonth])

    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // Get day of week for first day of month
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    // Navigate to previous month
    const prevMonth = () => {
        setCurrentMonth((prev) => {
            const newMonth = new Date(prev)
            newMonth.setMonth(newMonth.getMonth() - 1)
            return newMonth
        })
    }

    // Navigate to next month
    const nextMonth = () => {
        setCurrentMonth((prev) => {
            const newMonth = new Date(prev)
            newMonth.setMonth(newMonth.getMonth() + 1)
            return newMonth
        })
    }

    // Format date as YYYY-MM-DD for comparison
    const formatDateKey = (date: Date) => {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    }

    // Check if a date is selected
    const isDateSelected = (date: Date) => {
        if (!selected) return false

        if (Array.isArray(selected)) {
            return selected.some((d) => formatDateKey(d) === formatDateKey(date))
        }

        if ((selected as any).from && (selected as any).to) {
            const { from, to } = selected as { from: Date; to: Date }
            return date >= from && date <= to
        }

        return formatDateKey(selected as Date) === formatDateKey(date)
    }

    // Check if a date is today
    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    // Check if a date is disabled
    const isDateDisabled = (date: Date) => {
        if (!disabled) return false

        if (typeof disabled === "function") {
            return disabled(date)
        }

        return disabled.some((range) => date >= range.from && date <= range.to)
    }

    // Handle date selection
    const handleDateSelect = (date: Date) => {
        if (isDateDisabled(date)) return
        onSelect?.(date)
    }

    // Generate calendar grid
    const renderCalendarGrid = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDayOfMonth = getFirstDayOfMonth(year, month)

        // Calculate days from previous month to show
        const daysFromPrevMonth = firstDayOfMonth - weekStartsOn
        const adjustedDaysFromPrevMonth = daysFromPrevMonth < 0 ? 7 + daysFromPrevMonth : daysFromPrevMonth

        // Get days from previous month
        const prevMonthDays = []
        if (showOutsideDays) {
            const prevMonth = month === 0 ? 11 : month - 1
            const prevMonthYear = month === 0 ? year - 1 : year
            const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth)

            for (let i = 0; i < adjustedDaysFromPrevMonth; i++) {
                const day = daysInPrevMonth - adjustedDaysFromPrevMonth + i + 1
                const date = new Date(prevMonthYear, prevMonth, day)
                prevMonthDays.push({ date, isOutside: true })
            }
        } else {
            for (let i = 0; i < adjustedDaysFromPrevMonth; i++) {
                prevMonthDays.push({ date: null, isOutside: true })
            }
        }

        // Current month days
        const currentMonthDays = []
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            currentMonthDays.push({ date, isOutside: false })
        }

        // Calculate how many days from next month to show
        const totalDaysShown = prevMonthDays.length + currentMonthDays.length
        const daysFromNextMonth = fixedWeeks
            ? Math.ceil(totalDaysShown / 7) * 7 - totalDaysShown
            : (7 - (totalDaysShown % 7)) % 7

        // Get days from next month
        const nextMonthDays = []
        if (showOutsideDays || fixedWeeks) {
            const nextMonth = month === 11 ? 0 : month + 1
            const nextMonthYear = month === 11 ? year + 1 : year

            for (let i = 1; i <= daysFromNextMonth; i++) {
                const date = new Date(nextMonthYear, nextMonth, i)
                nextMonthDays.push({ date, isOutside: true })
            }
        }

        // Combine all days
        const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

        // Split into weeks
        const weeks = []
        for (let i = 0; i < allDays.length; i += 7) {
            weeks.push(allDays.slice(i, i + 7))
        }

        return weeks
    }

    // Get month name
    const getMonthName = (date: Date) => {
        return date.toLocaleString("default", { month: "long" })
    }

    // Weekday headers
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    const orderedWeekdays = [...weekdays.slice(weekStartsOn), ...weekdays.slice(0, weekStartsOn)]

    // Generate calendar
    const weeks = renderCalendarGrid()

    return (
        <div className={cn("p-3", className)}>
            <div className={cn("space-y-4", classNames?.month)}>
                <div className={cn("flex justify-center pt-1 relative items-center", classNames?.caption)}>
                    <div className={cn("text-sm font-medium", classNames?.caption_label)}>
                        {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                    </div>
                    <div className={cn("space-x-1 flex items-center", classNames?.nav)}>
                        <button
                            onClick={prevMonth}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                "absolute left-1",
                                classNames?.nav_button,
                                classNames?.nav_button_previous,
                            )}
                            type="button"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                "absolute right-1",
                                classNames?.nav_button,
                                classNames?.nav_button_next,
                            )}
                            type="button"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className={cn("w-full", classNames?.table)}>
                    <div className={cn("flex justify-between", classNames?.head_row)}>
                        {orderedWeekdays.map((day) => (
                            <div
                                key={day}
                                className={cn(
                                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                                    classNames?.head_cell,
                                )}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className={cn("flex w-full mt-2", classNames?.row)}>
                            {week.map((day, dayIndex) => {
                                if (!day.date) {
                                    return (
                                        <div key={`empty-${dayIndex}`} className={cn("h-9 w-9 p-0 text-center", classNames?.day_hidden)} />
                                    )
                                }

                                const isSelected = isDateSelected(day.date)
                                const isDayToday = isToday(day.date)
                                const isDisabled = isDateDisabled(day.date)

                                return (
                                    <div
                                        key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
                                        className={cn(
                                            "relative h-9 w-9 p-0 text-center",
                                            day.isOutside && classNames?.day_outside,
                                            isSelected && "bg-accent",
                                            classNames?.cell,
                                        )}
                                    >
                                        <button
                                            onClick={() => handleDateSelect(day.date)}
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "h-9 w-9 p-0 font-normal",
                                                isSelected &&
                                                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                                isDayToday && !isSelected && "bg-accent text-accent-foreground",
                                                day.isOutside && "text-muted-foreground opacity-50",
                                                isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
                                                classNames?.day,
                                                isSelected && classNames?.day_selected,
                                                isDayToday && classNames?.day_today,
                                                day.isOutside && classNames?.day_outside,
                                                isDisabled && classNames?.day_disabled,
                                            )}
                                            disabled={isDisabled}
                                            type="button"
                                            tabIndex={day.isOutside ? -1 : 0}
                                        >
                                            {day.date.getDate()}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }

