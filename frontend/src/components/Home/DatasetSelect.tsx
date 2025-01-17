import React from "react";
import { Select, Button, Divider } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { createStyles } from "antd-style";

const useDatasetSelectStyles = createStyles(() => ({
  select: { width: "100%" },
  dropdown: { display: "flex", justifyContent: "space-between" },
}));

interface DatasetSelectProps {
  datasetOptions: { label: string; value: string }[];
  selectedDatasets: string[];
  handleDatasetChange: (selectedItems: string[]) => void;
  selectAllDatasets: () => void;
  clearAllDatasets: () => void;
}

const DatasetSelect: React.FC<DatasetSelectProps> = ({
  datasetOptions,
  selectedDatasets,
  handleDatasetChange,
  selectAllDatasets,
  clearAllDatasets,
}) => {
  const { styles } = useDatasetSelectStyles();

  return (
    <Select
      mode="multiple"
      className={styles.select}
      placeholder="Select datasets"
      maxTagCount="responsive"
      options={datasetOptions}
      value={selectedDatasets}
      onChange={handleDatasetChange}
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: "8px 0" }} />
          <div className={styles.dropdown}>
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={selectAllDatasets}
            >
              Select All
            </Button>
            <Button
              type="text"
              icon={<MinusCircleOutlined />}
              onClick={clearAllDatasets}
            >
              Clear All
            </Button>
          </div>
        </>
      )}
    />
  );
};

export default DatasetSelect;
