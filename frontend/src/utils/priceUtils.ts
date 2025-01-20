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

  // Determine direction
  let direction: SpreadInfo["direction"] = "equal";
  if (reyaPrice > vertexPrice) {
    direction = "reya-higher";
  } else if (vertexPrice > reyaPrice) {
    direction = "vertex-higher";
  }

  // Color based on spread magnitude
  let color = "#52c41a"; // Small spread - green
  if (spread > 1) {
    color = "#faad14"; // Medium spread - yellow
  }
  if (spread > 2) {
    color = "#f5222d"; // Large spread - red
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
