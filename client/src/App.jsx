import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import DoctorPage from "./pages/DoctorPage";
import Cabinet from "./pages/Cabinet";
import Reminders from "./pages/Reminders";
import NotFound from "./pages/NotFound";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/doctor/:id" element={<DoctorPage />} />
              <Route path="/cabinet" element={<Cabinet />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
