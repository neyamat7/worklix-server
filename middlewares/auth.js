const admin = require("../firebase");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Unauthorized access" });
  }

  // console.log("authHeader found, proceeding with token verification");

  const token = authHeader.split(" ")[1];
  // console.log("token", token);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.decoded = decodedToken;
    // console.log("Token verified:", decodedToken);
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).send({ error: "Unauthorized access" });
  }
};

// verify token email
const verifyTokenEmail = (req, res, next) => {
  const email = req.query.email;
  console.log(email);

  // console.log("email checked");

  // If email is provided in the query, check if it matches the decoded token's email
  if (email && (!req.decoded || email !== req.decoded.email)) {
    return res.status(403).send({ error: "Forbidden access" });
  }
  // console.log("email checked pass");
  next();
};

module.exports = { verifyFirebaseToken, verifyTokenEmail };
