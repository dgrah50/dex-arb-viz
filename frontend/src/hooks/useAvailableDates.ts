import { useQuery } from "@tanstack/react-query";
import { fetchAvailableDates } from "../api/cryptoApi";

export const useAvailableDates = (key: string) => {
  return useQuery<string[]>({
    queryKey: ["availableDates", key],
    queryFn: () => fetchAvailableDates(key),
    enabled: !!key,
  });
};
