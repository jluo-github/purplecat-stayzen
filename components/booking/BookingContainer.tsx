import { usePropertyStore } from "@/utils/store";
import ConfirmBooking from "./ConfirmBooking";
import BookingForm from "./BookingForm";

const BookingContainer = () => {
  const { range } = usePropertyStore((state) => state);
  if (!range || !range.from || !range.to) return null;

  if (range.to.getTime() === range.from.getTime()) return null;

  return (
    <div className='w-full'>
      {" "}
      <BookingForm />
      <ConfirmBooking />
    </div>
  );
};
export default BookingContainer;
