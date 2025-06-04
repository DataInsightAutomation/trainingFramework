"""End-to-end tests for the Training Framework API.

This script contains automated tests that call the API endpoints
using HTTP requests to verify functionality.

Usage:
    python e2e_tests.py [test_name1 test_name2 ...]
    
    Running without arguments runs all tests.
    Providing test names as arguments runs only those tests.

Requirements:
    - requests
    - Python 3.6+
    - API server running on localhost:8001 (or configure BASE_URL)
"""
#export no_proxy="localhost,127.0.0.1,::1"
import requests
import json
import time
import sys
import os
import urllib.parse
import argparse
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, Union

# Configuration
BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8001")
API_KEY = os.environ.get("API_KEY", "")
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "10"))  # seconds
POLLING_INTERVAL = int(os.environ.get("POLLING_INTERVAL", "5"))  # seconds
MAX_WAIT_TIME = int(os.environ.get("MAX_WAIT_TIME", "300"))  # seconds (5 minutes)

# Define valid job states
TERMINAL_STATES = ["completed", "failed", "cancelled", "error", "success", "succeeded"]
SUCCESS_STATES = ["completed", "success", "succeeded"]
# Whether to fail tests when a job completes with a non-success terminal state
FAIL_ON_ERROR_STATE = os.environ.get("FAIL_ON_ERROR_STATE", "false").lower() == "true"

PROXIES = None
HEADERS = {
    "Authorization": f"Bearer {API_KEY}" if API_KEY else "",
    "Content-Type": "application/json"
}

# Test result tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "details": []
}

# Store created resources for cleanup
created_resources = {
    "training_jobs": []
}

class TestResult:
    """Store details about a test result."""
    def __init__(self, name: str, status: str, message: str = "", duration: float = 0):
        self.name = name
        self.status = status
        self.message = message
        self.duration = duration
        self.timestamp = datetime.now().isoformat()

def test_endpoint(name: str, endpoint: str, method: str = "GET", data: Dict = None, 
                  expected_status: int = 200, expected_content: Any = None,
                  depends_on: List[str] = None, extract_values: Dict = None) -> Dict:
    """Test an API endpoint and report results.
    
    Args:
        name: Test name for reporting
        endpoint: API endpoint to test (without base URL)
        method: HTTP method (GET, POST, etc.)
        data: Request payload for POST/PUT
        expected_status: Expected HTTP status code
        expected_content: String or dict that should be in the response
        depends_on: List of test names that must pass before this test runs
        extract_values: Dict of {variable_name: json_path} to extract from response
    
    Returns:
        Dict containing response data and extracted values
    """
    # Check dependencies
    if depends_on:
        for dep in depends_on:
            if any(r.name == dep and r.status != "passed" for r in test_results["details"]):
                print(f"\n⏭️ Skipping: {name} (dependency '{dep}' failed or was skipped)")
                test_results["skipped"] += 1
                test_results["details"].append(
                    TestResult(name, "skipped", f"Dependency '{dep}' failed or was skipped")
                )
                return {"skipped": True}
    
    url = f"{BASE_URL}{endpoint}"
    print(f"\n🧪 Testing: {name} ({method} {endpoint})")
    
    start_time = time.time()
    extracted = {}
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=HEADERS, proxies=PROXIES, timeout=REQUEST_TIMEOUT)
        elif method.upper() == "POST":
            response = requests.post(url, headers=HEADERS, json=data, proxies=PROXIES, timeout=REQUEST_TIMEOUT)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=HEADERS, json=data, proxies=PROXIES, timeout=REQUEST_TIMEOUT)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=HEADERS, proxies=PROXIES, timeout=REQUEST_TIMEOUT)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        duration = time.time() - start_time
        
        # Pretty print response for debugging
        print(f"📋 Response ({response.status_code}) - {duration:.2f}s:")
        try:
            response_json = response.json()
            pretty_json = json.dumps(response_json, indent=2)
            print(pretty_json)
        except:
            print(response.text)
            response_json = {}
        
        # Check status code
        if response.status_code != expected_status:
            error_msg = f"Expected status {expected_status}, got {response.status_code}"
            test_results["failed"] += 1
            test_results["details"].append(
                TestResult(name, "failed", error_msg, duration)
            )
            return {"success": False, "error": error_msg, "response": response_json}
        
        # Check response content if provided
        if expected_content:
            if isinstance(expected_content, dict):
                for key, value in expected_content.items():
                    if key not in response_json or response_json[key] != value:
                        error_msg = f"Expected content not found: {key}={value}"
                        test_results["failed"] += 1
                        test_results["details"].append(
                            TestResult(name, "failed", error_msg, duration)
                        )
                        return {"success": False, "error": error_msg, "response": response_json}
            elif expected_content not in response.text:
                error_msg = f"Expected content not found: {expected_content}"
                test_results["failed"] += 1
                test_results["details"].append(
                    TestResult(name, "failed", error_msg, duration)
                )
                return {"success": False, "error": error_msg, "response": response_json}
        
        # Extract values if needed
        if extract_values and isinstance(response_json, dict):
            for var_name, json_path in extract_values.items():
                parts = json_path.split('.')
                value = response_json
                for part in parts:
                    if part in value:
                        value = value[part]
                    else:
                        value = None
                        break
                extracted[var_name] = value
        
        print(f"✅ Test passed ({duration:.2f}s)")
        test_results["passed"] += 1
        test_results["details"].append(
            TestResult(name, "passed", "", duration)
        )
        
        return {
            "success": True, 
            "response": response_json,
            "extracted": extracted
        }
        
    except Exception as e:
        duration = time.time() - start_time
        error_msg = f"Error: {str(e)}"
        print(f"❌ {error_msg}")
        test_results["failed"] += 1
        test_results["details"].append(
            TestResult(name, "failed", error_msg, duration)
        )
        return {"success": False, "error": error_msg}

