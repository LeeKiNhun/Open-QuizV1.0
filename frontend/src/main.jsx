import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ExamRepoProvider } from "./context/ExamRepoContext";
import { ClipboardProvider } from "./context/ClipboardContext";
import { OpenQuizRepoProvider } from "./context/OpenQuizRepoContext";
import { ClassProvider } from "./context/ClassContext";
import { RoleProvider } from "./context/RoleContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ExamRepoProvider>
        <OpenQuizRepoProvider>
        <ClipboardProvider>
          <RoleProvider>
            <ClassProvider>
              <App />
            </ClassProvider>
            </RoleProvider>
        </ClipboardProvider>
        </OpenQuizRepoProvider>
      </ExamRepoProvider>
    </BrowserRouter>
  </React.StrictMode>
);
