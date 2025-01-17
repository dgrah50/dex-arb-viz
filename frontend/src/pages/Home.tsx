import React, { useCallback, useEffect, useMemo } from "react";
import { Input, DatePicker, Spin } from "antd";
import { createStyles } from "antd-style";
import { useGlobalStore } from "../store/store";
import { useDatasets } from "../hooks/useDatasets";
import { useAvailableDates } from "../hooks/useAvailableDates";
import dayjs from "dayjs";
import { rangePresets } from "../utils/misc";
import DatasetSelect from "../components/Home/DatasetSelect";
import FilterItem from "../components/Home/FilterItem";
import FilterSection from "../components/Home/FilterSection";
import { CryptoGrid } from "../components/Home/CryptoGrid";
import { useValidOccurrencesForKeysWithNDayShift } from "../hooks/useValidCryptoDataWithNDayShift";

const { RangePicker } = DatePicker;

const useHomeStyles = createStyles(() => ({
  container: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    gap: 16,
    padding: 16,
  },
  cryptoGridContainer: { flex: 1 },
}));

export const Home: React.FC = () => {
  const { styles } = useHomeStyles();

  const { data: allDataSets, isLoading: isDatasetsLoading } = useDatasets();

  const {
    datesHaveLoaded,
    endDate,
    percentageChange,
    selectedDatasets,
    startDate,
    nDayShift,
    setDatesHaveLoaded,
    setEndDate,
    setnDayShift,
    setPercentageChange,
    setSelectedDatasets,
    setStartDate,
  } = useGlobalStore((state) => state);

  const { data: availableDates } = useAvailableDates(selectedDatasets[0]);

  // Set a valid date range (the last week in the dataset) when the number of selected datasets goes from 0 to 1,
  // so that the user gets to see some data instantly
  useEffect(() => {
    if (!datesHaveLoaded && availableDates?.length) {
      setDatesHaveLoaded(true);
      const latestDate = dayjs(availableDates[availableDates.length - 1]);
      const earliestDate = latestDate.subtract(6, "day");
      setStartDate(earliestDate.format("YYYY-MM-DD"));
      setEndDate(latestDate.format("YYYY-MM-DD"));
    }
  }, [
    availableDates,
    datesHaveLoaded,
    setDatesHaveLoaded,
    setEndDate,
    setStartDate,
  ]);

  const { data: validOccurrences, isLoading: isCryptoDataLoading } =
    useValidOccurrencesForKeysWithNDayShift(
      selectedDatasets,
      percentageChange,
      startDate,
      endDate,
      nDayShift
    );

  const handleDatasetChange = useCallback(
    (selectedItems: string[]) => {
      setSelectedDatasets(selectedItems);
    },
    [setSelectedDatasets]
  );

  const datasetOptions = useMemo(
    () =>
      allDataSets?.map((dataset: string) => ({
        label: dataset,
        value: dataset,
      })),
    [allDataSets]
  );

  const selectAllDatasets = useCallback(() => {
    setSelectedDatasets(allDataSets ?? []);
  }, [allDataSets, setSelectedDatasets]);

  const clearAllDatasets = useCallback(() => {
    setSelectedDatasets([]);
  }, [setSelectedDatasets]);

  return (
    <div className={styles.container}>
      <FilterSection>
        <FilterItem label="Select Datasets">
          {isDatasetsLoading ? (
            <Spin />
          ) : (
            <DatasetSelect
              datasetOptions={datasetOptions ?? []}
              selectedDatasets={selectedDatasets}
              handleDatasetChange={handleDatasetChange}
              selectAllDatasets={selectAllDatasets}
              clearAllDatasets={clearAllDatasets}
            />
          )}
        </FilterItem>
        <FilterItem label="Minimum Percentage Change">
          <Input
            type="number"
            placeholder="Minimum Percentage Drop"
            value={percentageChange}
            onChange={(e) => setPercentageChange(Number(e.target.value))}
          />
        </FilterItem>
        <FilterItem label="Number of days to view pct. change over">
          <Input
            type="number"
            placeholder="Days to view pct. change over"
            value={nDayShift}
            onChange={(e) => setnDayShift(Number(e.target.value))}
          />
        </FilterItem>
        <FilterItem label="Date Range">
          <RangePicker
            value={
              startDate && endDate
                ? [dayjs(startDate), dayjs(endDate)]
                : undefined
            }
            presets={rangePresets}
            onChange={(_, dateStrings) => {
              setStartDate(dateStrings[0]);
              setEndDate(dateStrings[1]);
            }}
          />
        </FilterItem>
      </FilterSection>
      <div className={styles.cryptoGridContainer}>
        <CryptoGrid
          data={validOccurrences || []}
          isLoading={isCryptoDataLoading}
        />
      </div>
    </div>
  );
};

export default Home;
