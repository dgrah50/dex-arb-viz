import React, { ReactNode } from "react";
import { createStyles } from "antd-style";

const useFilterSectionStyles = createStyles(() => ({
  filterSection: { display: "flex", gap: 16, flexWrap: "wrap" },
}));

interface FilterSectionProps {
  children: ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ children }) => {
  const { styles } = useFilterSectionStyles();
  return <div className={styles.filterSection}>{children}</div>;
};

export default FilterSection;
