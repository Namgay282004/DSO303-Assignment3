
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Results() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    async function fetchResults() {
      try {
        const response = await api.get("/results/my");
        setResults(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.error ||
            "Unable to load examination results"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [navigate]);

  const logout = () => {
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>University Examination Platform</h1>
          <p>Student Results</p>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <Link to="/dashboard" className="results-back">
          ← Back to Dashboard
        </Link>

        <h2>My Examination Results</h2>
        <p>View examination results released by your tutor.</p>

        {loading && <p>Loading results...</p>}

        {error && <div className="error-message">{error}</div>}

        {!loading && !error && results.length === 0 && (
          <div className="results-empty">
            <h3>No released results yet</h3>
            <p>
              Your examination results will appear here
              after they have been released.
            </p>
          </div>
        )}

        <div className="results-grid">
          {results.map((result) => {
            const total = Number(result.total_marks);
            const obtained = Number(result.obtained_marks);

            const percentage =
              total > 0 ? (obtained / total) * 100 : 0;

            return (
              <div className="result-card" key={result.attempt_id}>
                <span className="result-status">Released</span>

                <h3>{result.exam_title}</h3>

                <p>
                  <strong>Submitted:</strong>{" "}
                  {result.submitted_at
                    ? new Date(result.submitted_at).toLocaleString()
                    : "N/A"}
                </p>

                <div className="result-score">
                  {obtained} / {total}
                </div>

                <p>Percentage: {percentage.toFixed(1)}%</p>

                <div className="result-progress">
                  <div
                    className="result-progress-fill"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, percentage)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
