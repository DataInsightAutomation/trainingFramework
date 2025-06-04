# Training Framework API - Curl Examples

This document provides curl commands for testing the Training Framework API endpoints manually.

## Prerequisites

- API server running on `localhost:8001` (adjust as needed)
- API key (if authentication is enabled)

## Authentication

If API key authentication is enabled, include the following header in all requests:

```bash
-H "Authorization: Bearer YOUR_API_KEY"
```

## Basic Endpoints

### Root Endpoint

Check if the API is running:

```bash
curl -X GET "http://localhost:8001/"
```

Expected response:
```json
{"message": "Welcome to the Training API"}
```

### Test Call

Test the API connection:

```bash
curl -X GET "http://localhost:8001/v1/test_call"
```

Expected response:
```json
{"message": "Hello, World!", "status": "API is working"}
```

## How to Use This Document

1. Copy the curl command for the endpoint you want to test
2. Paste it into your terminal
3. Review the response to verify the API is working as expected

## Automated Testing

For automated testing, see the `e2e_tests.py` script in the `tests` directory.

## Swagger Documentation

FastAPI provides interactive documentation at:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
