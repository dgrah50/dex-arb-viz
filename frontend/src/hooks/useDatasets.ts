import { useQuery } from "@tanstack/react-query";
import { fetchDatasets } from "../api/cryptoApi";

export const useDatasets = () => {
  return useQuery<Array<string>>({
    queryKey: ["datasets"],
    queryFn: fetchDatasets,
    retry: true, // Retry infinitely
    retryDelay: 10000, // Retry every 10 seconds (10000 milliseconds)
  });
};
