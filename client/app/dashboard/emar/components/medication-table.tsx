"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from "date-fns"
import { useAppSelector, useAppDispatch } from "@/state/redux"
import { setSelectedMedication, setAdministrationDialogOpen } from "@/state/slices/medicationSlice"

export function MedicationTable() {
    const dispatch = useAppDispatch()
    const medications = useAppSelector(state => state.medication.medications)
    const administrations = useAppSelector(state => state.medication.administrations)
    const currentDate = new Date()

    // Create scheduled medications from the medications and administrations
    const scheduledMedications = medications.flatMap(med => {
        return med.times.map(time => {
            const [hours, minutes] = time.split(':').map(Number)
            const scheduledTime = new Date(currentDate)
            scheduledTime.setHours(hours, minutes, 0)

            // Find if there's an administration for this medication and time
            const administration = administrations.find(adm =>
                adm.medicationId === med.id &&
                new Date(adm.scheduledTime).getHours() === hours &&
                new Date(adm.scheduledTime).getMinutes() === minutes
            )

            return {
                id: `${med.id}-${time}`,
                medicationId: med.id,
                name: med.name,
                dosage: med.dosage,
                instructions: med.instructions,
                scheduledTime,
                status: administration?.status || "pending"
            }
        })
    }).sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "given":
                return <Badge className="bg-slate-100 text-slate-800">Given</Badge>
            case "not_given":
                return <Badge className="bg-red-100 text-red-800">Not Given</Badge>
            case "refused":
                return <Badge className="bg-amber-100 text-amber-800">Refused</Badge>
            case "pending":
                return <Badge className="bg-slate-100 text-slate-800">Pending</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
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
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Today's Schedule</h3>
                    <Badge variant="outline">{format(currentDate, "MMMM d, yyyy")}</Badge>
                </div>
                <Button className="bg-slate-600 hover:bg-slate-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    PRN Medications
                </Button>
            </div>

            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Medication</TableHead>
                            <TableHead>Dosage</TableHead>
                            <TableHead>Instructions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scheduledMedications.map((med) => (
                            <TableRow key={med.id}>
                                <TableCell className="font-medium">{format(med.scheduledTime, "h:mm a")}</TableCell>
                                <TableCell>{med.name}</TableCell>
                                <TableCell>{med.dosage}</TableCell>
                                <TableCell>{med.instructions}</TableCell>
                                <TableCell>{getStatusBadge(med.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        className="bg-slate-600 hover:bg-slate-700"
                                        onClick={() => handleAdminister(med.medicationId)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Administer
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
