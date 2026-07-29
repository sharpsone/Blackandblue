import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // ⭐ Check for MFL cookies set by MFL login redirect
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
