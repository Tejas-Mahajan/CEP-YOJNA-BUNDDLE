import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const MOCK_JWT_SECRET = "yojana_bundle_jwt_secret_key_2026";

// Demo user presets for 1-click test login
export const DEMO_USERS = {
  farmer: {
    id: "user_farmer_101",
    name: "Ramesh Patil",
    identifier: "9876543210",
    authMethod: "phone",
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
        "Ration Card"
      ]
    }
  }
};

// Helper: Generate a simulated JWT token string (Base64 header.payload.signature)
const generateMockJWT = (userData) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    sub: userData.id,
    name: userData.name,
    role: userData.role,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days expiry
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = btoa(`${MOCK_JWT_SECRET}_${userData.id}`);
  return `${header}.${payload}.${signature}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initialize auth state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('yojana_auth_token');
      const storedUser = localStorage.getItem('yojana_user_profile');
      const storedSavedSchemes = localStorage.getItem('yojana_saved_schemes');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }

      if (storedSavedSchemes) {
        setSavedSchemes(JSON.parse(storedSavedSchemes));
      }
    } catch (err) {
      console.error("Failed to restore session from LocalStorage", err);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Sync saved schemes to LocalStorage
  const updateSavedSchemesState = (newSavedList) => {
    setSavedSchemes(newSavedList);
    localStorage.setItem('yojana_saved_schemes', JSON.stringify(newSavedList));
  };

  // Login handler
  const login = async ({ identifier, password, method, userPreset }) => {
    let targetUser = null;

    if (userPreset && DEMO_USERS[userPreset]) {
      targetUser = DEMO_USERS[userPreset];
    } else {
      // Create user record from login credentials
      const isEmail = identifier.includes('@');
      const mockName = isEmail ? identifier.split('@')[0].replace('.', ' ') : `User ${identifier.slice(-4)}`;
      
      // Try to load previous attributes or default
      const storedUser = localStorage.getItem('yojana_user_profile');
      const prevAttributes = storedUser ? JSON.parse(storedUser).profileAttributes : null;

      targetUser = {
        id: `usr_${Date.now()}`,
        name: mockName.charAt(0).toUpperCase() + mockName.slice(1),
        identifier: identifier,
        authMethod: method || (isEmail ? 'email' : 'phone'),
        role: 'Farmer',
        profileAttributes: prevAttributes || {
          annual_income: 200000,
          category: 'General',
          state: 'Maharashtra',
          age: 28,
          land_acres: 2.0,
          occupation: 'Farmer',
          owned_documents: ['Aadhaar Card', 'Bank Passbook']
        }
      };
    }

    const newToken = generateMockJWT(targetUser);

    setUser(targetUser);
    setToken(newToken);
    if (targetUser.savedSchemes) {
      updateSavedSchemesState(targetUser.savedSchemes);
    }

    localStorage.setItem('yojana_auth_token', newToken);
    localStorage.setItem('yojana_user_profile', JSON.stringify(targetUser));
    setIsAuthModalOpen(false);

    return { success: true, user: targetUser, token: newToken };
  };

  // Signup handler
  const signup = async ({ name, identifier, password, method, role, profileAttributes }) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      identifier: identifier.trim(),
      authMethod: method || (identifier.includes('@') ? 'email' : 'phone'),
      role: 'Farmer',
      savedSchemes: [],
      profileAttributes: profileAttributes || {
        annual_income: 150000,
        category: 'General',
        state: 'Maharashtra',
        age: 25,
        land_acres: 2.5,
        occupation: 'Farmer',
        owned_documents: ['Aadhaar Card', 'Bank Passbook']
      }
    };

    const newToken = generateMockJWT(newUser);

    setUser(newUser);
    setToken(newToken);
    updateSavedSchemesState([]);

    localStorage.setItem('yojana_auth_token', newToken);
    localStorage.setItem('yojana_user_profile', JSON.stringify(newUser));
    setIsAuthModalOpen(false);

    return { success: true, user: newUser, token: newToken };
  };

  // Update user profile attributes
  const updateUserProfileAttributes = (newAttributes) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      profileAttributes: {
        ...user.profileAttributes,
        ...newAttributes
      }
    };
    setUser(updatedUser);
    localStorage.setItem('yojana_user_profile', JSON.stringify(updatedUser));
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yojana_auth_token');
    localStorage.removeItem('yojana_user_profile');
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
