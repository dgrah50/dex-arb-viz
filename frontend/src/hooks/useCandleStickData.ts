import { useQuery } from "@tanstack/react-query";
import { CryptoData, fetchCandlestickData } from "../api/cryptoApi";

export const useCandlestickData = (
  key: string,
  start_date: string,
  end_date: string
) => {
  return useQuery<Array<CryptoData>>({
    queryKey: ["candlestickData", key, start_date, end_date],
    queryFn: () => fetchCandlestickData(key, start_date, end_date),

    enabled: !!key && !!start_date && !!end_date,
  });
};
