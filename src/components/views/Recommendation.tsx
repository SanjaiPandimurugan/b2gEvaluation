import React from "react";

// Simple prop type that expects a string
type RecommendationProps = {
  content: string; // This string can contain HTML tags
};

const Recommendation = ({ content }: { content: string }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

export default Recommendation;
