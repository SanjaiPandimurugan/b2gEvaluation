import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Evaluation from "../../views/Evaluation";
import PropTypes from "prop-types";

const EvaluationRouter = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Routes>
        <Route path="" element={<Evaluation />} />

        <Route path="dashboard" element={<Evaluation />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </div>
  );
};

EvaluationRouter.propTypes = {
  base: PropTypes.string
};

export default EvaluationRouter;
