import React from "react";
import { Button } from "components/ui/Button";
import { useNavigate } from "react-router-dom";
import "styles/views/Evaluation.scss";

const Tutorial: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="evaluation-page">
      <header className="top-nav">
        <h1 style={{ margin: "0 auto", fontSize: "1.8rem" }}>Tutorial</h1>
      </header>
      <div
        className="content-area"
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ width: "80%", maxWidth: "800px", marginBottom: "20px" }}>
          <iframe
            width="100%"
            height="450"
            src="https://www.youtube.com/watch?v=yIjDET3k06A&ab_channel=Build2Gether" // Change to actual video
            title="Tutorial Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <Button onClick={() => navigate("/evaluation")}>
          Start Evaluation
        </Button>
      </div>
    </div>
  );
};

export default Tutorial;
