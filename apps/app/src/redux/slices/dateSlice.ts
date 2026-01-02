import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

interface DateState {
  selectedDate: string | null;
  lastUpdated: number; // Add timestamp to prevent unnecessary updates
}

const toDateKey = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value || "").slice(0, 10);
};

const initialState: DateState = {
  selectedDate: new Date().toISOString().slice(0, 10),
  lastUpdated: Date.now(),
};

const dateSlice = createSlice({
  name: "date",
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<Date | string>) => {
      const newDateString = toDateKey(action.payload);

      // Only update if the date actually changed
      if (state.selectedDate !== newDateString) {
        state.selectedDate = newDateString;
        state.lastUpdated = Date.now();
      }
    },
    resetDate: (state) => {
      state.selectedDate = new Date().toISOString().slice(0, 10);
      state.lastUpdated = Date.now();
    },
  },
});

export const { setSelectedDate, resetDate } = dateSlice.actions;

// Selectors
export const selectSelectedDateString = (state: { date: DateState }) => state.date.selectedDate;

export const selectSelectedDate = createSelector([selectSelectedDateString], (dateString) =>
  dateString ? new Date(`${dateString}T12:00:00.000Z`) : null
);

export default dateSlice.reducer;
