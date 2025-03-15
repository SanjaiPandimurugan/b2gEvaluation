// Fake API Template

export const submitEvaluationToBackend = async (evaluationData: {
    submissionUrl: string;
    decision: "Pass" | "Fail";
    confidence: number;
    timeTaken: number;
    startTime: number | null;
    endTime: number | null;
    // add other
  }) => {
    try {
      // Ensure we have all required data before sending
      if (!evaluationData.submissionUrl || !evaluationData.decision || evaluationData.confidence === 0) {
        console.error("Missing required evaluation data:", evaluationData);
        return { success: false, error: "Missing required fields" };
      }
  
      // Simulate API call delay (remove this in real implementation)
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      const response = await fetch("https://your-backend.com/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission_url: evaluationData.submissionUrl,
          passFailDecision: evaluationData.decision,
          ConfidenceScore: evaluationData.confidence,
        //   sessionId: "fake-session-id", // 
          startTime: evaluationData.startTime, // Send start time
          endTime: evaluationData.endTime, // Send end time
        //   mouseTrackingData: [], // Placeholder for mouse tracking (if implemented later)
        }),
      });
      
  
      if (!response.ok) {
        throw new Error("Failed to submit evaluation");
      }
  
      return await response.json(); // Return backend response
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      return { success: false, error: error.message };
    }
  };
  