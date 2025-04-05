"use client"

import { useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/state/redux"
import { setSelectedMedication, setAdministrationDialogOpen } from "@/state/slices/medicationSlice"

interface MedicationCalendarProps {
    currentDate: Date
}

export function MedicationCalendar({ currentDate }: MedicationCalendarProps) {
    const dispatch = useAppDispatch()
    const medications = useAppSelector(state => state.medication.medications)
    const calendarEntries = useAppSelector(state => state.medication.calendarEntries)
    const currentView = useAppSelector(state => state.medication.currentView)

    // Generate days for the current month
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })

    // Get status icon based on status
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "taken":
                return <div className="w-4 h-4 rounded-full bg-slate-500"></div>
            case "not_taken":
                return <div className="w-4 h-4 rounded-full bg-red-500"></div>
            case "not_reported":
                return <div className="w-4 h-4 rounded-full bg-gray-300"></div>
            case "not_scheduled":
            default:
                return <div className="w-4 h-4 rounded-full border border-gray-300"></div>
        }
    }

    const handleAdminister = (medicationId: string) => {
        const medication = medications.find(med => med.id === medicationId)
        if (medication) {
            dispatch(setSelectedMedication(medication))
            dispatch(setAdministrationDialogOpen(true))
        }
    }

    return (
        <div className="space-y-8">
            {calendarEntries.map((entry) => {
                const medication = medications.find(med => med.id === entry.medicationId)
                if (!medication) return null

                return (
                    <div key={entry.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">{medication.name}</h3>
                                <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAdminister(medication.id)}
                                className="bg-slate-600 hover:bg-slate-700"
                            >
                                Administer
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border-b text-left">Time</th>
                                        {days.map((day) => (
                                            <th key={day.toString()} className="p-2 border-b text-center min-w-[40px]">
                                                <div className="text-sm">{format(day, "d")}</div>
                                                <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.times.map((time: string, timeIndex: number) => (
                                        <tr key={`${entry.id}-${time}`} className={timeIndex % 2 === 0 ? "bg-muted/30" : ""}>
                                            <td className="p-2 border-b font-medium">{format(new Date(`2000-01-01T${time}`), "h:mm a")}</td>
                                            {days.map((day) => {
                                                const dayOfMonth = day.getDate()
                                                const status = entry.status[dayOfMonth] || "not_scheduled"

                                                return (
                                                    <td key={`${entry.id}-${time}-${day.toString()}`} className="p-2 border-b text-center">
                                                        <div className="flex justify-center">{getStatusIcon(status)}</div>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
