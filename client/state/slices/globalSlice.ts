import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface testState {
  test: string;
}

interface InitialStateTypes {
  test: testState;
}

export const initialState: InitialStateTypes = {
  test: {
    test: "test",
  },
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setTest: (state, action: PayloadAction<Partial<testState>>) => {
      state.test = { ...state.test, ...action.payload };
    },
  },
});

export const { setTest } = globalSlice.actions;

export default globalSlice.reducer;
