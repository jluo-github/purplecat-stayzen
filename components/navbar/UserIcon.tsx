import { fetchProfileImageAction } from "@/utils/actions";

import { LuUser2 } from "react-icons/lu";

const UserIcon = async () => {
  // fetch the user's profile image
  const userImg = await fetchProfileImageAction();
  if (userImg) {
    return (
      <img
        className='w-6 h-6 bg-primary rounded-full text-white'
        src={userImg}
      />
    );
  } else {
    return <LuUser2 className='w-6 h-6 bg-primary rounded-full text-white' />;
  }
};
export default UserIcon;
