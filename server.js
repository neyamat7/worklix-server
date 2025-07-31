require("dotenv").config();
const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
const cors = require("cors");
const { connectDB, getDB } = require("./db");
const usersRoutes = require("./routes/usersRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const workerRoutes = require("./routes/workerRoutes");
const submissionsRoutes = require("./routes/submissionsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();
// const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup Socket.IO
// const io = new Server(server, {
//   cors: {
//     // origin: "https://worklix.netlify.app",
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     credentials: true,
//   },
// });

connectDB().then(() => {
  app.use("/users", usersRoutes);
  app.use("/buyer", buyerRoutes);
  app.use("/payments", paymentRoutes);
  app.use("/worker", workerRoutes);
  app.use("/submissions", submissionsRoutes);
  app.use("/admin", adminRoutes);
  app.use("/withdraw", withdrawRoutes);
  app.use("/notifications", notificationsRoutes);
  app.use("/public", publicRoutes);

  app.get("/", (req, res) => res.send("Server start"));

  // Listen for connections
  // io.on("connection", (socket) => {
  //   console.log("✅ A user connected:", socket.id);

  //   socket.on("join", (email) => {
  //     socket.join(email);
  //     console.log(`Socket ${socket.id} joined room: ${email}`);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("❌ A user disconnected:", socket.id);
  //   });
  // });

  // Make io accessible in your controllers
  // app.set("io", io);

  app.listen(port, () => console.log(`Server is running on ${port}`));
});
