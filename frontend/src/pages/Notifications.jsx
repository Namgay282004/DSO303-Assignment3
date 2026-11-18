import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data.notifications || []);
      } catch (err) {
        if (err.response?.status === 401) {
          sessionStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.error ||
          "Unable to load notifications"
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [navigate]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Tutor Notifications</h1>
          <p>Assignment submission updates</p>
        </div>

        <button
          className="logout-btn"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
      </header>

      <main className="dashboard-content">
        <h2>Recent Notifications</h2>

        {loading && <p>Loading notifications...</p>}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <p>No notifications available.</p>
        )}

        {!loading && !error && (
          <div className="exam-grid">
            {notifications.map((notification) => (
              <div className="exam-card" key={notification.id}>
                <h3>Assignment Submission</h3>

                <p>{notification.message}</p>

                <p>
                  <strong>Submission ID:</strong>{" "}
                  {notification.submission_id}
                </p>

                <p>
                  <strong>Received:</strong>{" "}
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </p>

                <span className="exam-status">
                  {notification.is_read ? "Read" : "New"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
