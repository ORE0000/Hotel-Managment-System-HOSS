import BookingForm from "../components/BookingForm";

const Booking: React.FC = () => {
  const handleBookingSuccess = () => {
    // Placeholder: Add any success handling logic here if needed
    console.log("Booking successful");
  };

  return <BookingForm onBookingSuccess={handleBookingSuccess} />;
};

export default Booking;