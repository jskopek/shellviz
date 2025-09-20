import { EachRoute } from "@/lib/routes-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Anchor from "./anchor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SubLink({
  title,
  href,
  items,
  noLink,
  icon,
  level,
  isSheet,
}: EachRoute & { level: number; isSheet: boolean }) {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(level == 0);

  useEffect(() => {
    if (path == href || path.includes(href)) setIsOpen(true);
  }, [href, path]);

  const Comp = (
    <Anchor
      href={href}
      className={cn(
        "block w-full rounded-md py-1.5 transition-all duration-150 pr-2 text-left",
        "hover:bg-accent/60 dark:hover:bg-secondary/40 hover:translate-x-0.5",
        level > 0 ? "pl-4 sm:text-[0.93rem] text-foreground/90" : "pl-2 font-medium"
      )}
      activeClassName={cn(
        "text-primary font-medium bg-accent/80 dark:bg-secondary/60"
      )}
    >
      {icon && (
        <span className="inline-flex items-center mr-2 w-3 shrink-0">
          <FontAwesomeIcon icon={icon} size="sm" />
        </span>
      )}
      {title}
    </Anchor>
  );

  const titleOrLink = !noLink ? (
    isSheet ? (
      <SheetClose asChild>{Comp}</SheetClose>
    ) : (
      Comp
    )
  ) : (
    <h4
      className={cn(
        "font-medium sm:text-sm text-primary rounded-md py-1.5",
        level > 0 ? "px-2" : "px-0"
      )}
    >
      {title}
    </h4>
  );

  if (!items) {
    return titleOrLink;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full pr-5 rounded-md transition-colors duration-150 hover:bg-accent/60 dark:hover:bg-secondary/40">
          <div className="flex items-center justify-between cursor-pointer w-full">
            {titleOrLink}
            <span>
              {!isOpen ? (
                <ChevronRight className="h-[0.9rem] w-[0.9rem]" />
              ) : (
                <ChevronDown className="h-[0.9rem] w-[0.9rem]" />
              )}
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={cn(
              "flex flex-col items-start sm:text-sm dark:text-stone-300/85 text-stone-800 gap-1",
              level > 0 && "pl-5 border-l ml-2"
            )}
          >
            {items?.map((innerLink) => {
              const modifiedItems = {
                ...innerLink,
                href: `${href + innerLink.href}`,
                level: level + 1,
                isSheet,
              };
              return <SubLink key={modifiedItems.href} {...modifiedItems} />;
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
