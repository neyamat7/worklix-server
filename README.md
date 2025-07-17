# 🚀 Worklix Backend API

<div align="center">
  
  **Robust backend API powering the Worklix micro-task marketplace**
  
  Worklix Backend is a comprehensive REST API built with Node.js and Express that powers the entire micro-task marketplace ecosystem. The API handles secure user authentication through Firebase Admin, manages task lifecycles from creation to completion, and processes payments via Stripe integration. With real-time notifications powered by Socket.io and role-based access control, it provides a scalable foundation for connecting buyers, workers, and administrators in a seamless micro task management environment.
  
  [![Node.js](https://img.shields.io/badge/Node.js-16.0+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
  [![Firebase](https://img.shields.io/badge/Firebase_Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
  [![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

**🌐 Base URL:** [https://worklix-server.onrender.com](https://worklix-server.onrender.com)

[🔗 Frontend App](https://worklix.netlify.app)

</div>

---

## 🌟 Features

### 🔐 **Authentication & Authorization**

- **Firebase Admin Integration**: Secure token-based authentication
- **Role-based Access Control**: Admin, Buyer, Worker permissions
- **JWT Middleware**: Protected routes with token verification
- **Email Verification**: Secure user identity validation

### 💼 **Task Management System**

- **Task CRUD Operations**: Create, read, update, delete tasks
- **Status Tracking**: Pending, active, completed, rejected states
- **Submission System**: Worker submissions with approval workflow
- **Task Assignment**: Automatic task distribution to workers

### 💰 **Payment Processing**

- **Stripe Integration**: Secure payment processing for coin purchases
- **Withdrawal System**: Worker earnings withdrawal management
- **Transaction Records**: Complete payment history tracking
- **Balance Management**: Real-time coin balance updates

### 🔔 **Real-time Communication**

- **Socket.io Integration**: Live notifications and updates
- **Event Broadcasting**: Task updates, submission alerts
- **User Presence**: Online/offline status tracking
- **Cross-platform Sync**: Synchronized data across devices

### 📊 **Analytics & Reporting**

- **User Statistics**: Active users and engagement metrics
- **Admin Dashboard**: Comprehensive platform oversight

---

## 🛠️ Tech Stack

### **Backend Framework**

- **Node.js 16+** - JavaScript runtime environment
- **Express.js 4.18+** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database for flexible data storage

### **Authentication & Security**

- **Firebase Admin SDK** - Secure authentication management
- **JWT (JSON Web Tokens)** - Stateless authentication
- **CORS** - Cross-origin resource sharing configuration

### **Payment & External Services**

- **Stripe API** - Payment processing and webhooks
- **Socket.io** - Real-time bidirectional communication

### **Development & Deployment**

- **dotenv** - Environment variable management
- **Morgan** - HTTP request logging
- **Render** - Cloud hosting platform

---

## 📡 API Documentation

### **Base URL**

```
https://worklix-server.onrender.com
```

### **Authentication**

All protected routes require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### **Main Route Groups**

#### 👥 **Users Management** - `/users`

```http
POST   /users                    # Create new user
GET    /users                    # Get all users (Admin only)
GET    /users/single-user        # Get user by email
GET    /users/role               # Get user role
PATCH  /users/:id/role           # Update user role (Admin only)
DELETE /users/:id/delete         # Delete user (Admin only)
```

#### 💼 **Buyer Operations** - `/buyer`

```http
POST   /buyer/tasks              # Create new task
GET    /buyer/tasks              # Get buyer's tasks
PATCH  /buyer/tasks/:taskId      # Update task
DELETE /buyer/tasks/:taskId      # Delete task
```

#### ⚡ **Worker Operations** - `/worker`

```http
GET    /worker/tasks-list        # Get available tasks
GET    /worker/task/:taskId      # Get specific task details
```

#### 💳 **Payment Processing** - `/payments`

```http
POST   /payments/create-payment-intent    # Create Stripe payment intent
POST   /payments/record                   # Record payment and update coins
GET    /payments/records                  # Get payment history
GET    /payments/total-payments           # Get total payments (Admin only)
```

#### 📝 **Submissions Management** - `/submissions`

```http
POST   /submissions              # Submit work
GET    /submissions              # Get paginated submissions
GET    /submissions/check-submission      # Check if submission exists
GET    /submissions/worker-submissions    # Get worker's submissions
GET    /submissions/pending-submissions   # Get pending submissions (Buyer)
PATCH  /submissions/:id/approve           # Approve submission (Buyer)
PATCH  /submissions/:id/reject            # Reject submission (Buyer)
```

#### 💰 **Withdrawal System** - `/withdraw`

```http
POST   /withdraw/request                  # Request withdrawal (Worker)
GET    /withdraw/pending-withdrawals      # Get pending withdrawals (Admin)
PATCH  /withdraw/:id/approve              # Approve withdrawal (Admin)
```

#### 🔔 **Notifications** - `/notifications`

```http
GET    /notifications            # Get user notifications
```

#### 🌐 **Public Routes** - `/public`

```http
GET    /public/top-workers       # Get top performing workers
GET    /public/recently-added-tasks      # Get recently added tasks
```

#### 🔧 **Admin Operations** - `/admin`

```http
GET    /admin/all-tasks          # Get all tasks
DELETE /admin/:id/delete         # Delete task by admin
```

---

## 🔒 Security Features

### **Authentication Middleware**

- **Firebase Token Verification**: Validates Firebase ID tokens
- **Role-based Authorization**: Admin, Buyer, Worker access control
- **Email Verification**: Ensures token email matches user email

### **Security Headers**

- **CORS Configuration**: Controlled cross-origin resource sharing
- **Rate Limiting**: Protection against API abuse

### **Data Validation**

- **Input Sanitization**: Prevents injection attacks
- **Error Handling**: Secure error responses

---

## 🔄 Real-time Events

### **Socket.io Events**

```javascript
// Client -> Server
socket.emit("join-room", { userEmail, role });
socket.emit("task-update", { taskId, status });

// Server -> Client
socket.on("notification", (data) => {
  // Handle new notification
});

socket.on("task-status-changed", (data) => {
  // Handle task status update
});
```

---

## 🚀 Deployment

### **Environment Setup**

1. Configure environment variables on your hosting platform
2. Set up MongoDB connection string
3. Configure Firebase Admin SDK credentials
4. Set up Stripe webhook endpoints

### **Render Deployment**

```bash
# Build command
npm install

# Start command
npm start
```

---

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Async/Await**: Non-blocking asynchronous operations
- **Error Handling**: Comprehensive error management

---

## 📞 Support & Contact

- **📧 Email**: neyamat7.ullah@gmail.com
