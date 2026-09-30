const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET est manquant dans le fichier .env");
}


// ==========================================
// AUTHENTIFICATION JWT
// ==========================================

function authenticateToken(req, res, next) {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise"
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Format du token invalide"
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();

  } catch (error) {

    console.error(
      "AUTH ERROR:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expirée"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token invalide"
    });
  }
}


// ==========================================
// VÉRIFIER LE ROLE
// ==========================================

function requireRole(...roles) {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit"
      });
    }

    next();
  };
}


// ==========================================
// ADMIN
// ==========================================

function requireAdmin(req, res, next) {
  return requireRole("admin")(req, res, next);
}


// ==========================================
// COMMERCIAL
// ==========================================

function requireCommercial(req, res, next) {
  return requireRole("commercial")(req, res, next);
}


// ==========================================
// ADMIN OU COMMERCIAL
// ==========================================

function requireUser(req, res, next) {
  return requireRole(
    "admin",
    "commercial"
  )(req, res, next);
}


module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireCommercial,
  requireUser
};