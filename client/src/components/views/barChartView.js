import { useEffect, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { getBarChartData } from "../../utils/helpers";
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { isValidBarChartData } from "../../utils/dataValidator";

// API: https://nivo.rocks/bar/
// To display the pie chart, we need to pass in the data as an array of objects
// something like this:
// const data = [
//   {
//     country: "AD",
//     "hot dog": 105,
//     burger: 129,
//     sandwich: 37,
//     kebab: 119,
//     fries: 53,
//     donut: 69,
//   },
//   {
//     country: "AE",
//     "hot dog": 41,
//     burger: 14,
//     sandwich: 181,
//     kebab: 166,
//     fries: 36,
//     donut: 105,
//   },
// ];

const DataSelectorWidget = ({ options, selected, changeHandler }) => (
  <div className="text-center">
    <select
      name="data-selector"
      className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      value={selected}
      onChange={changeHandler}
    >
      {options &&
        options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
    </select>
  </div>
);

export const BarChartView = {
  name: "bar",
  label: "Bar Chart",
  icon: faChartSimple,
  evaluator: (value) => isValidBarChartData(value),
  Component: ({ data }) => {
    const [chartState, setChartState] = useState({});

    useEffect(() => {
      const [aggrKeys, keys, barChartData] = getBarChartData(data);
      setChartState({
        selected: aggrKeys[0],
        aggregationKeys: aggrKeys,
        groupedKeys: keys,
        dataToDisplay: barChartData,
      });
    }, [data]);

    const handleChange = (e) => {
      const newValue = e.target.value;
      // eslint-disable-next-line no-unused-vars
      const [_, keys, barChartData] = getBarChartData(data, newValue);
      setChartState({
        ...chartState,
        selected: newValue,
        groupedKeys: keys,
        dataToDisplay: barChartData,
      });
    };

    const { selected, aggregationKeys, groupedKeys, dataToDisplay } = chartState;
    if (!dataToDisplay) return (<div></div>)

    return (
      <div className="h-96 bg-gray-200 p-4 rounded-md flex flex-col">
        <ResponsiveBar
          data={dataToDisplay}
          keys={groupedKeys}
          indexBy={selected}
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "nivo" }}
          defs={[
            {
              id: "dots",
              type: "patternDots",
              background: "inherit",
              color: "#38bcb2",
              size: 4,
              padding: 1,
              stagger: true,
            },
            {
              id: "lines",
              type: "patternLines",
              background: "inherit",
              color: "#eed312",
              rotation: -45,
              lineWidth: 6,
              spacing: 10,
            },
          ]}
          borderColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: [selected],
            legendPosition: "middle",
            legendOffset: 32,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "occurrence",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: "hover",
                  style: {
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          role="application"
          ariaLabel="bar chart"
        />
        <DataSelectorWidget
          options={aggregationKeys}
          selected={selected}
          changeHandler={handleChange}
        />
      </div>
    );
  }
}
