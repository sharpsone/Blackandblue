import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";

import Login from "./components/Login";
import SubmitLineup from "./components/SubmitLineup";
import Roster from "./components/Roster";
import Standings from "./components/Standings";

function MainApp() {
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div>
      <h1>Stinky Beavers Dashboard</h1>

      <Standings />
      <Roster />
      <SubmitLineup />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
