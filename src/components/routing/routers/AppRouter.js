import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { EvaluationGuard } from "../routeProtectors/EvaluationGuard";
import EvaluationRouter from "./EvaluationRouter"; 
import { LoginGuard } from "../routeProtectors/LoginGuard";
import Login from "../../views/Login";
import Tutorial from "../../views/Tutorial";
import End from "../../views/End";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/evaluation/*" element={<EvaluationGuard />}>
          <Route path="/evaluation/*" element={<EvaluationRouter base="/evaluation" />} />
        </Route>

        {/* New route for the tutorial page */}
        <Route path="/tutorial" element={<Tutorial />} />

        {/* New route for the ending page */}
        <Route path="/end" element={<End />} />

        <Route path="/login" element={<LoginGuard />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Change default route if needed */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
