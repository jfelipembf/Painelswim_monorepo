import { useEffect, useRef } from "react";

// @mui material components
import MDBox from "components/MDBox";
import MDDatePicker from "components/MDDatePicker";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { setSelectedDate, selectSelectedDate } from "../../redux/slices/dateSlice";

// Sales dashboard components
import { Portuguese } from "flatpickr/dist/l10n/pt";

function HeaderDatePicker() {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector(selectSelectedDate) || new Date();
  const localDateRef = useRef(selectedDate);

  const toDateKey = (d: Date): string => String(d.toISOString()).slice(0, 10);

  // Only update Redux if date actually changed
  const handleDateChange = (dates: any[]) => {
    const next = dates?.[0];
    if (next instanceof Date && !Number.isNaN(next.getTime())) {
      const nextKey = toDateKey(next);
      const currentKey = localDateRef.current ? toDateKey(localDateRef.current) : "";
      if (!currentKey || currentKey !== nextKey) {
        localDateRef.current = next;
        dispatch(setSelectedDate(nextKey));
      }
    }
  };

  // Sync local ref with Redux state
  useEffect(() => {
    if (
      selectedDate &&
      (!localDateRef.current || localDateRef.current.getTime() !== selectedDate.getTime())
    ) {
      localDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  return (
    <MDBox sx={{ width: 220 }}>
      <MDDatePicker
        value={selectedDate ? [selectedDate] : []}
        options={{
          dateFormat: "d/m/Y",
          locale: Portuguese,
        }}
        onChange={handleDateChange}
        input={{
          label: "Data",
          fullWidth: true,
        }}
      />
    </MDBox>
  );
}

export default HeaderDatePicker;
