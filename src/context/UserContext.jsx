// src/contexts/UserContext.js

import { createContext, useContext, useState, useEffect } from "react";

// The context will now provide an authState object and a function to set it
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  // On initial load, read user and tokens from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (user && accessToken) {
      setAuthState({ user, accessToken, refreshToken });
    }
  }, []);

  // When authState changes, update localStorage
  useEffect(() => {
    if (authState.user && authState.accessToken) {
      localStorage.setItem("user", JSON.stringify(authState.user));
      localStorage.setItem("access_token", authState.accessToken);
      localStorage.setItem("refresh_token", authState.refreshToken);
    } else {
      // Clear storage on logout
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, [authState]);

  return (
    <UserContext.Provider value={{ authState, setAuthState }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => useContext(UserContext);