# 🏺 ArtifactVault - Backend API

> RESTful API server for the ArtifactVault platform, providing secure data management and authentication services.

## 🌟 Overview

This backend API serves as the core engine for the ArtifactVault platform, handling data operations, user authentication, and business logic. Built with Node.js and Express, it provides a robust and scalable foundation for managing historical artifacts, user interactions, and educational content.

## 🚀 Live API

**Base URL:** `https://server-alpha-livid.vercel.app/`

## 🛠️ Technology Stack

### **Runtime & Framework**

- **Node.js** - JavaScript runtime environment
- **Express 5** - Fast, unopinionated web framework for Node.js

### **Database & Authentication**

- **MongoDB** - NoSQL database for flexible data storage
- **Firebase Admin SDK** - Server-side authentication and user management

### **Security & Configuration**

- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management

## 🔌 API Endpoints

### **Artifacts**

```
GET    /artifacts                 - Get all artifacts
GET    /artifacts/:artifactId     - Get single artifact
GET    /artifacts/liked           - Get all liked artifacts
POST   /artifacts                 - Create new artifact (Protected)
PUT    /artifacts/:artifactId     - Update artifact (Protected)
PATCH  /artifacts/:artifactId     - Update artifact (Protected)
DELETE /artifacts/:artifactId     - Delete artifact (Protected)
```

## 🔐 Authentication & Security

### **Firebase Authentication**

- Token-based authentication using Firebase Admin SDK
- Secure user registration and login

### **Security Features**

- CORS protection for cross-origin requests
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- Environment variable protection
- Secure error handling

## 📞 Support

For questions or issues:

- **Email**: neyamat7.ullah@gmail.com

<div align="center">

**Built with ❤️ by Neyamat for preserving history**

</div>
