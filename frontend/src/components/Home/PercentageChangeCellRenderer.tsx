import React from "react";
import { ICellRendererParams } from "@ag-grid-community/core";

export const PercentageChangeCellRenderer: React.FC<ICellRendererParams> = (
  params
) => {
  const maxValue = params.context.maxPctChange;
  const value = params.value.toFixed(2);
  const intensity = maxValue !== 0 ? Math.abs(value) / maxValue : 0;

  const color =
    value > 0 ? `rgba(0,255,0,${intensity})` : `rgba(255,0,0,${intensity})`;

  return (
    <div
      style={{
        backgroundColor: color,
        padding: "5px",
        textAlign: "right",
        color: "#000",
      }}
    >
      {value}%
    </div>
  );
};
