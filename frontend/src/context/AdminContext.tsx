import React, { createContext, useContext } from 'react';

interface AdminContextType {
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({ isAdmin: false });

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = import.meta.env.VITE_ADMIN === 'true';

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
