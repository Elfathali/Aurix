const jwt = require("jsonwebtoken");

function auth(req, res, next) {

  try {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing token"
      });
    }

    const token = header.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT secret not configured"
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: payload.userId
    };

    next();

  } catch (err) {

    console.error(err);

    return res.status(401).json({
      message: "Invalid token"
    });
  }
}

module.exports = auth;