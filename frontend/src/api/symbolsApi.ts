const BASE_URL = "http://localhost:3000";

export const fetchAvailableSymbols = async (): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/symbols`);
  if (!response.ok) {
    throw new Error(`Error fetching symbols: ${response.statusText}`);
  }
  return response.json();
};
