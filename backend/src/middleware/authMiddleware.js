
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Verify JWT authentication
const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication token required"
    });
  }

  const token = authorization.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    const result = await pool.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        error: "User no longer exists"
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      error: "Authentication failed"
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

