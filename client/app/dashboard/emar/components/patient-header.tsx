"use client"

import { useAppSelector, useAppDispatch } from "@/state/redux"
import { Phone, Mail, FileText, Edit, Share, Printer, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function PatientHeader() {
    const patient = useAppSelector(state => state.patient)
    const dispatch = useAppDispatch()

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Low":
                return "bg-slate-100 text-slate-800 hover:bg-slate-200"
            case "Medium":
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            case "High":
                return "bg-red-100 text-red-800 hover:bg-red-200"
            default:
                return "bg-slate-100 text-slate-800 hover:bg-slate-200"
        }
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                            <AvatarImage src="/placeholder.svg?height=80&width=80" alt={patient.name} />
                            <AvatarFallback className="text-2xl">
                                {patient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">{patient.name}</h2>
                                <Badge className={getStatusColor(patient.careLevel)}>{patient.careLevel} Care Level</Badge>
                            </div>

                            <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    <span>Age {patient.age}</span>
                                </div>
                                <div className="flex items-center">
                                    <span>Room {patient.room}</span>
                                </div>
                                <div className="flex items-center">
                                    <span>Arrived {patient.admissionDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Phone className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{patient.personalInfo.phone}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Phone Number</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">{patient.personalInfo.email}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Email Address</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <Button className="bg-slate-600 hover:bg-slate-700" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Record Vital
                        </Button>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-gray-50">
                            Status
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {patient.status}
                        </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                            <Share className="h-4 w-4 mr-2" />
                            Share Link
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
