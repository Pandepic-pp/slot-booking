import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import BookingPage from "./pages/BookingPage/BookingPage";
import Dashboard from "./pages/LandingPage/LandingPage";
import BookingList from "./pages/BookingList/BookingList";
import ThankYou from "./pages/BookingPage/ConfirmationPage/ConfirmationPage";
import DashboardPage from "./pages/DashboardPage/DashboardPage";

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/new-booking" element={<BookingPage />} />
        <Route path="/booking-list" element={<BookingList />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-booking/thank-you" element={<ThankYou />} />
        <Route path="/dashboard-page" element={<DashboardPage />} />
      </Routes>
    </Router>
    
    </>
  );
}

export default App;
