# Project EquiCheck - Task Breakdown

## Goal

Build an accessibility scanning portal that:

- Scans a webpage using Playwright + axe-core
- Displays WCAG accessibility violations
- Uses an LLM to explain each violation
- Demonstrates clean architecture, TDD, and good engineering practices

---

# Epic 1 - Project Setup

## Task 1.1 - Initialize Repository

### Acceptance Criteria

- [ ] Create Git repository
- [ ] Configure frontend (React + Vite + JavaScript)
- [ ] Configure backend (Express + JavaScript)
- [ ] Configure workspace (pnpm/npm)
- [ ] ESLint
- [ ] Prettier
- [ ] EditorConfig
- [ ] Husky + lint-staged (optional)

---

## Task 1.2 - Define Project Structure

### Acceptance Criteria

- [ ] Feature-based frontend structure
- [ ] Feature-based backend structure
- [ ] Shared types
- [ ] Environment variable support
- [ ] README scaffold

---

# Epic 2 - Accessibility Scan Backend

## Task 2.1 - Scan Endpoint

Endpoint:

POST /scan

### Acceptance Criteria

- [ ] Accept URL
- [ ] Validate request
- [ ] Return 400 for invalid URL
- [ ] Return structured JSON

---

## Task 2.2 - Playwright Service

### Acceptance Criteria

- [ ] Launch browser
- [ ] Navigate to URL
- [ ] Handle timeout
- [ ] Close browser safely

---

## Task 2.3 - Axe Service

### Acceptance Criteria

- [ ] Inject axe-core
- [ ] Execute scan
- [ ] Return violations
- [ ] Normalize response format

---

## Task 2.4 - Unit Tests

### Acceptance Criteria

- [ ] URL validator tests
- [ ] Scan service tests
- [ ] Controller tests
- [ ] Mock Playwright

---

# Epic 3 - Scan UI

## Task 3.1 - Scan Page

### Acceptance Criteria

- [ ] URL input
- [ ] Scan button
- [ ] Loading indicator
- [ ] Error state

---

## Task 3.2 - Accessibility Service

### Acceptance Criteria

- [ ] scan(url)
- [ ] Centralized API client
- [ ] Error handling

---

## Task 3.3 - Display Results

### Acceptance Criteria

- [ ] Accordion per violation
- [ ] Severity badge
- [ ] Description
- [ ] HTML snippet
- [ ] WCAG help link

---

## Task 3.4 - Component Tests

### Acceptance Criteria

- [ ] Scan form tests
- [ ] Results rendering tests
- [ ] Loading state tests

---

# Epic 4 - AI Explanation Backend

## Task 4.1 - Prompt Builder

### Acceptance Criteria

- [ ] Accept violation
- [ ] Accept HTML snippet
- [ ] Produce deterministic prompt

---

## Task 4.2 - AI Service

### Acceptance Criteria

- [ ] Integrate OpenCode Zen
- [ ] Handle API errors
- [ ] Return structured JSON

---

## Task 4.3 - Explain Endpoint

POST /explain

### Acceptance Criteria

- [ ] Validate payload
- [ ] Call AI service
- [ ] Return explanation

---

## Task 4.4 - AI Tests

### Acceptance Criteria

- [ ] Prompt builder tests
- [ ] AI service tests
- [ ] Mock HTTP requests

---

# Epic 5 - AI Frontend

## Task 5.1 - Explain Service

### Acceptance Criteria

- [ ] explainViolation()
- [ ] Error handling

---

## Task 5.2 - Get Help Button

### Acceptance Criteria

- [ ] Button on every violation
- [ ] Disabled while loading
- [ ] Loading indicator

---

## Task 5.3 - AI Response Component

### Acceptance Criteria

Display:

- [ ] Problem
- [ ] Why it matters
- [ ] Suggested fix
- [ ] Corrected HTML
- [ ] WCAG reference

---

## Task 5.4 - Component Tests

### Acceptance Criteria

- [ ] Click Get Help
- [ ] Loading state
- [ ] Successful response
- [ ] Error response

---

# Epic 6 - UX Improvements

## Task 6.1 - Improve Results UI

### Acceptance Criteria

- [ ] Severity colors
- [ ] Empty state
- [ ] Error alerts
- [ ] Responsive layout

---

## Task 6.2 - Better Error Handling

### Acceptance Criteria

- [ ] Invalid URL
- [ ] Scan timeout
- [ ] AI unavailable
- [ ] Friendly messages

---

# Epic 7 - Documentation

## Task 7.1 - README

Include:

- [ ] Overview
- [ ] Architecture
- [ ] Folder structure
- [ ] Setup
- [ ] Environment variables
- [ ] Running locally
- [ ] Testing
- [ ] Trade-offs

---

## Task 7.2 - Architecture Diagram

Example

Frontend

↓

Backend API

↓

Playwright + Axe

↓

OpenCode Zen

---

## Task 7.3 - Trade-offs

Document:

- Browser launched per scan
- No authentication
- Cloud LLM
- No caching
- Prototype scope

---

# Epic 8 - Polish

## Task 8.1 - Code Quality

- [ ] Remove dead code
- [ ] Improve naming
- [ ] Refactor duplicated logic

---

## Task 8.2 - Final QA

Checklist

- [ ] Scan works
- [ ] AI explanation works
- [ ] Tests pass
- [ ] Lint passes
- [ ] README complete
- [ ] Environment variables documented

---

# Testing Strategy

## Unit Tests

Backend

- [ ] URL validation
- [ ] Prompt builder
- [ ] AI service
- [ ] Scan controller

Frontend

- [ ] ScanForm
- [ ] ResultsAccordion
- [ ] ViolationCard
- [ ] AIHelpDialog

---

## Integration Tests

Backend

- [ ] POST /scan
- [ ] POST /explain

Frontend

- [ ] Scan flow
- [ ] Get Help flow

---

# Definition of Done

- [ ] Feature implemented
- [ ] Unit tests passing
- [ ] Lint passing
- [ ] Tests passing
- [ ] Code reviewed (self-review)
- [ ] No obvious TODOs
- [ ] README updated if applicable
