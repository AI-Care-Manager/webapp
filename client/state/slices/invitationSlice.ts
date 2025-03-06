import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api, Invitation, Client, CreateInvitationInput, CancelInvitationInput } from "../api";

interface InvitationState {
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: InvitationState = {
  loading: false,
  error: null,
};

// Invitations Slice
const invitationsSlice = createSlice({
  name: "invitations",
  initialState,
  reducers: {
    clearInvitationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle loading states from API
      .addMatcher(
        api.endpoints.getUserInvitations.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        api.endpoints.getUserInvitations.matchFulfilled,
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        api.endpoints.getUserInvitations.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to fetch invitations";
        }
      )
      
      // Create Invitation
      .addMatcher(
        api.endpoints.createInvitation.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        api.endpoints.createInvitation.matchFulfilled,
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        api.endpoints.createInvitation.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to create invitation";
        }
      )
      
      // Cancel Invitation
      .addMatcher(
        api.endpoints.cancelInvitation.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        api.endpoints.cancelInvitation.matchFulfilled,
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        api.endpoints.cancelInvitation.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to cancel invitation";
        }
      );
  },
});

export const { clearInvitationError } = invitationsSlice.actions;
export default invitationsSlice.reducer;