import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setTestMode } from "./utils/logger";

// Enable verbose logging for debugging (remove in production)
setTestMode(true);

createRoot(document.getElementById("root")!).render(<App />);
