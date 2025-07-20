import React, { useState, useEffect } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

const BASE_URL = process.env.REACT_APP_RENDER_URL;

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

    fetch(`${BASE_URL}/quiz/${index}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("No more quizzes or error loading quiz");
        }
        return res.json();
      })
      .then((data) => {
        setQuiz(data);
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
      <div className="error-message">
        <h2>{error}</h2>
        <button onClick={() => {
          setIndex(0);
          setScore(0);
        }}>
          Restart Quiz
        </button>
      </div>
    );
  }

  if (!quiz) {
    return <div className="loading-text">Loading question...</div>;
  }

  return (
    <div className="quiz-container">
      <h1 className="app-title">Legit or Nah</h1> 

      <h2>#{index + 1}</h2>
      <p>{quiz.question}</p>

      <div className="score-box">
        <strong>Score: {score}</strong>
      </div>

      {!userAnswer ? (
        <div className="button-group">
          <button onClick={() => handleAnswer("legit")}>Legit</button>
          <button onClick={() => handleAnswer("fake")}>Fake</button>
        </div>
      ) : (
        <>
          <div className="answer-summary">
            <p><strong>Your Answer:</strong> {userAnswer.charAt(0).toUpperCase() + userAnswer.slice(1)}</p>
            <p><strong>Correct Answer:</strong> {quiz.answer.charAt(0).toUpperCase() + quiz.answer.slice(1)}</p>
            {/* <p><em>Reason:</em> {quiz.reason}</p> */}
            <p><em>Explanation:</em></p>
            <div className="llm-output">
              {llmLoading ? (
                "Loading LLM output..."
              ) : (
                <ReactMarkdown>{llmOutput}</ReactMarkdown>
              )}
            </div>
          </div>
          <button onClick={handleNext}>Next Question</button>
        </>
      )}
    </div>
  );
}

export default QuizApp;
