import { fetchValidOccurrencesForGivenDatasetsForNDayShift } from "./../api/cryptoApi";
import { useQuery } from "@tanstack/react-query";
import { CryptoData } from "../api/cryptoApi";

export const useValidOccurrencesForKeysWithNDayShift = (
  keys: string[],
  percentage_change: number,
  start_date: string,
  end_date: string,
  day_shift: number
) => {
  return useQuery<Array<CryptoData>>({
    queryKey: [
      "validOccurrencesWithNDayShift",
      keys,
      percentage_change,
      start_date,
      end_date,
      day_shift,
    ],
    queryFn: () =>
      fetchValidOccurrencesForGivenDatasetsForNDayShift(
        keys,
        percentage_change,
        start_date,
        end_date,
        day_shift
      ),
    enabled: !!keys && !!start_date && !!end_date && !!day_shift,
  });
};
