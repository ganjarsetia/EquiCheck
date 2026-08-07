# Project EquiCheck

## Overview

Project EquiCheck is a web application that scans webpages for accessibility
issues using Playwright and axe-core, then leverages an LLM to explain
violations in beginner-friendly language.

---

# Goals

- Scan webpages
- Display accessibility violations
- Explain violations using AI
- Demonstrate clean architecture
- Keep implementation simple and maintainable

---

# Non Goals

- User authentication
- Persistent storage
- Scheduled scans
- Historical reports
- Multi-user support
- Production scalability

---

# Functional Requirements

## Scan Page

User enters URL.

System validates URL.

System scans webpage.

System displays violations.

---

## AI Assistant

Each violation includes

"Get help"

When clicked

Backend sends

- HTML snippet
- Axe violation
- WCAG metadata

to OpenCode Zen.

Returns

- explanation
- impact
- suggested fix
- corrected HTML

---

# Architecture

Frontend

React + Vite

↓

Backend API

Express

↓

Playwright

↓

axe-core

↓

OpenCode Zen

---

# Backend Modules

Accessibility

- Scan Controller
- Scan Service
- AI Service
- Prompt Builder

---

# API

POST /scan

POST /explain

---

# Data Flow

User

↓

Frontend

↓

Backend

↓

Playwright

↓

axe

↓

Results

↓

Frontend

↓

Get Help

↓

Backend

↓

OpenCode Zen

↓

AI Response

---

# Error Handling

Invalid URL

Timeout

Navigation failure

LLM failure

Malformed AI response

---

# Testing Strategy

Unit Tests

Integration Tests

Component Tests

---

# Quality Attributes

Maintainability

Readability

Type Safety

Testability

Accessibility
