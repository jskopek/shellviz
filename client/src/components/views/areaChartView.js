import { ResponsiveLine } from "@nivo/line";
import { getAreaChartData } from "../../utils/helpers";
import { faChartArea } from "@fortawesome/free-solid-svg-icons";
import { isValidAreaChartData } from "../../utils/dataValidator";

// API: https://nivo.rocks/line/
// To display the area chart, we need to pass in the data as an array of objects
// something like this:
// const data = [
//   {
//     id: "test",
//     data: [
//       {
//         x: "0",
//         y: 179,
//       },
//       {
//         x: "helicopter",
//         y: 15,
//       },
//       {
//         x: "boat",
//         y: 281,
//       },
//     ],
//   },
// ];

export const AreaChartView = {
  name: "area",
  lable: "Area Chart",
  icon: faChartArea,
  evaluator: (value) => isValidAreaChartData(value),
  Component: ({ data }) => {
    const areaChartData = getAreaChartData(data);
    return (
      <div className="h-96 bg-gray-200 p-4 rounded-md">
        <ResponsiveLine
          data={areaChartData}
          margin={{ top: 50, right: 10, bottom: 50, left: 50 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            stacked: true,
            reverse: false,
          }}
          yFormat=" >-.2f"
          curve="cardinal"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            orient: "bottom",
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            orient: "left",
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "count",
            legendOffset: -40,
            legendPosition: "middle",
          }}
          pointSize={10}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={-12}
          enableArea
          useMesh
        />
      </div>
    );
  }
}
