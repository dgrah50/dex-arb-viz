import React from "react";
import { Select, DatePicker, Spin } from "antd";
import dayjs from "dayjs";
import { createStyles } from "antd-style";
import { rangePresets } from "../../utils/misc";

const { RangePicker } = DatePicker;

const useFilterSectionStyles = createStyles(() => ({
  filterSection: { display: "flex", gap: 16, flexWrap: "wrap" },
  filterItem: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: { display: "block", marginBottom: 8 },
  select: { width: "100%" },
}));

interface FilterSectionProps {
  isDatasetsLoading: boolean;
  datasetOptions: { label: string; value: string }[];
  drilldownDataset?: string | null;
  handleDatasetChange: (selectedDataset: string) => void;
  graphStartDate?: string | null;
  graphEndDate?: string | null;
  setGraphStartDate: (date: string) => void;
  setGraphEndDate: (date: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  isDatasetsLoading,
  datasetOptions,
  drilldownDataset,
  handleDatasetChange,
  graphStartDate,
  graphEndDate,
  setGraphStartDate,
  setGraphEndDate,
}) => {
  const { styles } = useFilterSectionStyles();

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterItem}>
        <label className={styles.label}>Select Datasets</label>
        {isDatasetsLoading ? (
          <Spin />
        ) : (
          <Select
            className={styles.select}
            placeholder="Select dataset"
            maxTagCount="responsive"
            options={datasetOptions}
            value={drilldownDataset}
            onChange={handleDatasetChange}
          />
        )}
      </div>
      <div className={styles.filterItem}>
        <label className={styles.label}>Date Range</label>
        <RangePicker
          value={
            graphStartDate && graphEndDate
              ? [dayjs(graphStartDate), dayjs(graphEndDate)]
              : undefined
          }
          presets={rangePresets}
          onChange={(_, dateStrings) => {
            setGraphStartDate(dateStrings[0]);
            setGraphEndDate(dateStrings[1]);
          }}
        />
      </div>
    </div>
  );
};

export default FilterSection;