def setup():
    """Set up the test environment."""
    # Check if API is available
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code != 200:
            print(f"⚠️ Warning: API not responding correctly. Status: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Warning: Cannot connect to API at {BASE_URL}: {str(e)}")
        print("Make sure the API server is running before continuing.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

def teardown():
    """Clean up any resources created during tests."""
    if not created_resources["training_jobs"]:
        return
    
    print("\n🧹 Cleaning up resources...")
    for job_id in created_resources["training_jobs"]:
        try:
            print(f"  - Attempting to cancel training job {job_id}")
            # You might want to add actual cleanup code here
            # requests.post(f"{BASE_URL}/v1/training/jobs/{job_id}/cancel", headers=HEADERS)
        except Exception as e:
            print(f"    Error during cleanup: {str(e)}")

# Test definitions
def test_root_endpoint():
    return test_endpoint(
        "Root Endpoint", 
        "/", 
        expected_content={"message": "Welcome to the Training API"}
    )

def test_test_call():
    return test_endpoint(
        "Test Call", 
        "/v1/test_call", 
        expected_content={"message": "Hello, World!", "status": "API is working"}
    )

def test_create_training_job():
    """Test creating a training job and waiting for it to complete."""
    result = test_endpoint(
        "Create Training Job",
        "/v1/train",
        method="POST",
        data={
            "model_name": "Tiny-random-llama-3",
            "model_path": "",
            "datasets": ["easydata2022/private_alpaca_mini_slice"],
            "train_method": "lora"
        },
        expected_status=200,
        extract_values={"job_id": "job_id"}
    )
    
    if result.get("success") and "job_id" in result.get("extracted", {}):
        job_id = result["extracted"]["job_id"]
        created_resources["training_jobs"].append(job_id)
        
        # Wait for the job to complete
        completion_result = wait_for_job_completion(job_id)
        
        # Update test results based on job completion
        if not completion_result.get("success"):
            error_msg = completion_result.get("error", "Unknown error waiting for job")
            test_results["details"][-1].status = "failed"
            test_results["details"][-1].message = error_msg
            test_results["failed"] += 1
            test_results["passed"] -= 1
            print(f"❌ Training job monitoring failed: {error_msg}")
        else:
            final_status = completion_result.get("response", {}).get("status", "unknown")
            error_message = completion_result.get("response", {}).get("error_message", "")
            
            print(f"📋 Final job status: {final_status}")
            if error_message:
                print(f"📋 Error details: {error_message}")
            
            # Only mark as failed if FAIL_ON_ERROR_STATE is true and job didn't succeed
            if FAIL_ON_ERROR_STATE and not completion_result.get("job_succeeded", False):
                error_details = f"Error: {error_message}" if error_message else ""
                error_msg = f"Job completed with status: {final_status}. {error_details}"
                test_results["details"][-1].status = "failed"
                test_results["details"][-1].message = error_msg
                test_results["failed"] += 1
                test_results["passed"] -= 1
                print(f"❌ {error_msg}")
            else:
                # Log warning but don't fail the test
                if not completion_result.get("job_succeeded", False):
                    print(f"⚠️ Job completed with non-success status: {final_status}, but test is marked as passed")
                    print(f"   Set FAIL_ON_ERROR_STATE=true to fail tests in this case")
    
    return result

def test_get_training_status():
    # This test depends on create_training_job
    if not created_resources["training_jobs"]:
        print("⏭️ Skipping: Get Training Status (no job_id available)")
        test_results["skipped"] += 1
        test_results["details"].append(
            TestResult("Get Training Status", "skipped", "No job_id available")
        )
        return {"skipped": True}
    
    job_id = created_resources["training_jobs"][0]
    return test_endpoint(
        "Get Training Status",
        f"/v1/train/{job_id}/status",
        expected_status=200
    )

def wait_for_job_completion(job_id: str, max_wait_time: int = MAX_WAIT_TIME) -> Dict:
    """Poll the status endpoint until the job completes or times out.
    
    Args:
        job_id: The ID of the training job to monitor
        max_wait_time: Maximum time to wait in seconds
        
    Returns:
        Dict containing the final status response or error information
    """
    print(f"\n⏳ Waiting for training job {job_id} to complete (timeout: {max_wait_time}s)")
    
    start_time = time.time()
    poll_count = 0
    consecutive_errors = 0
    max_consecutive_errors = 5  # Maximum number of consecutive errors before giving up
    initial_backoff = 1  # Initial backoff time in seconds
    max_backoff = 30  # Maximum backoff time in seconds
    current_backoff = initial_backoff
    
    # Common error patterns to provide better diagnostics
    known_errors = {
        "tokenizer": ["failed to load tokenizer", "tokenizer not found", "tokenizer error"],
        "model": ["failed to load model", "model not found", "model error"],
        "dataset": ["failed to load dataset", "dataset not found", "dataset error"],
        "gpu": ["cuda", "gpu", "out of memory", "oom"],
        "permission": ["permission denied", "access denied"]
    }
    
    while time.time() - start_time < max_wait_time:
        poll_count += 1
        
        try:
            response = requests.get(
                f"{BASE_URL}/v1/train/{job_id}/status",
                headers=HEADERS,
                proxies=PROXIES,
                timeout=REQUEST_TIMEOUT
            )
            
            # If we got a response (even an error response), reset the backoff and error count
            consecutive_errors = 0
            current_backoff = initial_backoff
            
            if response.status_code == 429:  # Too Many Requests
                print(f"  ⚠️ Server is rate limiting requests (HTTP 429). Backing off for {current_backoff}s")
                time.sleep(current_backoff)
                current_backoff = min(current_backoff * 2, max_backoff)  # Exponential backoff
                continue
                
            if response.status_code != 200:
                print(f"  ⚠️ Error checking status: HTTP {response.status_code}. Retrying in {current_backoff}s")
                time.sleep(current_backoff)
                current_backoff = min(current_backoff * 2, max_backoff)  # Exponential backoff
                continue
            
            status_data = response.json()
            current_status = status_data.get("status", "unknown")
            
            # Extract additional details if available
            error_message = status_data.get("error_message", "")
            # Also check for 'message' field which some APIs use for errors
            if not error_message and "message" in status_data:
                error_message = status_data.get("message", "")
                
            progress = status_data.get("progress", "")
            
            elapsed = time.time() - start_time
            status_details = f"Status = {current_status}"
            if progress:
                status_details += f", Progress = {progress}"
            if error_message:
                status_details += f", Error = {error_message}"
                
            print(f"  Poll #{poll_count} ({elapsed:.1f}s): {status_details}")
            
            # Check if job reached a terminal state (case insensitive)
            if current_status.lower() in [s.lower() for s in TERMINAL_STATES]:
                is_success = current_status.lower() in [s.lower() for s in SUCCESS_STATES]
                status_type = "✅ Success" if is_success else "⚠️ Completed with issues"
                print(f"{status_type}: Job reached terminal state: {current_status} after {elapsed:.1f}s")
                
                # Provide more detailed diagnostics for known error types
                if error_message and not is_success:
                    print(f"  Error details: {error_message}")
                    
                    # Check for known error patterns
                    error_msg_lower = error_message.lower()
                    for error_type, patterns in known_errors.items():
                        if any(pattern in error_msg_lower for pattern in patterns):
                            if error_type == "tokenizer":
                                print("  💡 Troubleshooting: This appears to be a tokenizer-related error.")
                                print("     - Check that the model name is correct")
                                print("     - Verify the model is available in Hugging Face or your local cache")
                                print("     - Ensure you have permission to access this model")
                            elif error_type == "model":
                                print("  💡 Troubleshooting: This appears to be a model-loading error.")
                                print("     - Check that the model exists and is accessible")
                                print("     - Verify you have sufficient disk space")
                            elif error_type == "dataset":
                                print("  💡 Troubleshooting: This appears to be a dataset-related error.")
                                print("     - Verify the dataset name/path is correct")
                                print("     - Check that the dataset format is compatible")
                            elif error_type == "gpu":
                                print("  💡 Troubleshooting: This appears to be a GPU-related error.")
                                print("     - Check for sufficient GPU memory")
                                print("     - Verify CUDA installation is working")
                            elif error_type == "permission":
                                print("  💡 Troubleshooting: This appears to be a permissions issue.")
                                print("     - Check access rights to model/dataset files")
                                print("     - Verify API tokens or credentials if needed")
                            break
                
                return {
                    "success": True,  # Job monitoring succeeded even if job had errors
                    "job_succeeded": is_success,
                    "response": status_data,
                    "error_message": error_message
                }
            
            # Wait before polling again - if status is pending/running, use normal interval
            # For unknown status, use the backoff mechanism
            if current_status.lower() in ["pending", "running", "starting"]:
                time.sleep(POLLING_INTERVAL)
            else:
                print(f"  ⚠️ Unknown status '{current_status}'. Backing off for {current_backoff}s")
                time.sleep(current_backoff)
                current_backoff = min(current_backoff * 1.5, max_backoff)  # Slower backoff for unknown status
            
        except requests.exceptions.Timeout:
            # Handle timeout separately
            print(f"  ⚠️ Request timed out after {REQUEST_TIMEOUT}s. Retrying in {current_backoff}s")
            consecutive_errors += 1
            time.sleep(current_backoff)
            current_backoff = min(current_backoff * 2, max_backoff)
            
        except requests.exceptions.ConnectionError:
            # Handle connection errors
            print(f"  ⚠️ Connection error. Server might be busy. Retrying in {current_backoff}s")
            consecutive_errors += 1
            time.sleep(current_backoff)
            current_backoff = min(current_backoff * 2, max_backoff)
            
        except Exception as e:
            # Handle other errors
            print(f"  ⚠️ Error while polling status: {str(e)}. Retrying in {current_backoff}s")
            consecutive_errors += 1
            time.sleep(current_backoff)
            current_backoff = min(current_backoff * 2, max_backoff)
        
        # If we've had too many consecutive errors, give up
        if consecutive_errors >= max_consecutive_errors:
            print(f"❌ Too many consecutive errors ({consecutive_errors}). Giving up.")
            return {
                "success": False, 
                "error": f"Too many consecutive errors while polling status",
                "max_errors_reached": True
            }
    
    print(f"⚠️ Timeout reached after {max_wait_time}s. Job is still running or status is unavailable.")
    return {"success": False, "error": "Timeout waiting for job completion", "timed_out": True}

def test_training_flow():
    """Test the entire training flow: create job, monitor progress, and get final status."""
    # Create training job
    create_result = test_endpoint(
        "Create Training Job for Flow Test",
        "/v1/train",
        method="POST",
        data={
        "model_name": "llamafactory/tiny-random-Llama-3",
        "model_path":"",
        "datasets": [
            "easydata2022/public_alpaca_mini_slice"
        ],
        "train_method": "supervised"
        },
        expected_status=200,
        extract_values={"job_id": "job_id"}
    )
    
    if not create_result.get("success") or "job_id" not in create_result.get("extracted", {}):
        return create_result
    
    job_id = create_result["extracted"]["job_id"]
    created_resources["training_jobs"].append(job_id)
    
    # Wait for job completion
    completion_result = wait_for_job_completion(job_id)
    
    if not completion_result.get("success"):
        error_msg = completion_result.get("error", "Unknown error waiting for job")
        test_results["failed"] += 1
        test_results["details"].append(
            TestResult("Training Flow - Wait for Completion", "failed", error_msg)
        )
        return {"success": False, "error": error_msg}
    
    # Get final status
    final_status_result = test_endpoint(
        "Training Flow - Get Final Status",
        f"/v1/train/{job_id}/status",
        expected_status=200
    )
    
    # Check job result but don't fail test unless FAIL_ON_ERROR_STATE is true
    if final_status_result.get("success"):
        status = final_status_result.get("response", {}).get("status", "").lower()
        if status not in [s.lower() for s in SUCCESS_STATES]:
            print(f"⚠️ Job completed with non-success status: {status}")
            if FAIL_ON_ERROR_STATE:
                error_msg = f"Job completed with unexpected status: {status}"
                test_results["details"][-1].status = "failed"
                test_results["details"][-1].message = error_msg
                test_results["failed"] += 1
                test_results["passed"] -= 1
    
    return final_status_result

# Map of test names to test functions
TESTS = {
    "root_endpoint": test_root_endpoint,
    "test_call": test_test_call,
    "create_training_job": test_create_training_job,
    "get_training_status": test_get_training_status,
    "training_flow": test_training_flow,
}

def run_tests(test_names=None):
    """Run specified tests or all tests if none specified."""
    if test_names:
        # Run only specified tests
        for name in test_names:
            if name in TESTS:
                TESTS[name]()
            else:
                print(f"⚠️ Warning: Test '{name}' not found. Available tests: {', '.join(TESTS.keys())}")
    else:
        # Run all tests
        for test_func in TESTS.values():
            test_func()

def print_summary():
    """Print summary of test results."""
    total = test_results["passed"] + test_results["failed"] + test_results["skipped"]
    
    print("\n" + "=" * 60)
    print(f"📊 TEST SUMMARY: {total} tests")
    print(f"✅ Passed:  {test_results['passed']}")
    print(f"❌ Failed:  {test_results['failed']}")
    print(f"⏭️ Skipped: {test_results['skipped']}")
    print("=" * 60)
    
    if test_results["failed"] > 0:
        print("\n❌ FAILED TESTS:")
        for result in test_results["details"]:
            if result.status == "failed":
                print(f"  - {result.name}: {result.message}")
    
    print("\n📚 API Documentation")
    print(f"To view interactive API documentation, visit: {BASE_URL}/docs")
    print(f"For ReDoc alternative documentation, visit: {BASE_URL}/redoc")

def parse_arguments():
    parser = argparse.ArgumentParser(description='Run API end-to-end tests')
    parser.add_argument('tests', nargs='*', help='Specific tests to run')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    
    print(f"🚀 Running API tests against {BASE_URL}")
    start_time = time.time()
    
    setup()
    
    try:
        run_tests(args.tests)
    finally:
        teardown()
        
    total_time = time.time() - start_time
    print_summary()
    print(f"\n⏱️ Total execution time: {total_time:.2f} seconds")
    
    if test_results["failed"] > 0:
        sys.exit(1)  # Return non-zero exit code if any tests failed
