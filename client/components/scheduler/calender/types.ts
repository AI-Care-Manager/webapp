export interface StaffMember {
  id: string
  name: string
  role: string
  color: string
  avatar?: string
  selected: boolean
}

export interface Client {
  id: string
  name: string
  color: string
  avatar?: string
  selected: boolean
}

export interface AppointmentEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
  clientId: string
  type: string
  status: string
  notes: string
  chargeRate: number
  color: string
}

export interface CalendarProps {
  view: "day" | "week" | "month"
  onEventSelect: (event: any) => void
  dateRange: {
    from?: Date
    to?: Date
  }
}

export type SidebarMode = "clients" | "careworkers" | "officestaff"

