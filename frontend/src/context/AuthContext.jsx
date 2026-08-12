import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Demo user presets for 1-click test login
export const DEMO_USERS = {
  farmer: {
    id: "user_farmer_101",
    name: "Ramesh Patil",
    identifier: "demo.farmer@example.com",
    password: "FarmerPassword123!",
    authMethod: "email",
    role: "Farmer",
    savedSchemes: ["PM_KISAN", "PMFBY"],
    profileAttributes: {
      annual_income: 180000,
      category: "OBC",
      state: "Maharashtra",
      age: 42,
      land_acres: 3.5,
      occupation: "Farmer",
      owned_documents: [
        "Aadhaar Card",
        "7/12 Land Record Extract",
        "Bank Passbook",
        "Income Certificate"
      ]
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yojana_auth_token');
    localStorage.removeItem('yojana_user_profile');
  };

  // Verify authentication token with backend on initial load
  useEffect(() => {
    const verifyInitialSession = async () => {
      try {
        const storedToken = localStorage.getItem('yojana_auth_token');
        const storedSavedSchemes = localStorage.getItem('yojana_saved_schemes');

        if (storedSavedSchemes) {
          try {
            setSavedSchemes(JSON.parse(storedSavedSchemes));
          } catch (e) {
            console.error("Failed to parse stored saved schemes", e);
          }
        }

        if (storedToken) {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            console.warn("Stored auth token is expired or invalid. Clearing session.");
            logout();
          }
        }
      } catch (err) {
        console.error("Failed to verify authentication session with backend:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    verifyInitialSession();
  }, []);

  // Sync saved schemes to LocalStorage
  const updateSavedSchemesState = (newSavedList) => {
    setSavedSchemes(newSavedList);
    localStorage.setItem('yojana_saved_schemes', JSON.stringify(newSavedList));
  };

  // Real backend Login handler
  const login = async ({ identifier, password, userPreset }) => {
    let loginIdentifier = identifier;
    let loginPassword = password;

    if (userPreset && DEMO_USERS[userPreset]) {
      loginIdentifier = DEMO_USERS[userPreset].identifier;
      loginPassword = DEMO_USERS[userPreset].password;
    }

    if (!loginIdentifier || !loginPassword) {
      return { success: false, error: "Email address/Identifier and Password are required" };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.detail || data.message || `Login failed (Status ${res.status})`;
        return { success: false, error: errorMsg };
      }

      const { token: newToken, user: userData } = data;

      setUser(userData);
      setToken(newToken);

      localStorage.setItem('yojana_auth_token', newToken);
      localStorage.setItem('yojana_user_profile', JSON.stringify(userData));
      setIsAuthModalOpen(false);

      return { success: true, user: userData, token: newToken };
    } catch (err) {
      console.error("Login API call failed:", err);
      return { success: false, error: "Network error connecting to backend server" };
    }
  };

  // Real backend Signup handler
  const signup = async ({ name, identifier, password, role, profileAttributes }) => {
    if (!name || !identifier || !password) {
      return { success: false, error: "Full Name, Email/Identifier, and Password are required" };
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          identifier: identifier.trim(),
          password: password,
          role: role || 'Farmer',
          profileAttributes: profileAttributes || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.detail || data.message || `Signup failed (Status ${res.status})`;
        return { success: false, error: errorMsg };
      }

      const { token: newToken, user: userData } = data;

      setUser(userData);
      setToken(newToken);
      updateSavedSchemesState([]);

      localStorage.setItem('yojana_auth_token', newToken);
      localStorage.setItem('yojana_user_profile', JSON.stringify(userData));
      setIsAuthModalOpen(false);

      return { success: true, user: userData, token: newToken };
    } catch (err) {
      console.error("Signup API call failed:", err);
      return { success: false, error: "Network error connecting to backend server" };
    }
  };

  // Update user profile attributes on backend database and local state
  const updateUserProfileAttributes = async (newAttributes) => {
    if (!user) return { success: false, error: "User is not logged in" };

    const authToken = token || localStorage.getItem('yojana_auth_token');

    try {
      if (authToken) {
        const res = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(newAttributes)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.detail || `Failed to persist profile to server (Status ${res.status})`;
          console.error("Profile update error:", errMsg);
          return { success: false, error: errMsg };
        }

        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('yojana_user_profile', JSON.stringify(data.user));
          return { success: true, user: data.user };
        }
      }

      const updatedUser = {
        ...user,
        profileAttributes: {
          ...(user.profileAttributes || {}),
          ...newAttributes
        }
      };
      setUser(updatedUser);
      localStorage.setItem('yojana_user_profile', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error("Failed to persist profile updates to backend server:", err);
      return { success: false, error: "Network error saving profile attributes" };
    }
  };


  // Toggle scheme saving
  const toggleSaveScheme = (schemeId) => {
    let updated;
    if (savedSchemes.includes(schemeId)) {
      updated = savedSchemes.filter(id => id !== schemeId);
    } else {
      updated = [...savedSchemes, schemeId];
    }
    updateSavedSchemesState(updated);
  };

  const isSchemeSaved = (schemeId) => savedSchemes.includes(schemeId);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAuthModalOpen,
        setIsAuthModalOpen,
        savedSchemes,
        savedSchemesCount: savedSchemes.length,
        toggleSaveScheme,
        isSchemeSaved,
        login,
        signup,
        logout,
        updateUserProfileAttributes,
        isLoadingAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
