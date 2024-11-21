import { faHashtag } from "@fortawesome/free-solid-svg-icons";
import { isNumeric } from "../../utils/dataValidator";

export const NumberDataView = {
  name: "number",
  label: "Number",
  icon: faHashtag,
  evaluator: (value) => isNumeric(value),
  component: ({ data }) => {
    const newValue = data.toLocaleString();
    const className = `text-gray-700 text-center py-3 ${newValue.length > 25 ? "text-1xl" : "text-3xl"
      }`;
    const style = {
      backgroundImage:
        "radial-gradient(50% 60%, #EBEBEB 7%, rgba(255, 255, 255, 0) 70%)",
    };
    return (
      <div className={className} style={style}>
        {newValue}
      </div>
    );
  }
}