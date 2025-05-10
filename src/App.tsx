import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppLayout from "./components/AppLayout";
import Dashboard from "./components/Dashboard";
import Booking from "./pages/Booking";
import CalendarView from "./components/CalendarView";
import FilterDetailsPage from "./pages/FilterDetailsPage";
import EnquiryPage from "./pages/EnquiryPage";
import BookingDetails from "./components/BookingDetails";
import FinancialSummary from "./components/FinancialSummary";
import RatesPage from "./pages/RatesPage";
import HOSSBookingsPage from "./pages/HOSSBookingsPage";
import BookingAdvancePage from "./components/BookingAdvance";
import OtherHotelsPage from "./components/OtherHotels";

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="p-6 text-[var(--destructive)] bg-[var(--destructive-foreground)] rounded-lg max-w-7xl mx-auto">
    <h2 className="text-2xl font-bold">Something went wrong!</h2>
    <p>{error.message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 bg-gradient-primary text-[var(--text-primary)] p-3 rounded-lg"
    >
      Refresh
    </button>
  </div>
);

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {/* AppLayout wraps all routes to provide consistent sidebar and layout */}
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/details" element={<BookingDetails />} />
            <Route path="/filter" element={<FilterDetailsPage />} />
            <Route path="/enquiry" element={<EnquiryPage />} />
            <Route path="/hoss-bookings" element={<HOSSBookingsPage />} />
            <Route path="/booking-advance" element={<BookingAdvancePage />} />
            <Route path="/other-hotels" element={<OtherHotelsPage />} />
            <Route path="/financial" element={<FinancialSummary />} />
            <Route path="/rates" element={<RatesPage />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </ErrorBoundary>
    </Router>
  );
};

export default App;