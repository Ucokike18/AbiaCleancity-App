ABIACLEANCITY

A FULL-STACK WASTE MANAGEMENT PLATFORM

AbiaCleanCity is a web-based waste management platform designed to improve how residents report waste-related issues and how administrators monitor and manage those reports.

The application provides role-based access for landlords, tenants, and administrators, combining a responsive frontend with a RESTful backend API and MongoDB database.

PROJECT OVERVIEW

Waste management requires effective communication between residents and the people responsible for managing waste collection and related services.

AbiaCleanCity provides a digital platform where registered users can submit waste reports, monitor their submissions, and manage their profiles, while administrators can oversee users, reports, and payment records through administrative interfaces.

KEY FEATURES
User Management and Authentication
- User registration and login.
- JWT-based authentication.
- Protected user profiles.
- Profile information updates.
- Role-based access control.

Waste Reporting
- Waste report submission by landlords and tenants.
- Access to personal report records.
- Administrative access to submitted reports.
- Paginated administrative report management.
- Report status summaries.

Administrative Management
- Administrative user listing.
- Administrative waste report management.
- Payment record retrieval.
- Payment summaries covering paid, pending, and failed records.

Security and API Reliability
- Password hashing.
- Authentication and role authorization middleware.
- Request validation.
- Authentication-specific rate limiting.
- Global API rate limiting.
- Security headers through Helmet.
- Database-aware health-check endpoint.

User Roles

| Role | Access |
|---|---|
| Administrator | Administrative user, report, and payment management |
| Landlord | Profile management and waste report submission/tracking |
| Tenant | Profile management and waste report submission/tracking |

Access to protected resources is controlled through authentication and role-based authorization.

Technology Stack

Frontend
- HTML5
- CSS3
- JavaScript
- Responsive web design

Backend
- Node.js
- Express.js
- REST API
- JWT authentication
- Express Validator

Database
- MongoDB
- Mongoose

Security and Testing
- Helmet
- CORS
- Express Rate Limit
- Node.js built-in test runner
- Supertest

Development Tools
- Git and GitHub
- Visual Studio Code
- Postman

Application Architecture

AbiaCleanCity uses a frontend/backend architecture.

1. The frontend provides the user interface through HTML, CSS, and JavaScript.
2. The Express backend exposes REST API endpoints for authentication, user management, waste reporting, and administrative operations.
3. MongoDB stores application records, including users, reports, and payments.
4. JWT authentication and role-based middleware protect restricted API resources.

Main API Routes

| API Endpoint | Purpose |
|---|---|
| `/api/users/register` | Register a user |
| `/api/users/login` | Authenticate a user |
| `/api/users/profile` | Retrieve the authenticated user's profile |
| `/api/users/admin/users` | Retrieve administrative user records |
| `/api/reports/` | Submit a waste report |
| `/api/reports/my` | Retrieve the authenticated user's reports |
| `/api/reports/admin` | Retrieve paginated administrative reports |
| `/api/payments/admin` | Retrieve payment records |
| `/api/payments/admin/summary` | Retrieve payment statistics |
| `/api/health` | Check backend and database health |

Project Structure


AbiaCleanCity/
│
├── admin/
│   ├── dashboard.html
│   ├── login.html
│   └── admin.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── css/
├── js/
├── register/
├── user/
├── contactUs.html
├── features.html
├── index.html
├── login.html
└── schedule.html

GETTING STARTED

Prerequisites

Install the following:

- Node.js
- npm
- MongoDB database (local MongoDB or MongoDB Atlas)
- Git

1. Clone the Repository

git clone https://github.com/Ucokike18/AbiaCleancity-App.git
cd AbiaCleancity-App

2. Install Backend Dependencies

cd backend
npm install

3. Configure Environment Variables

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

Required environment variables:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5501


Replace the example values with your own configuration. Never commit your actual `.env` file or expose database credentials and authentication secrets.

