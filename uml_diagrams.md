# Payroll Management System - UML Diagrams

This document contains a comprehensive set of UML diagrams representing the architecture and logic of the Payroll Management System.

## 1. Use Case Diagram
Describes the interactions between users (Admin, Employee) and the system.

```mermaid
useCaseDiagram
    actor Admin
    actor Employee
    
    package "Payroll Management System" {
        usecase "Manage Employees" as UC1
        usecase "Generate Payroll" as UC2
        usecase "Manage Departments" as UC3
        usecase "View Personal Dashboard" as UC4
        usecase "Mark Attendance (Face Recognition)" as UC5
        usecase "Request Leave" as UC6
        usecase "View Attendance Reports" as UC7
    }
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC7
    
    Employee --> UC4
    Employee --> UC5
    Employee --> UC6
    Employee --> UC7
```

---

## 2. Class Diagram
Represents the static structure of the system and relationships between entities.

```mermaid
classDiagram
    class User {
        +Long id
        +String username
        +String password
        +Role role
    }
    
    class Employee {
        +Long id
        +String firstName
        +String lastName
        +String email
        +String phone
        +LocalDate hireDate
        +JobRole jobRole
        +Department department
    }
    
    class Department {
        +Long id
        +String name
        +String description
    }
    
    class JobRole {
        +Long id
        +String title
        +Double baseSalary
    }
    
    class Attendance {
        +Long id
        +Employee employee
        +LocalDate date
        +LocalTime checkIn
        +LocalTime checkOut
        +AttendanceStatus status
    }
    
    class Payroll {
        +Long id
        +Employee employee
        +Double basicSalary
        +Double netSalary
        +LocalDate payDate
        +Month payMonth
    }
    
    class LeaveRequest {
        +Long id
        +Employee employee
        +LocalDate startDate
        +LocalDate endDate
        +LeaveStatus status
        +String reason
    }
    
    Employee "1" -- "0..*" Attendance : records
    Employee "1" -- "0..*" Payroll : receives
    Employee "1" -- "0..*" LeaveRequest : submits
    Employee "0..*" -- "1" Department : belongs to
    Employee "0..*" -- "1" JobRole : has
    User "1" -- "0..1" Employee : associated with
```

---

## 3. Component Diagram
Shows the high-level software components and their dependencies.

```mermaid
graph TD
    subgraph "Frontend (React + Vite)"
        UI[User Interface Components]
        Services[API Services / Axios]
    end
    
    subgraph "Backend (Spring Boot)"
        Controller[REST Controllers]
        ServiceLayer[Business Services]
        Repo[Spring Data Repositories]
    end
    
    subgraph "External Services"
        PythonSvc[Python Face Recognition Service]
    end
    
    subgraph "Database"
        DB[(MySQL Database)]
    end
    
    UI --> Services
    Services --> Controller
    Controller --> ServiceLayer
    ServiceLayer --> Repo
    Repo --> DB
    
    %% Specific flow for Face Recognition
    Services -.-> PythonSvc
    PythonSvc -.-> Controller
```

---

## 4. Sequence Diagram
Flow: Marking attendance using Face Recognition.

```mermaid
sequenceDiagram
    participant E as Employee (Browser)
    participant UI as React Dashboard
    participant PS as Python Service (Flask)
    participant BE as Spring Boot Backend
    participant DB as Database
    
    E->>UI: Access Camera
    UI->>PS: Send Image Data
    PS->>PS: Process Image (Face Match)
    PS-->>UI: Return Recognition Result (Employee ID)
    UI->>BE: POST /api/attendance/mark (Employee ID)
    BE->>DB: Check Employee & Current Date
    BE->>DB: Save Attendance Record
    DB-->>BE: Success
    BE-->>UI: Attendance Marked Successfully
    UI-->>E: Show Success Message
```

---

## 5. Activity Diagram
Logic for the Monthly Payroll Generation process.

```mermaid
stateDiagram-v2
    [*] --> StartProcess
    StartProcess --> FetchEmployees: Admin selects Month/Year
    FetchEmployees --> CalculateBase: For each employee
    CalculateBase --> CheckAttendance: Get working days
    CheckAttendance --> CheckLeaves: Deduct unpaid leaves
    CheckLeaves --> CalculateTaxes: Apply deductions
    CalculateTaxes --> NetSalaryCalculated: Final result
    NetSalaryCalculated --> SavePayroll: Persist to DB
    SavePayroll --> SendNotification: Dashboard updated
    SendNotification --> [*]
```

---

## 6. State Diagram
Lifecycle of a Leave Request.

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Approved : Admin Approves
    Pending --> Rejected : Admin Rejects
    Approved --> Cancelled : Employee Cancels
    Rejected --> [*]
    Approved --> [*]
    Cancelled --> [*]
```

---

## 7. Deployment Diagram
Physical distribution of system artifacts.

```mermaid
deploymentConfig
    node "Client Workstation" {
        browser "Web Browser (Chrome/Firefox)"
    }
    
    node "Application Server" {
        backend "Spring Boot App (.jar)"
        python "Python AI Service"
    }
    
    node "Database Server" {
        database "MySQL Server"
    }
    
    browser -- backend : HTTP/JSON
    backend -- python : REST API
    backend -- database : JDBC
```

---

## 8. Object Diagram
A snapshot of the system state with specific instances.

```mermaid
classDiagram
    class e1_Employee {
        id = 101
        name = "John Doe"
    }
    class d1_Department {
        name = "Engineering"
    }
    class p1_Payroll {
        month = "September"
        netSalary = 5000
    }
    
    e1_Employee -- d1_Department : belongsTo
    e1_Employee -- p1_Payroll : paidBy
```

---

## 9. Collaboration Diagram
Object interaction focus for the Login process.

```mermaid
graph LR
    User -->|1: Enter Credentials| LoginForm
    LoginForm -->|2: Validate Input| AuthSvc
    AuthSvc -->|3: Verify User| DB
    DB -->|4: User Data| AuthSvc
    AuthSvc -->|5: JWT Token| LoginForm
    LoginForm -->|6: Redirect| Dashboard
```
