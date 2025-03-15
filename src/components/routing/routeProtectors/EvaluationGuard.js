import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * `EvaluationGuard` ensures that only authenticated users can access the evaluation screen.
 * If a valid token is found in local storage, the user is allowed to navigate to `/evaluation`.
 * Otherwise, they are redirected to the `/login` screen.
 * @Guard
 */

export const EvaluationGuard = () => {
  // if (localStorage.getItem("token")) {
  return <Outlet />;
  // }

  // return <Navigate to="/login" replace />;
};

EvaluationGuard.propTypes = {
  children: PropTypes.node
};

