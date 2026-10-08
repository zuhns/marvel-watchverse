import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <a
      href="#main-content"
      className="skip-link"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById("main-content");
        main?.focus();
        main?.scrollIntoView();
      }}
    >
      Salta al contenuto
    </a>
    <App />
  </React.StrictMode>,
);
