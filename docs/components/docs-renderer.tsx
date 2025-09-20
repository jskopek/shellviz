import Pagination from "@/components/pagination";
import Toc from "@/components/toc";
import { getDocsForSlug } from "@/lib/markdown";
import { Typography } from "@/components/typography";
import { notFound } from "next/navigation";

type DocsRendererProps = {
  pathName: string;
};

export async function DocsRenderer({ pathName }: DocsRendererProps) {
  const res = await getDocsForSlug(pathName);

  if (!res) notFound();
  return (
    <div className="flex items-start gap-10">
      <div className="flex-[4.5] pt-4">
        <Typography>
          <h1 className="text-3xl !-mt-0.5">{res.frontmatter.title}</h1>
          <p className="-mt-4 text-muted-foreground text-[16.5px]">
            {res.frontmatter.description}
          </p>
          <div>{res.content}</div>
          <Pagination pathname={pathName} />
        </Typography>
      </div>
      <Toc path={pathName} />
    </div>
  );
}

export async function generateDocsMetadata({ pathName }: { pathName: string }) {
    const res = await getDocsForSlug(pathName);
    if (!res) return null;
    const { frontmatter } = res;
    return {
        title: frontmatter.title,
        description: frontmatter.description,
    };
}
