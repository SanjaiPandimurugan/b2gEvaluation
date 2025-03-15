import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "components/ui/Button";
import "styles/views/Evaluation.scss";
import {
  fetchMockEvaluation,
  fetchEvaluation,
  fetchSubmissionList,
  fetchSubmissionContent,
  submitEvaluation,
  submitMockEvaluation,
} from "../../services/mockApi";

const Evaluation: React.FC = () => {
  const navigate = useNavigate();

  // Submission state
  const [submissionHtml, setSubmissionHtml] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionList, setSubmissionList] = useState<string[]>([]);
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState<string[]>([]);

  // AI Evaluation state
  const [aiEvaluation, setAiEvaluation] = useState<{
    discriminativeAiTitle?: string;
    discriminativeAi?: string;
    generativeAiTitle?: string;
    generativeAi?: string;
    submissionUrl?: string;
  }>({});

  // User evaluation state
  const [decision, setDecision] = useState<"Pass" | "Fail" | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);


  // Usage in useEffect
  useEffect(() => {
    fetchSubmissionList().then((list) => {
      setSubmissionList(list);

      // Load evaluated submissions from localStorage
      const storedEvaluations = JSON.parse(localStorage.getItem("evaluatedSubmissions") || "[]");

      // Filter out already evaluated submissions
      const pending = list.filter((id) => !storedEvaluations.includes(id));

      if (pending.length > 0) {
        // Pick a random submission from the remaining ones
        const randomId = pending[Math.floor(Math.random() * pending.length)];
        setSubmissionId(randomId);
      } else {
        alert("All submissions have been evaluated!");
      }
    });
  }, []);


  // OLD
  // useEffect(() => {
  //   fetchSubmissionList().then((list: string[]) => {
  //     setSubmissionList(list);
  
  //     // Load evaluated submissions from localStorage
  //     const storedEvaluations = JSON.parse(localStorage.getItem("evaluatedSubmissions") || "[]");
  
  //     // Filter out already evaluated submissions
  //     const pending = list.filter((id) => !storedEvaluations.includes(id));
  
  //     if (pending.length > 0) {
  //       // Pick a random submission from the remaining ones
  //       const randomId = pending[Math.floor(Math.random() * pending.length)];
  //       setSubmissionId(randomId);
  //     } else {
  //       alert("All submissions have been evaluated!");
  //     }
  //   });
  // }, []);

  // Load submission HTML when submissionId changes
  useEffect(() => {
    if (submissionId) {
      fetchSubmissionContent(submissionId)
        .then((html: string) => {
          // Parse the HTML string into a document
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          // For each image, update the src if it's a relative path
          doc.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src");
            if (src && !src.startsWith("http") && !src.startsWith("/")) {
              // Prepend the folder path based on the submissionId
              img.setAttribute("src", `/submissions/${submissionId}/${src}`);
            }
          });
          // Set the modified HTML back to state
          setSubmissionHtml(doc.documentElement.innerHTML);
        })
        .catch((err) => console.error(err));
      // Reset evaluation state for new submission
      setTimer(0);
      setDecision(null);
      setConfidence(0);
    }
  }, [submissionId]);


  // Timer that resets for every new submission
  useEffect(() => {
    const interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [submissionId]);

  // Load AI evaluation data for each submission
  // OLD!!!!!
  useEffect(() => {
    fetchMockEvaluation().then((data) => setAiEvaluation(data));
  }, [submissionId]);

  // useEffect(() => {
  //   if (submissionId) {
  //     fetchMockEvaluation(submissionId).then((data) => setAiEvaluation(data));
  //   }
  // }, [submissionId]);
  

  const canProceed = decision !== null && confidence !== 0;


  const handleNextSubmission = () => {
    if (!canProceed) {
      setShowAlert(true);
      return;
    }
  
    const evaluationData = {
      submissionId,
      decision,
      confidence,
      timeTaken: timer,
    };
  
    submitMockEvaluation(evaluationData).then(() => {
      // Load existing evaluations from localStorage
      const storedEvaluations = JSON.parse(localStorage.getItem("evaluatedSubmissions") || "[]");
  
      if (submissionId) {
        storedEvaluations.push(submissionId);
        localStorage.setItem("evaluatedSubmissions", JSON.stringify(storedEvaluations));
      }
  
      // Filter pending submissions
      const pending = submissionList.filter((id) => !storedEvaluations.includes(id));
  
      if (pending.length > 0) {
        setSubmissionId(pending[Math.floor(Math.random() * pending.length)]);
      } else {
        alert("No more submissions to evaluate!");
      }
    });
  };
  
  // API Alternative (Backend Call)
  // const submitEvaluation = async (evaluationData) => {
  //   const response = await fetch("http://your-backend.com/api/evaluate", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(evaluationData),
  //   });
  //   if (!response.ok) throw new Error("Failed to submit evaluation");
  //   return await response.json();
  // };
  

  // const logout = () => {
  //   localStorage.removeItem("token");
  //   navigate("/login");
  // };

  // Format timer display
  const minutes = Math.floor(timer / 60);
  const seconds = (timer % 60).toString().padStart(2, "0");

  return (
    <div className="evaluation-page">
      <header className="top-nav">
        <div className="nav-left">
          {/* Additional header controls or theme toggle can go here */}
        </div>
        <div className="nav-right">
          <div className="timer-display">{minutes}:{seconds}</div>
          <Button
            className={`next-btn ${canProceed ? "" : "disabled"}`}
            onClick={handleNextSubmission}
          >
            ➡ Next Submission
          </Button>
          {/* <Button className="logout-btn" onClick={logout}>
            Logout
          </Button> */}
        </div>
      </header>

      <div className="content-area">
        {/* Left column: Submission */}
        <div className="submission-column">
          <div
            className="submission-card"
            style={{ overflowY: "auto", maxHeight: "calc(100vh - 100px)" }}
          >
            {submissionHtml ? (
              <div dangerouslySetInnerHTML={{ __html: submissionHtml }} />
            ) : (
              <p>Loading submission...</p>
            )}
          </div>
        </div>

        {/* Right column: Evaluation Controls */}
        <div className="evaluation-column">
          <div className="ai-cards">
            <div className="ai-card">
              <div
                className="recommendation-title"
                dangerouslySetInnerHTML={{ __html: aiEvaluation.discriminativeAiTitle || "" }}
              />
              <div
                dangerouslySetInnerHTML={{
                  __html: aiEvaluation.discriminativeAi || "<p>Loading AI Evaluation...</p>",
                }}
              />
            </div>
            <div className="ai-card">
            <div
                className="recommendation-title"
                dangerouslySetInnerHTML={{ __html: aiEvaluation.generativeAiTitle || "" }}
              />
              <div
                dangerouslySetInnerHTML={{
                  __html: aiEvaluation.generativeAi || "<p>Loading AI Evaluation...</p>",
                }}
              />
            </div>
          </div>

          <div className="decision-block">
            <label className="decision-label">Decision:</label>
            <div className="button-group">
              <Button
                className={`pass-btn ${decision === "Pass" ? "active" : ""}`}
                onClick={() => setDecision("Pass")}
              >
                ✅ Pass
              </Button>
              <Button
                className={`fail-btn ${decision === "Fail" ? "active" : ""}`}
                onClick={() => setDecision("Fail")}
              >
                ❌ Fail
              </Button>
            </div>
          </div>


          <div className="confidence-block">
            <label>Confidence Score: {confidence || "—"}</label>
            <input
              className="custom-slider"
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {showAlert && (
        <div className="alert-popup">
          <div className="alert-box">
            <p>Please select Pass/Fail and set Confidence before proceeding!</p>
            <Button onClick={() => setShowAlert(false)}>OK</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluation;
