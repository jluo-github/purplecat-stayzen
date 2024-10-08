import { Skeleton } from "@/components/ui/skeleton";

const LoadingCards = () => {
  return (
    <div className='mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};
export default LoadingCards;


export const SkeletonCard = () => {
  return (
    <div>
      <Skeleton className='h-[250px] rounded-xl' />
      <Skeleton className='h-5 mt-2 w-3/4' />
      <Skeleton className='h-4 mt-1 w-1/2' />
    </div>
  );
};
