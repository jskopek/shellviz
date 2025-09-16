import { ReactNode } from "react";
import { ROUTES } from "@/lib/routes-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type HeadingLevel = 1 | 2 | 3;

export default function VizHeading({
  slug,
  children,
  level = 2,
}: {
  slug: string;
  children?: ReactNode;
  level?: HeadingLevel;
}) {
  const visualizationsRoute = ROUTES.find((r) => r.href === "/visualizations");
  const matchingItem = visualizationsRoute?.items?.find(
    (it) => it.href === `#${slug}`
  ) as unknown as { title?: string; icon?: any } | undefined;

  const icon = matchingItem?.icon;
  const resolvedTitle = (children as ReactNode) ?? matchingItem?.title ?? slug;

  const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as keyof JSX.IntrinsicElements;

  return (
    <Tag id={slug} className="flex items-center gap-2 mt-5 mb-10 scroll-m-20 border-b border-gray-300 pb-2">
      {icon && <FontAwesomeIcon icon={icon} className="text-primary" />}
      <span>{resolvedTitle}</span>
    </Tag>
  );
}


