import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import Standings from "./pages/Standings";

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Login />;
  }

  return <Standings />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
