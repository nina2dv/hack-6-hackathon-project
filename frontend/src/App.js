import React, { useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000";

function QuizApp() {
  const [index, setIndex] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null); // 'legit' or 'fake'
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);

  const [llmOutput, setLlmOutput] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);

  useEffect(() => {
    setUserAnswer(null);
    setError(null);
    setQuiz(null);
    setLlmOutput(null);

    // Fetch quiz data first
    fetch(`${BASE_URL}/quiz/${index}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No more quizzes or error loading quiz");
        }
        return res.json();
      })
      .then((data) => {
        setQuiz(data);

        // After quiz is loaded, fetch LLM output separately
        setLlmLoading(true);
        fetch(`${BASE_URL}/quiz/${index}/llm`)
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to load LLM output");
            }
            return res.json();
          })
          .then((llmData) => {
            setLlmOutput(llmData.llm_output);
            setLlmLoading(false);
          })
          .catch(() => {
            setLlmOutput("Failed to load LLM output");
            setLlmLoading(false);
          });
      })
      .catch((err) => setError(err.message));
  }, [index]);

  const handleAnswer = (answer) => {
    setUserAnswer(answer);
    // Map 'legit' to 'real'
    const normalizedUserAnswer = answer.toLowerCase() === "legit" ? "real" : answer.toLowerCase();
    const normalizedCorrectAnswer = quiz.answer.toLowerCase();

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  if (error) {
    return (
      <div>
        <h2>{error}</h2>
        <button
          onClick={() => {
            setIndex(0);
            setScore(0);
          }}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  if (!quiz) {
    return <div>Loading question...</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2>Question #{index + 1}</h2>
      <p>{quiz.question}</p>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Score: {score}</strong>
      </div>

      {!userAnswer ? (
        <>
          <button onClick={() => handleAnswer("legit")} style={{ marginRight: "1rem" }}>
            Legit
          </button>
          <button onClick={() => handleAnswer("fake")}>Fake</button>
        </>
      ) : (
        <>
          <p>
            <strong>Your Answer:</strong> {userAnswer.charAt(0).toUpperCase() + userAnswer.slice(1)}
          </p>
          <p>
            <strong>Correct Answer:</strong> {quiz.answer.charAt(0).toUpperCase() + quiz.answer.slice(1)}
          </p>
          <p>
            <em>Reason:</em> {quiz.reason}
          </p>
          <p>
            <em>LLM Output:</em> {llmLoading ? "Loading LLM output..." : llmOutput}
          </p>
          <button onClick={handleNext}>Next Question</button>
        </>
      )}
    </div>
  );
}

export default QuizApp;
