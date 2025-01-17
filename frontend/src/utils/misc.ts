import { TimeRangePickerProps } from "antd";
import dayjs from "dayjs";

export function isNotNullOrUndefined<T extends object>(
  input: null | undefined | T
): input is T {
  return input != null;
}

// Included range presets for presentation, the data isn't actually that fresh so we aren't
// gonna get anything for these data ranges
export const rangePresets: TimeRangePickerProps["presets"] = [
  { label: "Last 7 Days", value: [dayjs().add(-7, "d"), dayjs()] },
  { label: "Last 14 Days", value: [dayjs().add(-14, "d"), dayjs()] },
  { label: "Last 30 Days", value: [dayjs().add(-30, "d"), dayjs()] },
  { label: "Last 90 Days", value: [dayjs().add(-90, "d"), dayjs()] },
];
