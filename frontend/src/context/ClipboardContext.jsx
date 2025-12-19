import React, { createContext, useContext, useState } from "react";

const ClipboardContext = createContext(null);

export function ClipboardProvider({ children }) {
  const [clipboard, setClipboard] = useState(null);
  /*
    clipboard = {
      mode: "copy" | "cut",
      items: [{ id, name, type }]
    }
  */

  const copyItems = (items) => {
    setClipboard({ mode: "copy", items });
  };

  const cutItems = (items) => {
    setClipboard({ mode: "cut", items });
  };

  const clearClipboard = () => setClipboard(null);

  return (
    <ClipboardContext.Provider
      value={{ clipboard, copyItems, cutItems, clearClipboard }}
    >
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  return useContext(ClipboardContext);
}
