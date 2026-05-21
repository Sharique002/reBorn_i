import sys
import time
import requests
import uuid

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Generate a unique email for registration
unique_suffix = int(time.time())
TEST_EMAIL = f"qa_tester_{unique_suffix}@example.com"
TEST_PASSWORD = "Password@123"
TEST_NAME = "QA E2E Tester"

print("=" * 60)
print(f"[*] Starting reBorn_i Systematic API Verification")
print(f"Target URL: {BASE_URL}")
print(f"Test Email: {TEST_EMAIL}")
print("=" * 60)

# Helpers
def assert_status(response, expected_status):
    if response.status_code != expected_status:
        print(f"[-] Error: Expected status {expected_status}, got {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)
    else:
        print(f"[+] Success (Status {response.status_code})")

# 1. Health Check
print("\n--- 1. Health Check ---")
r = requests.get(f"{API_URL}/health")
assert_status(r, 200)
health_data = r.json()
assert health_data["status"] == "healthy"
print(f"Health Data: {health_data}")

# 2. Registration
print("\n--- 2. Register User ---")
payload = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "full_name": TEST_NAME
}
r = requests.post(f"{API_URL}/auth/register", json=payload)
assert_status(r, 201)
reg_data = r.json()
assert reg_data["email"] == TEST_EMAIL
print(f"Registered User ID: {reg_data.get('id')}")

# 3. Login
print("\n--- 3. Login ---")
payload = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
}
r = requests.post(f"{API_URL}/auth/login", json=payload)
assert_status(r, 200)
token_data = r.json()
token = token_data["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Access token retrieved successfully.")

# 4. Get Profile
print("\n--- 4. Get User Profile ---")
r = requests.get(f"{API_URL}/auth/me", headers=headers)
assert_status(r, 200)
profile_data = r.json()
assert profile_data["email"] == TEST_EMAIL
assert profile_data["subscription_plan"] == "free"
print(f"Profile: {profile_data}")

