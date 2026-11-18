
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [started, setStarted] = useState(false);

  const saveTimers = useRef({});
  const pendingSaves = useRef(new Set());

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadExam() {
      try {
        const [examsResponse, questionsResponse] =
          await Promise.all([
            api.get("/exams"),
            api.get(`/exams/${id}/questions`),
          ]);

        const selectedExam = examsResponse.data.find(
          (item) => item.id === Number(id)
        );

        if (!selectedExam) {
          throw new Error("Examination not found");
        }

        setExam(selectedExam);
        setQuestions(questionsResponse.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Unable to load examination"
        );
      } finally {
        setLoading(false);
      }
    }

    loadExam();

    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, [id, navigate]);

  const startExam = async () => {
    setStarting(true);
    setError("");

    try {
      const response = await api.post("/attempts", {
        exam_id: Number(id),
      });

      const newAttemptId = response.data.id;
      setAttemptId(newAttemptId);

      const savedResponse = await api.get(
        `/attempts/${newAttemptId}/answers`
      );

      const restored = {};

      savedResponse.data.forEach((answer) => {
        restored[answer.question_id] = answer.answer_text;
      });

      setAnswers(restored);
      setStarted(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to start examination"
      );
    } finally {
      setStarting(false);
    }
  };

  const saveAnswer = async (questionId, value) => {
    if (!attemptId) return;

    pendingSaves.current.add(questionId);
    setSaveStatus("Saving answers...");

    try {
      await api.post("/attempts/answers", {
        attempt_id: attemptId,
        question_id: questionId,
        answer_text: value,
      });

      setSaveStatus("Answers saved");
    } catch (err) {
      setSaveStatus("Some answers could not be saved");
      setError(
        err.response?.data?.error ||
          "Autosave failed. Please try again."
      );
    } finally {
      pendingSaves.current.delete(questionId);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));

    clearTimeout(saveTimers.current[questionId]);

    saveTimers.current[questionId] = setTimeout(() => {
      saveAnswer(questionId, value);
    }, 700);
  };

  const handleSubmit = async () => {
    if (!attemptId || submitting) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit your examination?"
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");

    try {
      // Cancel pending debounce timers.
      Object.values(saveTimers.current).forEach(clearTimeout);

      // Save all current answers before submission.
      await Promise.all(
        Object.entries(answers).map(([questionId, value]) =>
          api.post("/attempts/answers", {
            attempt_id: attemptId,
            question_id: Number(questionId),
            answer_text: value,
          })
        )
      );

      await api.post(`/attempts/${attemptId}/submit`);

      sessionStorage.removeItem(`attempt_${id}`);

      alert("Examination submitted successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to submit examination"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="exam-container">Loading examination...</div>;
  }

  if (error && !exam) {
    return <div className="exam-container error-message">{error}</div>;
  }

  return (
    <div className="exam-container">
      <header className="exam-header">
        <div>
          <h1>{exam.title}</h1>
          <p>Duration: {exam.duration_minutes} minutes</p>
        </div>

        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
          disabled={submitting}
        >
          Dashboard
        </button>
      </header>

      {!started ? (
        <section className="exam-intro">
          <h2>Examination Instructions</h2>

          <p>{exam.description}</p>

          <p>Total questions: {questions.length}</p>

          <p>
            Your answers will be saved automatically while
            you complete the examination.
          </p>

          <p>
            Once submitted, your answers cannot be changed.
          </p>

          {error && <div className="error-message">{error}</div>}

          <button
            className="start-btn"
            onClick={startExam}
            disabled={starting}
          >
            {starting ? "Starting..." : "Start Examination"}
          </button>
        </section>
      ) : (
        <>
          <div className="exam-progress">
            <span>Questions: {questions.length}</span>
            <span>{saveStatus}</span>
          </div>

          {error && <div className="error-message">{error}</div>}

          {questions.map((question, index) => (
            <section className="question-card" key={question.id}>
              <h3>
                Question {index + 1}
                <span className="question-marks">
                  {question.marks} marks
                </span>
              </h3>

              <p>{question.question_text}</p>

              {question.question_type === "mcq" ? (
                <div className="option-list">
                  {(Array.isArray(question.options)
                    ? question.options
                    : []
                  ).map((option, optionIndex) => (
                    <label
                      className="option-item"
                      key={optionIndex}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={
                          answers[question.id] === option
                        }
                        onChange={() =>
                          handleAnswerChange(
                            question.id,
                            option
                          )
                        }
                        disabled={submitting}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="answer-textarea"
                  rows={5}
                  placeholder="Write your answer here..."
                  value={answers[question.id] || ""}
                  onChange={(event) =>
                    handleAnswerChange(
                      question.id,
                      event.target.value
                    )
                  }
                  disabled={submitting}
                />
              )}
            </section>
          ))}

          <div className="exam-actions">
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Examination"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
