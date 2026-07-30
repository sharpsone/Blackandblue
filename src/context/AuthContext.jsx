// src/context/AuthContext.js
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check cookies on load
  useEffect(() => {
    const username = getCookie("MFL_USERNAME");
    const password = getCookie("MFL_PASSWORD");
    const year = getCookie("MFL_YEAR");

    if (username && password && year) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    deleteCookie("MFL_USERNAME");
    deleteCookie("MFL_PASSWORD");
    deleteCookie("MFL_YEAR");
    deleteCookie("MFL_USER_ID");
    deleteCookie("MFL_IS_COMMISH");
    deleteCookie("MFL_LAST_LEAGUE");

    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helpers
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; path=/;`;
}
