import React, { useCallback, useMemo } from "react";
import { useGlobalStore } from "../store/store";
import { Spin, Empty } from "antd";
import { createStyles } from "antd-style";

import { useCandlestickData } from "../hooks/useCandleStickData";
import { useDatasets } from "../hooks/useDatasets";
import { Options } from "highcharts";
import FilterSection from "../components/Charts/FilterSection";
import ChartContainer from "../components/Charts/ChartsContainer";

const useChartsStyles = createStyles(() => ({
  container: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    gap: 16,
    padding: 16,
  },
  spin: {
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export const Charts: React.FC = () => {
  const {
    drilldownDataset,
    graphStartDate,
    graphEndDate,
    setDrilldownDataset,
    setGraphEndDate,
    setGraphStartDate,
  } = useGlobalStore((state) => state);

  const { data: candlestickData, isLoading } = useCandlestickData(
    drilldownDataset || "",
    graphStartDate || "",
    graphEndDate || ""
  );

  const { styles } = useChartsStyles();
  const { data: allDataSets, isLoading: isDatasetsLoading } = useDatasets();

  const handleDatasetChange = useCallback(
    (selectedDataset: string) => {
      setDrilldownDataset(selectedDataset);
    },
    [setDrilldownDataset]
  );

  const datasetOptions = useMemo(
    () =>
      allDataSets?.map((dataset: string) => ({
        label: dataset,
        value: dataset,
      })),
    [allDataSets]
  );

  const options = useMemo<Options>(() => {
    if (!candlestickData) {
      return {
        title: {
          text: `${drilldownDataset} Candlestick Chart`,
        },
        series: [],
        plotOptions: {
          candlestick: {
            upColor: "green",
            color: "red",
            lineColor: "red",
            upLineColor: "green",
          },
        },
      };
    }

    const formattedData = candlestickData
      .filter((data) => data.OPEN_TIME !== null)
      .map((data) => [
        new Date(data.OPEN_TIME!).getTime(),
        data.OPEN,
        data.HIGH,
        data.LOW,
        data.CLOSE,
      ]);

    return {
      title: {
        text: `${drilldownDataset} Candlestick Chart`,
      },
      series: [
        {
          type: "candlestick",
          name: drilldownDataset ?? "",
          data: formattedData,
        },
      ],
      rangeSelector: {
        selected: 0,
        inputEnabled: false,
      },
      plotOptions: {
        candlestick: {
          upColor: "green",
          color: "red",
          lineColor: "red",
          upLineColor: "green",
        },
      },
      stockTools: {
        gui: {
          enabled: true,
        },
      },
    };
  }, [candlestickData, drilldownDataset]);

  return (
    <div className={styles.container}>
      <FilterSection
        isDatasetsLoading={isDatasetsLoading}
        datasetOptions={datasetOptions ?? []}
        drilldownDataset={drilldownDataset}
        handleDatasetChange={handleDatasetChange}
        graphStartDate={graphStartDate}
        graphEndDate={graphEndDate}
        setGraphStartDate={setGraphStartDate}
        setGraphEndDate={setGraphEndDate}
      />
      {!drilldownDataset ? (
        <Empty description="No Dataset Selected" />
      ) : isLoading ? (
        <Spin className={styles.spin} />
      ) : options.series == null || options.series.length === 0 ? (
        <Empty description="No Data for Selected Date Range" />
      ) : (
        <ChartContainer options={options} />
      )}
    </div>
  );
};
