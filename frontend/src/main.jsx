import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PatientDashboard from "../pages/dashboard/PatientDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PatientDashboard />
  </StrictMode>
);
