# Playwright E2E Tests

This directory contains Playwright end-to-end tests for the frontend application.

## Directory Structure

- `e2e/` - End-to-end tests that test the full application flow
- `pages/` - Page object models (future organization)
- `fixtures/` - Test fixtures and data (future organization)

## Running Tests

To run the tests:

```bash
# From the frontend directory
npm run test:e2e

# To run with UI
npx playwright test --ui

# To run a specific test
npx playwright test first.spec.ts
```

## Debugging

Tests will generate screenshots at these key points:
- After form loads: `train-form-loaded.png`
- When dropdown is opened: `dataset-dropdown.png`
- After form is filled: `train-form-filled.png`
- After form submission: `train-form-submitted.png`

Error screenshots:
- If dataset selection fails: `dataset-selection-error.png`
- If training method selection fails: `training-method-error.png`
- If form submission fails: `form-submission-error.png`

These files are stored in the test-results directory.
