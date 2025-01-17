import React, { ReactNode } from "react";
import { createStyles } from "antd-style";

const useFilterItemStyles = createStyles(() => ({
  filterItem: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: { display: "block", marginBottom: 8 },
}));

interface FilterItemProps {
  label: string;
  children: ReactNode;
}

const FilterItem: React.FC<FilterItemProps> = ({ label, children }) => {
  const { styles } = useFilterItemStyles();
  return (
    <div className={styles.filterItem}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
};

export default FilterItem;
