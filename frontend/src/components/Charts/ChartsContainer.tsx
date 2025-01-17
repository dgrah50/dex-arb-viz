import React from "react";
import Highcharts, { Options } from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";
import stockTools from "highcharts/modules/stock-tools";
import { createStyles, cx } from "antd-style";

import indicatorsAll from "highcharts/indicators/indicators-all";
import annotationsAdvanced from "highcharts/modules/annotations-advanced";
import priceIndicator from "highcharts/modules/price-indicator";
import fullScreen from "highcharts/modules/full-screen";

indicatorsAll(Highcharts);
annotationsAdvanced(Highcharts);
priceIndicator(Highcharts);
fullScreen(Highcharts);
stockTools(Highcharts);

const useChartContainerStyles = createStyles(() => ({
  chartContainer: { flex: 1, height: "100%" },
}));

interface ChartContainerProps {
  options: Options;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ options }) => {
  const { styles } = useChartContainerStyles();

  return (
    <div className={cx(styles.chartContainer, "highcharts-light")}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        constructorType={"stockChart"}
        containerProps={{ style: { height: "100%" } }}
      />
    </div>
  );
};

export default ChartContainer;
