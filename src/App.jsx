import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./components/Login";
import AfterLogin from "./pages/after-login";
import Roster from "./pages/Roster";
import SubmitLineup from "./pages/SubmitLineup";
import Standings from "./pages/Standings";

function MainApp() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/after-login" element={<AfterLogin />} />
      <Route path="/standings" element={<Standings />} />
      <Route path="/roster" element={<Roster />} />
      <Route path="/submit-lineup" element={<SubmitLineup />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
