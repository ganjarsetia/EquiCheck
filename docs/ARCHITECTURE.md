# ARCHITECTURE

## Overview

Project EquiCheck is a lightweight full-stack application that scans webpages for accessibility issues using Playwright and axe-core, then leverages an LLM to explain violations in beginner-friendly language.

The project intentionally favors simplicity over abstraction, following the assignment's guidance to avoid over-engineering while maintaining clean separation of concerns.

---

# High-Level Architecture

```
                    +--------------------+
                    |    React (Vite)    |
                    +--------------------+
                              |
                       HTTP REST API
                              |
                    +--------------------+
                    |  Express Backend   |
                    +--------------------+
                     |                |
                     |                |
          Playwright + Axe       OpenCode Zen API
             Accessibility          AI Assistant
```

---

# Design Principles

- Feature-oriented structure
- Separation of concerns
- Thin controllers
- Business logic inside services
- Clean, readable JavaScript (no TypeScript)
- Testable architecture
- No unnecessary abstractions

---

# Repository Structure

```
equicheck/

├── frontend/
│
│   └── src/
│
│       ├── features/
│       │
│       │   └── accessibility/
│       │
│       │       ├── components/
│       │       │
│       │       │   ScanForm.jsx
│       │       │   ResultsAccordion.jsx
│       │       │   ViolationCard.jsx
│       │       │   AiHelpDialog.jsx
│       │
│       │       ├── hooks/
│       │       │
│       │       │   useScan.js
│       │       │   useExplain.js
│       │
│       │       ├── services/
│       │       │
│       │       │   accessibilityService.js
│       │
│       │       ├── types.js
│       │       └── index.js
│
│       ├── shared/
│       │
│       │   ├── components/
│       │   ├── utils/
│       │   └── types/
│
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│
│   └── src/
│
│       ├── features/
│       │
│       │   └── accessibility/
│       │
│       │       controller.js
│       │       routes.js
│       │       service.js
│       │       ai.service.js
│       │       prompt.js
│       │       validator.js
│       │       types.js
│       │
│       ├── middleware/
│       │
│       ├── config/
│       │
│       ├── app.js
│       └── server.js
│
├── tests/
│
│   frontend/
│
│   backend/
│
├── README.md
└── ARCHITECTURE.md
```

---

# Request Flow

## Accessibility Scan

```
User

↓

React

↓

POST /scan

↓

Controller

↓

Accessibility Service

↓

Playwright

↓

axe-core

↓

Violations

↓

Frontend
```

---

## AI Explanation

```
User clicks "Get help"

↓

POST /explain

↓

Controller

↓

AI Service

↓

Build Prompt

↓

OpenCode Zen API

↓

Structured JSON

↓

Frontend
```

---

# Backend Responsibilities

## Routes

Responsible for:

- endpoint definitions
- middleware
- request routing

No business logic.

---

## Controllers

Responsible for:

- request parsing
- validation
- calling services
- returning HTTP responses

Controllers remain intentionally thin.

---

## Services

Contain application logic.

Accessibility Service

Responsible for:

- launching Playwright
- running axe-core
- transforming scan results

AI Service

Responsible for:

- prompt construction
- LLM communication
- parsing structured responses

---

# Why There Is No Repository Layer

The application does not use a database.

Adding a Repository layer would introduce unnecessary abstraction without improving maintainability.

Should persistence be added later (history, reports, users), repositories can be introduced without affecting the frontend or service layer.

---

# Frontend Responsibilities

Components are intentionally presentational.

```
Page

↓

Components

↓

Custom Hooks

↓

Service

↓

Backend API
```

## Components

Responsible for:

- rendering
- user interaction
- displaying loading/error states

## Hooks

Responsible for:

- API state
- orchestration
- data fetching

## Services

Responsible for:

- HTTP communication
- request serialization
- response mapping

---

# AI Prompt Strategy

The backend owns prompt generation.

The frontend never communicates directly with the LLM.

Advantages:

- API key remains private
- prompt can evolve independently
- centralized guardrails
- easier testing

---

# Error Handling

Validation errors

→ 400

Invalid URL

→ 400

Playwright timeout

→ 408 / 500

Unexpected errors

→ 500

All responses use a consistent JSON format.

---

# Testing Strategy

The project follows a lightweight Test-Driven Development (TDD) approach where practical.

The goal is confidence, not maximum coverage.

## Unit Tests

Backend

- URL validation
- prompt builder
- response mapping
- AI response parser

Frontend

- custom hooks
- utility functions
- rendering logic

---

## Integration Tests

Backend

- /scan endpoint
- /explain endpoint

Dependencies such as the LLM are mocked.

---

## End-to-End Tests

Playwright

Scenario:

```
Enter URL

↓

Scan

↓

Results displayed

↓

Click Get Help

↓

AI explanation displayed
```

---

# Why This Architecture

This architecture was selected because it:

- is easy to understand
- minimizes unnecessary abstraction
- keeps responsibilities well separated
- supports testing
- scales naturally if additional features are added
- aligns with the assignment's request to avoid over-engineering
