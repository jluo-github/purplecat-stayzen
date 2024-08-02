import { fetchStatsAction } from "@/utils/actions";
import StatsCard from "@/components/admin/StatsCard";

const StatsContainer = async () => {
  const data = await fetchStatsAction();

  return (
    <div className='mt-12 grid sm:grid-cols-2 gap-4 lg:grid-cols-3'>
      <StatsCard title='users' value={data?.usersCount || 0} />
      <StatsCard title='properties' value={data?.propertiesCount || 0} />
      <StatsCard title='bookings' value={data?.bookingsCount || 0} />
    </div>
  );
};
export default StatsContainer;