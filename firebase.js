var admin = require("firebase-admin");
var serviceAccount = require("./courier-project-firebase-service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
