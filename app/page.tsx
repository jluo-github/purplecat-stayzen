import LoadingCards from "@/components/card/LoadingCards";
import CategoriesList from "@/components/home/CategoriesList";
import PropertiesContainer from "@/components/home/PropertiesContainer";
import { Suspense } from "react";

export default function Home({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  // console.log("searchParams: ", searchParams);
  return (
    <>
      <CategoriesList
        category={searchParams.category}
        search={searchParams.search}
      />

      {/* suspense Skeleton, properties list */}
      <Suspense fallback={<LoadingCards />}>
        <PropertiesContainer
          category={searchParams.category}
          search={searchParams.search}
        />
      </Suspense>
    </>
  );
}
