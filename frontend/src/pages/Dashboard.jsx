
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchExams = async () => {
      try {
        const response = await api.get("/exams");
        setExams(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          "Unable to load examinations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>University Examination Platform</h1>
          <p>Student Dashboard</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <button
          className="start-btn"
          style={{ maxWidth: "200px", marginBottom: "24px" }}
          onClick={() => navigate("/results")}
        >
          View My Results
        </button>
        <button
          className="start-btn"
          style={{ maxWidth: "200px", marginBottom: "24px" }}
          onClick={() => navigate("/notifications")}
        >
          Tutor Notifications
        </button>

        <h2>Available Examinations</h2>
        <p>View your published examinations below.</p>

        {loading && <p>Loading examinations...</p>}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && exams.length === 0 && (
          <p>No published examinations available.</p>
        )}

        <div className="exam-grid">
          {exams.map((exam) => (
            <div className="exam-card" key={exam.id}>
              <span className="exam-status">
                {exam.status}
              </span>

              <h3>{exam.title}</h3>

              <p>{exam.description}</p>

              <div className="exam-details">
                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(exam.start_time).toLocaleString()}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {exam.duration_minutes} minutes
                </p>
              </div>

              <button
                className="start-btn"
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                View Examination
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
