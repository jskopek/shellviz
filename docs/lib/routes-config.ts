// for page navigation & to sort on leftbar

export type EachRoute = {
  title: string;
  href: string;
  noLink?: true; // noLink will create a route segment (section) but cannot be navigated
  items?: EachRoute[];
};

export const ROUTES: EachRoute[] = [
  { title: "Introduction", href: "/introduction" },
  { title: "Getting Started", href: "/getting-started", },
  { title: "Visualizations", href: "/visualizations", items: [
      { title: "Log", href: "#log" },
      { title: "Table", href: "#table" },
      { title: "JSON", href: "#json" },
      { title: "Card", href: "#card" },
      { title: "Markdown", href: "#markdown" },
      { title: "Number", href: "#number" },
      { title: "Progress", href: "#progress" },
      { title: "Bar", href: "#bar" },
      { title: "Area", href: "#area" },
      { title: "Pie", href: "#pie" },
      { title: "Location", href: "#location" },
      { title: "Raw", href: "#raw" }
    ],
  },
  { title: "Troubleshooting", href: "/troubleshooting", },
  { title: "Release Notes", href: "/release-notes", },
]

type Page = { title: string; href: string };

function getRecurrsiveAllLinks(node: EachRoute) {
  const ans: Page[] = [];
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  node.items?.forEach((subNode) => {
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    ans.push(...getRecurrsiveAllLinks(temp));
  });
  return ans;
}

export const page_routes = ROUTES.map((it) => getRecurrsiveAllLinks(it)).flat();
