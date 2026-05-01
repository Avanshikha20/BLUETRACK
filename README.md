# SmartShip Microservices + React App

## Overview
This workspace contains a full SmartShip implementation:
- Backend microservices in ASP.NET Core (.NET 10)
- API Gateway with Ocelot
- EF Core Code-First databases (SQL Server LocalDB)
- React frontend with auth context, route guards, dashboard, wizard, tracking, and admin portal

## Solution Structure
- src/backend/Shared.Models
- src/backend/IdentityService (5001)
- src/backend/ApiGateway (5000)
- src/backend/ShipmentService (5002)
- src/backend/PaymentService (5003)
- src/backend/TrackingService (5004)
- src/backend/NotificationService (5005)
- src/backend/AdminService (5007)
- src/smartship (React frontend)

## Backend Run Order
Open separate terminals and run:

1. Identity service
```bash
cd src/backend/IdentityService
dotnet run
```

2. Shipment service
```bash
cd src/backend/ShipmentService
dotnet run
```

3. Payment service
```bash
cd src/backend/PaymentService
dotnet run
```

4. Tracking service
```bash
cd src/backend/TrackingService
dotnet run
```

5. Notification service
```bash
cd src/backend/NotificationService
dotnet run
```

6. Admin service
```bash
cd src/backend/AdminService
dotnet run
```

7. API Gateway
```bash
cd src/backend/ApiGateway
dotnet run
```

## Frontend Run
```bash
cd src/smartship
npm start
```

## Testing

Backend (NUnit across all microservices):
```bash
dotnet test src/backend/AdminService/AdminService.Tests/AdminService.Tests.csproj
dotnet test src/backend/IdentityService/IdentityService.Tests/IdentityService.Tests.csproj
dotnet test src/backend/NotificationService/NotificationService.Tests/NotificationService.Tests.csproj
dotnet test src/backend/PaymentService/PaymentService.Tests/PaymentService.Tests.csproj
dotnet test src/backend/ShipmentService/ShipmentService.Tests/ShipmentService.Tests.csproj
dotnet test src/backend/TrackingService/TrackingService.Tests/TrackingService.Tests.csproj
```

Frontend (Jest via React Scripts):
```bash
cd src/smartship
npm test
```

Frontend CI mode (single run, no watch):
```bash
cd src/smartship
npm run test:ci
```

Optional `.env` for Google Maps integration in wizard:
```bash
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_KEY
```

## Core Endpoints Through Gateway
- POST /gateway/auth/register
- POST /gateway/auth/login
- POST /gateway/shipments
- GET /gateway/shipments/my
- POST /gateway/payments/process
- POST /gateway/tracking/update
- GET /gateway/tracking/{id}
- POST /gateway/notifications/notify
- GET /gateway/admin/dashboard-metrics
- PUT /gateway/admin/resolve-exception

## Notes
- JWT is validated at both gateway and services.
- Payment service directly updates shipment status to Booked.
- Notification service currently writes "Email Sent" to console.
- All service databases are configured for SQL Server LocalDB.