4. Start the Backend

From the `backend` directory:

npm start


For development with automatic restarts:

npm run dev


The backend runs on port `5000` by default.

5. Run the Frontend

Open the project root in Visual Studio Code and use the Live Server extension to serve the frontend.

Configure the frontend origin to match the `FRONTEND_URL` environment variable in the backend.

Running Automated Tests

The backend uses Node.js's built-in test runner and Supertest for API testing.

From the `backend` directory:

npm test

The automated test suites cover:

- Application and API behaviour.
- User profile routes.
- Report routes and administrative pagination.
- Role-based authorization.

Performance and Scalability Testing

Phase 7 focused on backend performance, API reliability, database query behaviour, and administrative report pagination.

Completed controlled tests included:

| Test                          |      Result                 |
| Administrative HTTP benchmark | 180/180 successful requests |
| Mixed API workload            | 40/40 successful requests   |
| Backend automated tests       | 34 passing tests            |
| Report pagination             | Implemented and tested      |
| Database query diagnostics    | Completed                   |

The performance tests used isolated test data and a dedicated test database.

These results demonstrate successful execution under the tested conditions. They should not be interpreted as a guarantee of production-scale capacity or the results of a sustained public load test.

Security Measures

The backend implements several security measures:

- JWT-based authentication.
- Password hashing.
- Role-based authorization.
- Request validation.
- Helmet security headers.
- CORS restrictions.
- Global API rate limiting.
- Additional rate limiting for registration and login.
- Environment-based secret management.

Current Project Status

Completed development areas include:

- Backend foundation and database integration.
- Authentication and access control.
- Administrative dashboard functionality.
- User dashboard and waste reporting.
- Profile management.
- Integration and regression testing.
- Performance testing and administrative report pagination.

The application is currently maintained as a development project and has not been presented as a publicly deployed production service.

Roadmap and Future Improvements

AbiaCleanCity provides a foundation for digital waste management, but there are opportunities to expand its functionality, improve the user experience, and strengthen its operational capabilities in future versions.

The following improvements are potential development priorities:

1. Payment Integration
- Integrate a secure payment gateway to support online payments.
- Allow users to view their payment history and transaction status.
- Introduce payment receipts and transaction verification.

2. Waste Collection Management
- Introduce waste collection scheduling and assignment.
- Enable administrators to assign collection tasks to service personnel.
- Allow users to track collection progress and completion.

3. Notifications and Communication
- Introduce email and in-app notifications.
- Notify users when their waste reports are received, updated, or resolved.
- Provide administrators with alerts for new reports and pending tasks.

4. Reporting and Analytics
- Expand the administrative dashboard with more detailed analytics.
- Introduce date-based and location-based report filtering.
- Provide downloadable reports and performance summaries.

5. Location-Based Features
- Integrate maps and location services.
- Allow users to provide precise waste collection or incident locations.
- Support geographical analysis of reported waste issues.

6. Testing and Quality Assurance
- Expand automated frontend testing.
- Introduce end-to-end testing for critical user journeys.
- Extend API performance and security testing.

7. Deployment and Monitoring
- Deploy the application to a production environment.
- Introduce application monitoring, logging, and error tracking.
- Establish automated deployment and backup workflows.

8. Accessibility and User Experience
- Improve accessibility in accordance with WCAG guidelines.
- Further refine mobile responsiveness and navigation.
- Introduce additional usability improvements based on user feedback.

These improvements will be considered in subsequent versions as the platform evolves.

Author

Uchenna Okike

Frontend Developer | Web Development Tutor

GitHub: [@Ucokike18](https://github.com/Ucokike18)

LinkedIn: [Connect on LinkedIn]([https://www.linkedin.com/](https://www.linkedin.com/in/uchenna-okike-b06759286/))


*Built to explore practical web development, REST API design, authentication, database management, and performance optimisation through a real-world waste management application.*
