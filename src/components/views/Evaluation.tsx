import React, { useEffect, useState, useRef } from "react";
import { Button } from "components/ui/Button";
import "styles/views/Evaluation.scss";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { api, handleError } from "helpers/api";
// import {*} from "papaparse";
import {
  submitEvaluationToBackend
} from "../../services/Api";

// Mocked localstorage and states

const Evaluation: React.FC = () => {
  // user info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const evaluationCondition = localStorage.getItem("evaluation_condition") || "GEN_DIS";
  console.log("user:", user);
  console.log("evaluationCondition:", evaluationCondition);

  // session info
  const [sessionTimer, setSessionTimer] = useState<number>(90*60); // session timer 90 minutes
  const sessionId = localStorage.getItem("sessionId") || "1";
  const [session, setSession] = useState<any>(
    JSON.parse(localStorage.getItem("session") || "{}")
  );
  console.log("session_id", sessionId);
  console.log("session", session);

  // Submission and evaluation state
  console.log("required submission number:", session.requiredSubmissions);
  // const initialSubmissions = session.requiredSubmissions || 15; // default to 15 if not set
  const initialSubmissions = 15; // default to 15 if not set
  const [submissionHtml, setSubmissionHtml] = useState<string>("");
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState<any[]>([]);

  // User evaluation state
  const [decision, setDecision] = useState<"PASS" | "FAIL" | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [remainingSubmissions, setRemainingSubmissions] = useState<number>(initialSubmissions);

  const navigate = useNavigate();
  const submissionRef = useRef<HTMLDivElement>(null);

  // Load evaluation CSV and pick a random submission
  useEffect(() => {
    fetch("/mobility_impaired_evaluations.csv")
      .then(res => res.text())
      .then(csvText => {
        const parsedData = Papa.parse(csvText, { header: true }).data;

        if (parsedData.length > 0) {
          setEvaluationData(parsedData);
          selectRandomSubmission(parsedData);
        }
        console.log("Evaluation data loaded:", parsedData);
      })
      .catch(err => console.error("Error loading CSV:", err));
  }, []);

  // Start the session when the sessionId is get and the first submission data is ready

  console.log("session", session)
  console.log("submissionData", submissionData)
  console.log("sessionId", sessionId)
  useEffect(() => {
    console.log("start the session")
    const startSession = async () => {
      if (sessionId && submissionData && !session?.started) {
        console.log(`Starting session ${sessionId} with submission ${submissionData.submission_name}`);
        
        try {
          // start the session, request body only need sessionId
          const response = await api.post(`/evaluation-sessions/${sessionId}/start`);
          console.log("Session started successfully:", response.data);
          setSession(response.data);
          localStorage.setItem("session", JSON.stringify(response.data));
          console.log("Session saved to localStorage:", response.data);
        } catch (error) {
          console.error("Error starting the session:", error);
        }
      }
    };
    startSession();
  }, [sessionId, submissionData]); 

  // countdown timer when the user and sessionId are available, ends --> redirect to end page
  useEffect(() => {
    console.log("session:", session);
    console.log("Checking if session started:", session?.started);
    console.log("Session timer countdown started");
    if (sessionId && user) {
      const interval = setInterval(() => {
        setSessionTimer(prevTime => {
          if (prevTime <= 1) {
            // time is up, clear the interval and redirect to end page
            clearInterval(interval);
            console.log("Session time expired");
            
            // call the backend to complete the session
            try {
              api.post(`/evaluation-sessions/${sessionId}/complete`);
            } catch (err) {
              console.error("Error completing session:", err);
            }
            
            // navigate to the end page
            navigate("/end");

            return 0;
          }

          return prevTime - 1;
          
        });
      }, 1000); // countdown every second
      
      return () => clearInterval(interval);
    }
  }, [session?.isStarted, sessionId, navigate]);

  useEffect(() => {
    if (submissionData?.submission_name) {
      fetch(`/submissions/${submissionData.submission_name}/${submissionData.submission_name}.html`)
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
  
          // Fix image paths inside the submission HTML
          doc.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src");
            if (src && !src.startsWith("http") && !src.startsWith("/")) {
              // Prepend the folder path based on the submission_name
              img.setAttribute("src", `/submissions/${submissionData.submission_name}/${src}`);
            }
          });
  
          setSubmissionHtml(doc.documentElement.innerHTML);
          console.log("submission data is ready")
        })
        .catch(err => console.error("Error loading submission:", err));
    }
  }, [submissionData]);
  
  // Reset scroll position when submissionHtml changes
  useEffect(() => {
    if (submissionRef.current) {
      submissionRef.current.scrollTop = 0;
    }
  }, [submissionHtml]);
  
  // Select a random submission from the evaluation data
  const selectRandomSubmission = (evaluations: any[]) => {
    if (!evaluations || evaluations.length === 0) {
      console.error("No evaluations available!");

      return;
    }

    const randomEvaluation = evaluations[Math.floor(Math.random() * evaluations.length)];
    setSubmissionData(randomEvaluation);

    // Save submission URL to localStorage for later backend submission
    if (randomEvaluation?.submission_url) {
      localStorage.setItem("current_submission_url", randomEvaluation.submission_url);
    } else {
      console.error("Warning: Missing submission_url in evaluation data.");
    }

    // Load submission HTML content
    fetch(`/submissions/${randomEvaluation.submission_name}/${randomEvaluation.submission_name}.html`)
      .then(res => res.text())
      .then(html => setSubmissionHtml(html))
      .catch(err => console.error("Error loading submission:", err));

    // Reset state and set start time
    setTimer(0);
    setDecision(null);
    setConfidence(0);
    setStartTime(Date.now()); // Capture the current timestamp as the start time
    setEndTime(null); // Reset end time for the new evaluation
  };

  const canProceed = decision !== null && confidence !== 0;

  const handleNextSubmission = async() => {
    if (!canProceed) {
      setShowAlert(true);

      return;
    }
  
    const evaluationSubmission = {
      sessionId: parseInt(sessionId),
      submissionURL:  localStorage.getItem("current_submission_url"), 
      passFailDecision: decision === "PASS", // Convert to boolean to keep with backend
      confidenceScore: mapConfidenceToEnum(confidence),
      // timeTaken: timer, // backend calculates the time taken
      startTime: new Date(startTime).toISOString(), // Capture when evaluation started, transform to ISO string
      endTime: new Date(Date.now()).toISOString(),  // Capture when evaluation ended, transform to ISO string
    };

    console.log("evaluationSubmission", evaluationSubmission);

    try{  
      // Submit the evaluation to the backend
      console.log("Submitting evaluation to the backend...");
      const response = await api.post(`/evaluation-sessions/${sessionId}/evaluate`, evaluationSubmission);
      console.log("Evaluation submitted:", evaluationSubmission);

      // update session data
      setSession(response.data);

      // Decrement remaining submissions (we can get rid of this if we get it from the Backend)
      const newRemaining = remainingSubmissions - 1;
      setRemainingSubmissions(newRemaining);
    
      if (newRemaining <= 0) {
        // call the backend to complete the session
        try {
          api.post(`/evaluation-sessions/${sessionId}/complete`);
        } catch (err) {
          console.error("Error completing session:", err);
        }

        // Redirect to the End page when all submissions are done
        navigate("/end");
      } else {
        // Pick a new random submission from the full evaluationData list
        selectRandomSubmission(evaluationData);
      }

    } catch (error) {
      console.error("Error submitting evaluation:", error);
    }
  };

  // map the confidence level to the string
  const mapConfidenceToEnum = (level: number): string => {
    switch (level) {
    case 1: return "ONE";
    case 2: return "TWO";
    case 3: return "THREE";
    case 4: return "FOUR";
    case 5: return "FIVE";
    default: return "THREE";
    }
  };
  
  // Function to format the Discriminative evaluation text
  const formatDiscriminativeText = (text: string) => {
    if (!text) return "<p>No evaluation available</p>";

    return text
      .replace(/\*\*Description\s*and\s*bills\s*of\s*materials:\*\*/gi, "<strong>Description and bills of materials:</strong>")
      .replace(/\*\*Visuals,\s*code\s*and\s*other\s*documentation:\*\*/gi, "<br><br><strong>Visuals, code and other documentation:</strong>");
  };

  // Function to format the Generative evaluation text
  const formatGenerativeText = (text: string) => {
    if (!text) return "<p>No evaluation available</p>";

    return text
      .replace(/\*\*Novelty of the Solution:\*\*/g, "<strong>Novelty of the Solution:</strong>")
      .replace(/\*\*Usefulness of the Solution:\*\*/g, "<br><br><strong>Usefulness of the Solution:</strong>");
  };

  // Fake API Template
  /*
const handleNextSubmission = async () => {
  if (!canProceed) {
    setShowAlert(true);
    return;
  }

  const evaluationData = {
    submissionUrl: localStorage.getItem("current_submission_url"),
    decision,
    confidence,
    timeTaken: timer,
  };

  const result = await submitEvaluationToBackend(evaluationData);

  if (result.success) {
    console.log("Evaluation submitted successfully:", result);
    selectRandomSubmission(evaluationData); // Load next submission
  } else {
    console.error("Failed to submit evaluation:", result.error);
  }
};
*/

  return (
    <div className="evaluation-page">
      <header className="top-nav">
        <div className="nav-left">
          <p>{`Remaining evaluations: ${remainingSubmissions} / ${initialSubmissions}`}</p>
        </div>
        <div className="nav-right">
          <div className="timer-display">
            <p>{`Remaining time: ${Math.floor(sessionTimer / 3600)}h ${Math.floor((sessionTimer % 3600) / 60)}m ${sessionTimer % 60}s`}</p>        </div>
          <Button
            className={`next-btn ${canProceed ? "" : "disabled"}`}
            onClick={handleNextSubmission}
          >
          ➡ Next Submission
          </Button>
        </div>
      </header>

      <div className="content-area">
        {/* Left column: Submission */}
        <div className="submission-column">
          <div
            ref={submissionRef}
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
          {/* Only display AI cards if the condition is NOT ORIGIN */}
          {evaluationCondition !== "ORIGIN" && (
            <div className="ai-cards">
              {(evaluationCondition === "DISCRIMINATIVE" || evaluationCondition === "GEN_DIS") && (
                <div className="ai-card">
                  <div className="recommendation-title">
                    <strong>{submissionData?.disc_classification || "Loading..."}</strong>
                  </div>
                  <div dangerouslySetInnerHTML={{
                    __html: formatDiscriminativeText(submissionData?.discriminative || "")
                  }} />
                </div>
              )}
              {(evaluationCondition === "GENERATIVE" || evaluationCondition === "GEN_DIS") && (
                <div className="ai-card">
                  <div className="recommendation-title">
                    <strong>{submissionData?.gen_classification || "Loading..."}</strong>
                  </div>
                  <div dangerouslySetInnerHTML={{
                    __html: formatGenerativeText(submissionData?.generative || "")
                  }} />
                </div>
              )}
            </div>
          )}

          <div className="decision-block">
            <label className="decision-label">Decision:</label>
            <div className="button-group">
              <Button
                className={`pass-btn ${decision === "PASS" ? "active" : ""}`}
                onClick={() => setDecision("PASS")} // set UPPER CASE
              >
                ✅ Pass
              </Button>
              <Button
                className={`fail-btn ${decision === "FAIL" ? "active" : ""}`}
                onClick={() => setDecision("FAIL")} // set UPPER CASE
              >
                ❌ Fail
              </Button>
            </div>
          </div>

          <div className="confidence-block">
            <label className="decision-label">How confident are you? {confidence ? `(${confidence})` : ""}</label>
            <div className="likert-scale">
              <button
                type="button"
                className={`confidence-btn ${confidence === 1 ? "active" : ""}`}
                onClick={() => setConfidence(1)}
              >
      Not<br/>Confident
              </button>
              <button
                type="button"
                className={`confidence-btn ${confidence === 2 ? "active" : ""}`}
                onClick={() => setConfidence(2)}
              >
      Slightly<br/>Confident
              </button>
              <button
                type="button"
                className={`confidence-btn ${confidence === 3 ? "active" : ""}`}
                onClick={() => setConfidence(3)}
              >
      Moderately<br/>Confident
              </button>
              <button
                type="button"
                className={`confidence-btn ${confidence === 4 ? "active" : ""}`}
                onClick={() => setConfidence(4)}
              >
      Very<br/>Confident
              </button>
              <button
                type="button"
                className={`confidence-btn ${confidence === 5 ? "active" : ""}`}
                onClick={() => setConfidence(5)}
              >
      Absolutely<br/>Confident
              </button>
            </div>
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