# 5. Resume Upload
print("\n--- 5. Resume Upload ---")
# Minimal hand-crafted valid PDF content
pdf_bytes = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 72 >>
stream
BT
/F1 12 Tf
72 712 Td
(Python Javascript AWS Docker Resume summary education experience) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000351 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
439
%%EOF"""

files = {"file": ("resume.pdf", pdf_bytes, "application/pdf")}
r = requests.post(f"{API_URL}/resume/upload", files=files, headers=headers)
assert_status(r, 201)
resume_data = r.json()
resume_id = resume_data["id"]
print(f"Uploaded Resume ID: {resume_id}")

# 6. Resume List
print("\n--- 6. Resume List ---")
r = requests.get(f"{API_URL}/resume/list", headers=headers)
assert_status(r, 200)
resumes = r.json()
assert len(resumes) >= 1
print(f"Resumes listed: {resumes}")

# 7. Get Resume Details
print("\n--- 7. Get Resume Details ---")
r = requests.get(f"{API_URL}/resume/{resume_id}", headers=headers)
assert_status(r, 200)
resume_details = r.json()
assert resume_details["id"] == resume_id
print("Extracted skills:", resume_details.get("structured_data", {}).get("skills"))

# 8. Analyze Rejection Risk (Requires a job description)
print("\n--- 8. Analyze Rejection Risk ---")
payload = {
    "resume_id": resume_id,
    "job_description": "We are looking for a Senior Software Engineer with expertise in Python, Javascript, AWS, and Docker.",
    "job_title": "Senior Software Engineer"
}
r = requests.post(f"{API_URL}/analysis/rejection-risk", json=payload, headers=headers)
assert_status(r, 200)
analysis_data = r.json()
risk_score = analysis_data["risk_score"]
print(f"Rejection Risk Score: {risk_score}% (Level: {analysis_data['risk_level']})")

# 9. List Rejection Analyses
print("\n--- 9. List Rejection Analyses ---")
r = requests.get(f"{API_URL}/analysis/list", headers=headers)
assert_status(r, 200)
analyses = r.json()
assert len(analyses) >= 1
print(f"Recent analyses: {analyses}")

# 10. Market Radar
print("\n--- 10. Market Radar ---")
# Get radar personalized for our resume
r = requests.get(f"{API_URL}/market/radar?resume_id={resume_id}", headers=headers)
assert_status(r, 200)
market_data = r.json()
print("Market Radar demand skills count:", len(market_data.get("demand_skills", [])))

# 11. Market Radar Refresh (Background Task)
print("\n--- 11. Refresh Market Radar ---")
r = requests.post(f"{API_URL}/market/radar/refresh", headers=headers)
assert_status(r, 200)
print(f"Market Radar Refresh: {r.json()}")

# 12. Career Simulation
print("\n--- 12. Career Simulation ---")
payload = {
    "resume_id": resume_id,
    "job_description": "We are looking for a Senior Software Engineer with expertise in Python, Javascript, AWS, Docker, Kubernetes, and Go.",
    "skills_to_add": ["Kubernetes", "Go"],
    "skills_to_remove": []
}
r = requests.post(f"{API_URL}/simulation/simulate", json=payload, headers=headers)
assert_status(r, 200)
sim_data = r.json()
print(f"Risk Delta: {sim_data['risk_delta']}% (Before: {sim_data['before_metrics']['risk_score']}%, After: {sim_data['after_metrics']['risk_score']}%)")

# 13. Reinvention Blueprint
print("\n--- 13. Reinvention Blueprint ---")
payload = {
    "resume_id": resume_id,
    "job_description": "We are looking for a Senior Software Engineer with expertise in Python, Javascript, AWS, and Docker.",
    "target_role": "Senior Software Engineer",
    "plan_type": "90_day"
}
r = requests.post(f"{API_URL}/blueprint/generate", json=payload, headers=headers)
assert_status(r, 201)
blueprint_data = r.json()
print(f"Reinvention Blueprint generated successfully. Plan type: {blueprint_data['plan_type']}")

# 14. Hiring Pipeline Simulation
print("\n--- 14. Hiring Pipeline Simulation ---")
payload = {
    "ATS_risk": risk_score if risk_score <= 1.0 else risk_score / 100.0,
    "Recruiter_risk": 0.4,
    "Market_risk": 0.35,
    "Grammar_risk": 0.1,
    "Formatting_risk": 0.05,
    "domain": "TECH"
}
r = requests.post(f"{API_URL}/hiring-pipeline/simulate", json=payload)
assert_status(r, 200)
pipeline_data = r.json()
print(f"Hiring Pipeline Overall Survival: {pipeline_data.get('pipeline_survival', {}).get('Final_Interview_Probability', 0) * 100:.2f}%")

# 15. Create Payment Order
print("\n--- 15. Create Payment Order ---")
r = requests.post(f"{API_URL}/payment/create-order", json={}, headers=headers)
assert_status(r, 201)
order_data = r.json()
order_id = order_data["order_id"]
print(f"Payment Order Created: {order_id} (Amount: {order_data['amount']} {order_data['currency']})")

# 16. Verify Payment & Upgrade Subscription (Using Dev Bypass)
print("\n--- 16. Verify Payment & Upgrade Subscription ---")
payload = {
    "razorpay_order_id": order_id,
    "razorpay_payment_id": "pay_mock_e2etest",
    "razorpay_signature": "signature_mock_e2etest"
}
r = requests.post(f"{API_URL}/payment/verify", json=payload, headers=headers)
assert_status(r, 200)
verify_data = r.json()
assert verify_data["success"] == True
print(f"Payment Verify Response: {verify_data}")

# 17. Confirm Subscription Status is PRO
print("\n--- 17. Confirm Subscription Status is PRO ---")
r = requests.get(f"{API_URL}/subscription/status", headers=headers)
assert_status(r, 200)
sub_status = r.json()
assert sub_status["plan"] == "pro"
assert sub_status["hasAccess"] == True
print(f"Subscription Status: {sub_status}")

print("\n" + "=" * 60)
print("[+] ALL API MODULES TESTED SUCCESSFULLY WITH NO BUGS OR ERRORS!")
print("=" * 60)
