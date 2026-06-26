import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App";
import "./index.css";

// Stellar SDK relies on Buffer being available in the browser.
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
g.Buffer = g.Buffer || Buffer;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
