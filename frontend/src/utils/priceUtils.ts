export interface SpreadInfo {
  value: number;
  direction: "reya-higher" | "hyperliquid-higher" | "equal";
  color: string;
}

export const calculateSpread = (
  reyaPrice?: number,
  hyperliquidPrice?: number
): SpreadInfo | null => {
  if (!reyaPrice || !hyperliquidPrice) return null;

  const minPrice = Math.min(reyaPrice, hyperliquidPrice);
  const spread = (Math.abs(reyaPrice - hyperliquidPrice) / minPrice) * 100;

  // Determine direction and color based on which price is higher
  let direction: SpreadInfo["direction"] = "equal";
  let color = "#8c8c8c"; // Equal prices - gray

  if (reyaPrice > hyperliquidPrice) {
    direction = "reya-higher";
    color = "#1890ff"; // Reya higher - blue
  } else if (hyperliquidPrice > reyaPrice) {
    direction = "hyperliquid-higher";
    color = "#722ed1"; // Hyperliquid higher - purple
  }

  return {
    value: spread,
    direction,
    color,
  };
};

export const getDirectionLabel = (
  direction: SpreadInfo["direction"]
): string => {
  switch (direction) {
    case "reya-higher":
      return "Reya Price Higher";
    case "hyperliquid-higher":
      return "Hyperliquid Price Higher";
    case "equal":
      return "Equal Prices";
    default:
      return "";
  }
};
