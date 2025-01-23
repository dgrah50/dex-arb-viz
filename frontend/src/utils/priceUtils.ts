export interface SpreadInfo {
  value: number;
  direction: "reya-higher" | "vertex-higher" | "equal";
  color: string;
}

export const calculateSpread = (
  reyaPrice?: number,
  vertexPrice?: number
): SpreadInfo | null => {
  if (!reyaPrice || !vertexPrice) return null;

  // Calculate spread using minimum price as denominator
  const minPrice = Math.min(reyaPrice, vertexPrice);
  const spread = (Math.abs(reyaPrice - vertexPrice) / minPrice) * 100;

  // Determine direction and color based on which price is higher
  let direction: SpreadInfo["direction"] = "equal";
  let color = "#8c8c8c"; // Equal prices - gray

  if (reyaPrice > vertexPrice) {
    direction = "reya-higher";
    color = "#1890ff"; // Reya higher - blue
  } else if (vertexPrice > reyaPrice) {
    direction = "vertex-higher";
    color = "#722ed1"; // Vertex higher - purple
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
    case "vertex-higher":
      return "Vertex Price Higher";
    case "equal":
      return "Equal Prices";
    default:
      return "";
  }
};
