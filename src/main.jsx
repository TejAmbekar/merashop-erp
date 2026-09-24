import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ERPProvider } from "./context/ERPContext";
import "./styles/index.css";
import "./styles/responsive.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter><ERPProvider><App /></ERPProvider></BrowserRouter></React.StrictMode>
);