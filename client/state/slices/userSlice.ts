import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { User } from "../../types/prismaTypes"
import { api } from "../api"
import type { AppointmentEvent, SidebarMode } from "../../components/scheduler/calender/types"
import { filterEvents } from "../../components/scheduler/calender/calender-utils"

// This will help serialize and deserialize dates
function serializeEvent(event: AppointmentEvent): any {
  return {
    ...event,
    start: event.start instanceof Date ? event.start.toISOString() : event.start,
    end: event.end instanceof Date ? event.end.toISOString() : event.end,
  }
}

function deserializeEvent(event: any): AppointmentEvent {
  return {
    ...event,
    start: typeof event.start === "string" ? new Date(event.start) : event.start,
    end: typeof event.end === "string" ? new Date(event.end) : event.end,
  }
}

interface UserState {
  officeStaff: User[]
  careWorkers: User[]
  clients: User[]
  events: AppointmentEvent[]
  filteredEvents: AppointmentEvent[]
  sidebarMode: SidebarMode
  loading: boolean
  error: string | null
}

// Initial state
const initialState: UserState = {
  officeStaff: [],
  careWorkers: [],
  clients: [],
  events: [],
  filteredEvents: [],
  sidebarMode: "clients",
  loading: false,
  error: null,
}

// User Slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setOfficeStaff: (state, action: PayloadAction<User[]>) => {
      state.officeStaff = action.payload
      // Update filtered events when staff changes
      updateFilteredEvents(state)
    },
    setCareWorkers: (state, action: PayloadAction<User[]>) => {
      state.careWorkers = action.payload
      // Update filtered events when staff changes
      updateFilteredEvents(state)
    },
    setClients: (state, action: PayloadAction<User[]>) => {
      state.clients = action.payload
      // Update filtered events when clients change
      updateFilteredEvents(state)
    },
    setEvents: (state, action: PayloadAction<AppointmentEvent[]>) => {
      state.events = action.payload.map(serializeEvent)
      // Update filtered events when events change
      updateFilteredEvents(state)
    },
    setFilteredEvents: (state, action: PayloadAction<AppointmentEvent[]>) => {
      state.filteredEvents = action.payload.map(serializeEvent)
    },
    setSidebarMode: (state, action: PayloadAction<SidebarMode>) => {
      state.sidebarMode = action.payload
      // Update filtered events when sidebar mode changes
      updateFilteredEvents(state)
    },
    toggleEventTypeSelection: (state, action: PayloadAction<string>) => {
      // This is a placeholder since we removed event types
      // We'll keep it for API compatibility
    },
    addEvent: (state, action: PayloadAction<AppointmentEvent>) => {
      // Serialize the event before adding it to the state
      const serializedEvent = serializeEvent(action.payload)
      state.events.push(serializedEvent)

      // Log the event for debugging
      console.log("Added event to Redux store:", serializedEvent)

      // Update filtered events when adding an event
      updateFilteredEvents(state)
    },
    updateEvent: (state, action: PayloadAction<AppointmentEvent>) => {
      const serializedEvent = serializeEvent(action.payload)
      const index = state.events.findIndex((event) => event.id === serializedEvent.id)
      if (index !== -1) {
        state.events[index] = serializedEvent
      }
      // Update filtered events when updating an event
      updateFilteredEvents(state)
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((event) => event.id !== action.payload)
      // Update filtered events when deleting an event
      updateFilteredEvents(state)
    },
    clearUserError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle getFilteredUsers
      .addMatcher(api.endpoints.getFilteredUsers.matchPending, (state) => {
        state.loading = true
        state.error = null
      })
      .addMatcher(api.endpoints.getFilteredUsers.matchFulfilled, (state, { payload }) => {
        state.loading = false
        state.officeStaff = payload.officeStaff
        state.careWorkers = payload.careWorkers
        state.clients = payload.clients
        // Update filtered events when users change
        updateFilteredEvents(state)
      })
      .addMatcher(api.endpoints.getFilteredUsers.matchRejected, (state, { error }) => {
        state.loading = false
        state.error = error.message || "Failed to fetch users"
      })
      // Handle getSchedulesByDateRange
      .addMatcher(api.endpoints.getSchedulesByDateRange.matchPending, (state) => {
        state.loading = true
      })
      .addMatcher(api.endpoints.getSchedulesByDateRange.matchFulfilled, (state, { payload }) => {
        state.loading = false
        // Map API schedules to our event format
        const events = payload.data.map((schedule) => ({
          id: schedule.id,
          title: `Appointment with ${schedule.client?.firstName || "Client"}`,
          start: new Date(schedule.shiftStart),
          end: new Date(schedule.shiftEnd),
          resourceId: schedule.userId,
          clientId: schedule.clientId,
          type: schedule.type || "APPOINTMENT",
          status: schedule.status || "PENDING",
          notes: schedule.notes || "",
          chargeRate: schedule.chargeRate || 25,
          color: getEventColor(schedule.type),
        }))
        state.events = events.map(serializeEvent)
        // Update filtered events when events change
        updateFilteredEvents(state)
      })
      .addMatcher(api.endpoints.getSchedulesByDateRange.matchRejected, (state, { error }) => {
        state.loading = false
        state.error = error.message || "Failed to fetch schedules"
      })
  },
})

