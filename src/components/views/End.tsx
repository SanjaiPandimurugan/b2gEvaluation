import React from "react";
import "styles/views/Evaluation.scss";
import { Button } from "components/ui/Button";
import { useNavigate } from "react-router-dom";

const End: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="evaluation-page">
      <header className="top-nav">
        <h1 style={{ margin: "0 auto", fontSize: "3rem" }}>Evaluation Completed</h1>
      </header>
      <div
        className="content-area"
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "40px",
        }}
      >
        <p style={{ fontSize: "2.3rem", marginBottom: "20px" }}>
          Thank you for completing the evaluations! Your evaluation has finished.
        </p>
      </div>
    </div>
  );
};

export default End;
