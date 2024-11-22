import { ResponsivePie } from "@nivo/pie";
import { getPieChartData } from "../../utils/helpers";
import { faChartPie } from "@fortawesome/free-solid-svg-icons";
import { isValidPieChartData } from "../../utils/dataValidator";

// API: https://nivo.rocks/pie/
// To display the pie chart, we need to pass in the data as an array of objects
// something like this:
// const data = [
//   {
//     id: "java",
//     value: 204,
//   },
//   {
//     id: "hack",
//     value: 23,
//   },
//   {
//     id: "make",
//     value: 537,
//   },
//   {
//     id: "go",
//     value: 295,
//   },
//   {
//     id: "python",
//     value: 177,
//   },
// ];

export const PieChartView = {
  name: "pie",
  label: "Pie Chart",
  icon: faChartPie,
  evaluator: (value) => isValidPieChartData(value),
  Component: ({ data }) => {
    const pieChartData = getPieChartData(data);
    return (
      <div className="h-96 bg-gray-200 p-4 rounded-md">
        <ResponsivePie
          data={pieChartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          defs={[
            {
              id: "dots",
              type: "patternDots",
              background: "inherit",
              color: "rgba(255, 255, 255, 0.3)",
              size: 4,
              padding: 1,
              stagger: true,
            },
            {
              id: "lines",
              type: "patternLines",
              background: "inherit",
              color: "rgba(255, 255, 255, 0.3)",
              rotation: -45,
              lineWidth: 6,
              spacing: 10,
            },
          ]}
          legends={[
            {
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 56,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: "#999",
              itemDirection: "left-to-right",
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: "circle",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: "#000",
                  },
                },
              ],
            },
          ]}
        />
      </div>
    );
  }
};
