import { useQuery } from "@tanstack/react-query";
import {
  CryptoData,
  fetchValidOccurrencesForGivenDatasets,
} from "../api/cryptoApi";

export const useValidOccurrencesForKeys = (
  keys: string[],
  percentage_change: number,
  start_date: string,
  end_date: string
) => {
  return useQuery<Array<CryptoData>>({
    queryKey: [
      "validOccurrences",
      keys,
      percentage_change,
      start_date,
      end_date,
    ],
    queryFn: () =>
      fetchValidOccurrencesForGivenDatasets(
        keys,
        percentage_change,
        start_date,
        end_date
      ),
    enabled: !!keys && !!start_date && !!end_date,
  });
};
