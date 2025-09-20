import { DocsRenderer, generateDocsMetadata } from "@/components/docs-renderer";
import { Leftbar } from "@/components/leftbar";

export default async function Page() {
  return (
    <div className="flex items-start gap-8">
      <Leftbar key="leftbar" />
      <div className="flex-[5.25]">
        <DocsRenderer pathName="introduction" />
      </div>
    </div>
  );
}

export async function generateMetadata() {
    return await generateDocsMetadata({pathName: "introduction"});
}
