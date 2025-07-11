require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDB } = require("./db");
const usersRoutes = require("./routes/usersRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const workerRoutes = require("./routes/workerRoutes");
const submissionsRoutes = require("./routes/submissionsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB().then(() => {
  app.use("/users", usersRoutes);
  app.use("/buyer", buyerRoutes);
  app.use("/payments", paymentRoutes);
  app.use("/worker", workerRoutes);
  app.use("/submissions", submissionsRoutes);
  app.use("/admin", adminRoutes);

  app.get("/", (req, res) => res.send("Server start"));

  app.listen(port, () => console.log(`Server is running on ${port}`));
});
