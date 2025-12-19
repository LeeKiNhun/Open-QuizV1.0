import React, { createContext, useContext, useState, useMemo } from "react";

const OpenQuizRepoContext = createContext(null);

export function OpenQuizRepoProvider({ children }) {
  const [customFolders, setCustomFolders] = useState([]);

  const value = useMemo(
    () => ({ customFolders, setCustomFolders }),
    [customFolders]
  );

  return (
    <OpenQuizRepoContext.Provider value={value}>
      {children}
    </OpenQuizRepoContext.Provider>
  );
}

export function useOpenQuizRepo() {
  return useContext(OpenQuizRepoContext);
}