// Helper function to update filtered events based on current state
function updateFilteredEvents(state: UserState) {
  // If there are no events, set filtered events to empty array
  if (!state.events || state.events.length === 0) {
    state.filteredEvents = []
    return
  }

  // Deserialize events for processing
  const deserializedEvents = state.events.map(deserializeEvent)

  // Format staff members for filtering
  const careWorkerMembers = state.careWorkers.map((staff) => ({
    id: staff.id,
    name: `${staff.firstName} ${staff.lastName}`,
    role: staff.role || "CARE_WORKER",
    color: staff.color || "#000000",
    avatar: staff.profile?.avatarUrl || "",
    selected: staff.selected || true,
  }))

  const officeStaffMembers = state.officeStaff.map((staff) => ({
    id: staff.id,
    name: `${staff.firstName} ${staff.lastName}`,
    role: staff.role || "OFFICE_STAFF",
    color: staff.color || "#000000",
    avatar: staff.profile?.avatarUrl || "",
    selected: staff.selected || true,
  }))

  // Format clients for filtering
  const formattedClients = state.clients.map((client) => ({
    id: client.id,
    name: `${client.firstName} ${client.lastName}`,
    color: client.color || "#000000",
    avatar: client.profile?.avatarUrl || "",
    selected: client.selected || true,
  }))

  // No event types anymore, so we'll pass an empty array
  const eventTypes: any[] = []

  // Filter events based on current selections
  const filtered = filterEvents(
    deserializedEvents,
    careWorkerMembers,
    officeStaffMembers,
    formattedClients,
    eventTypes,
    state.sidebarMode,
  )

  // Serialize filtered events before storing in state
  state.filteredEvents = filtered.map(serializeEvent)

  // Log for debugging
  console.log("Updated filtered events:", state.filteredEvents.length)
}

// Helper function to get event color based on type
function getEventColor(type: string): string {
  switch (type) {
    case "APPOINTMENT":
      return "#4f46e5" // indigo
    case "CHECKUP":
    case "WEEKLY_CHECKUP":
      return "#10b981" // emerald
    case "EMERGENCY":
      return "#ef4444" // red
    case "ROUTINE":
      return "#8b5cf6" // purple
    case "HOME_VISIT":
      return "#059669" // green
    default:
      return "#6b7280" // gray
  }
}

export const {
  setOfficeStaff,
  setCareWorkers,
  setClients,
  setEvents,
  setFilteredEvents,
  setSidebarMode,
  toggleEventTypeSelection,
  addEvent,
  updateEvent,
  deleteEvent,
  clearUserError,
} = userSlice.actions
export default userSlice.reducer

