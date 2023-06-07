import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./components/App/App";

const rootEl = document.getElementById("root");
if (rootEl !== null) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<App/>);
}