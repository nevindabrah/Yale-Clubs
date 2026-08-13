import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearToken, get, post, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [managedClubs, setManagedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await get('/auth/me');
      setUser(data.user);
      setManagedClubs(data.managed_clubs || []);
    } catch {
      clearToken();
      setUser(null);
      setManagedClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (credentials) => {
      const data = await post('/auth/login', credentials);
      setToken(data.token);
      await refresh();
      return data.user;
    },
    [refresh]
  );

  const register = useCallback(
    async (payload) => {
      const data = await post('/auth/register', payload);
      setToken(data.token);
      await refresh();
      return data.user;
    },
    [refresh]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setManagedClubs([]);
  }, []);

  const value = useMemo(
    () => ({
      user,
      managedClubs,
      loading,
      login,
      register,
      logout,
      refresh,
      isStudent: user?.account_type === 'student',
      isOfficer: user?.account_type === 'officer',
    }),
    [user, managedClubs, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
