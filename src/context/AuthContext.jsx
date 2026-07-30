import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasUserId = document.cookie.includes("MFL_USER_ID=");
    const hasPassword = document.cookie.includes("MFL_PASSWORD=");

    if (hasUserId && hasPassword) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}
