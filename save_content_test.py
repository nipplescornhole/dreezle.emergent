#!/usr/bin/env python3
"""
Focused Save Content Functionality Tests for Drezzle
Tests the save/unsave content endpoints specifically
"""

import requests
import json
import base64
import time
from datetime import datetime
import os
import random
import string

# Get backend URL from environment
BACKEND_URL = "https://social-beats-5.preview.emergentagent.com/api"

class SaveContentTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.tokens = {}
        self.users = {}
        self.contents = []
        self.test_results = []
        
        # Generate unique suffix for this test run
        self.test_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        
    def log_test(self, test_name, success, message="", details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    def setup_test_users(self):
        """Create test users with unique emails"""
        print("\n=== Setting Up Test Users ===")
        
        test_users = [
            {"email": f"listener_{self.test_suffix}@drezzle.com", "password": "password123", "username": f"listener_{self.test_suffix}", "role": "listener"},
            {"email": f"creator_{self.test_suffix}@drezzle.com", "password": "password123", "username": f"creator_{self.test_suffix}", "role": "creator"},
            {"email": f"expert_{self.test_suffix}@drezzle.com", "password": "password123", "username": f"expert_{self.test_suffix}", "role": "expert"},
            {"email": f"label_{self.test_suffix}@drezzle.com", "password": "password123", "username": f"label_{self.test_suffix}", "role": "label"}
        ]
        
        success_count = 0
        for user_data in test_users:
            try:
                response = requests.post(f"{self.base_url}/auth/register", json=user_data, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data:
                        self.tokens[user_data['role']] = data['access_token']
                        self.users[user_data['role']] = user_data
                        print(f"✅ Created {user_data['role']} user: {user_data['username']}")
                        success_count += 1
                    else:
                        print(f"❌ Missing token for {user_data['role']}: {data}")
                else:
                    print(f"❌ Failed to create {user_data['role']}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Exception creating {user_data['role']}: {str(e)}")
        
        return success_count >= 2  # Need at least listener and creator
    
    def create_test_content(self):
        """Create test content for save functionality testing"""
        print("\n=== Creating Test Content ===")
        
        if "creator" not in self.tokens:
            print("❌ No creator token available")
            return False
        
        # Sample audio data (base64 encoded)
        sample_audio = base64.b64encode(b"fake_audio_data_for_testing").decode()
        sample_image = base64.b64encode(b"fake_image_data_for_testing").decode()
        
        content_data = {
            "title": f"Test Audio Content {self.test_suffix}",
            "description": "Test content for save functionality testing",
            "audio_data": sample_audio,
            "cover_image": sample_image,
            "duration": 120.5
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.tokens['creator']}"}
            response = requests.post(f"{self.base_url}/contents", json=content_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.contents.append(data['id'])
                    print(f"✅ Created test content: {data['id']}")
                    return True
                else:
                    print(f"❌ Invalid content response: {data}")
            else:
                print(f"❌ Failed to create content: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Exception creating content: {str(e)}")
        
        return False
    
    def test_save_content_toggle(self):
        """Test save/unsave toggle functionality"""
        print("\n=== Testing Save Content Toggle ===")
        
        if not self.contents or "listener" not in self.tokens:
            self.log_test("Save Content Toggle", False, "Missing content or listener token")
            return False
        
        content_id = self.contents[0]
        headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
        success_count = 0
        
        try:
            # Test 1: Save content (first time)
            response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Content saved" and data.get("saved") == True:
                    self.log_test("Save Content (First)", True, "Content saved successfully")
                    success_count += 1
                else:
                    self.log_test("Save Content (First)", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Save Content (First)", False, f"Status: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Unsave content (toggle)
            response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Content unsaved" and data.get("saved") == False:
                    self.log_test("Unsave Content", True, "Content unsaved successfully")
                    success_count += 1
                else:
                    self.log_test("Unsave Content", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Unsave Content", False, f"Status: {response.status_code} - {response.text}")
                return False
            
            # Test 3: Save again (toggle back)
            response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Content saved" and data.get("saved") == True:
                    self.log_test("Re-save Content", True, "Content re-saved successfully")
                    success_count += 1
                else:
                    self.log_test("Re-save Content", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Re-save Content", False, f"Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Save Content Toggle", False, f"Exception: {str(e)}")
            return False
        
        return success_count == 3
    
    def test_save_nonexistent_content(self):
        """Test saving non-existent content (should return 404)"""
        print("\n=== Testing Save Non-existent Content ===")
        
        if "listener" not in self.tokens:
            self.log_test("Save Non-existent", False, "No listener token")
            return False
        
        fake_content_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
        headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
        
        try:
            response = requests.post(f"{self.base_url}/contents/{fake_content_id}/save", headers=headers, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Save Non-existent", True, "Correctly returned 404 for non-existent content")
                return True
            else:
                self.log_test("Save Non-existent", False, f"Expected 404, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Save Non-existent", False, f"Exception: {str(e)}")
            return False
    
    def test_save_unauthorized(self):
        """Test save endpoint without authentication"""
        print("\n=== Testing Save Unauthorized ===")
        
        if not self.contents:
            self.log_test("Save Unauthorized", False, "No content available")
            return False
        
        content_id = self.contents[0]
        
        try:
            # Test without Authorization header
            response = requests.post(f"{self.base_url}/contents/{content_id}/save", timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Save Unauthorized", True, f"Correctly rejected unauthorized access (status: {response.status_code})")
                return True
            else:
                self.log_test("Save Unauthorized", False, f"Expected 401/403, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Save Unauthorized", False, f"Exception: {str(e)}")
            return False
    
    def test_get_saved_contents(self):
        """Test GET /api/saved-contents endpoint"""
        print("\n=== Testing Get Saved Contents ===")
        
        if "listener" not in self.tokens:
            self.log_test("Get Saved Contents", False, "No listener token")
            return False
        
        headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
        success_count = 0
        
        try:
            # Test basic retrieval
            response = requests.get(f"{self.base_url}/saved-contents", headers=headers, timeout=10)
            
            if response.status_code == 200:
                saved_contents = response.json()
                if isinstance(saved_contents, list):
                    self.log_test("Get Saved Contents", True, f"Retrieved {len(saved_contents)} saved contents")
                    success_count += 1
                    
                    # Verify content structure if any items exist
                    if saved_contents:
                        content = saved_contents[0]
                        required_fields = ["id", "user_id", "title", "content_type", "created_at"]
                        missing_fields = [field for field in required_fields if field not in content]
                        
                        if not missing_fields:
                            self.log_test("Saved Content Structure", True, "Content structure is correct")
                            success_count += 1
                        else:
                            self.log_test("Saved Content Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Get Saved Contents", False, f"Expected list, got: {type(saved_contents)}")
                    return False
            else:
                self.log_test("Get Saved Contents", False, f"Status: {response.status_code} - {response.text}")
                return False
            
            # Test pagination
            response = requests.get(f"{self.base_url}/saved-contents?skip=0&limit=5", headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("Saved Contents Pagination", True, "Pagination parameters accepted")
                success_count += 1
            else:
                self.log_test("Saved Contents Pagination", False, f"Pagination failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Saved Contents", False, f"Exception: {str(e)}")
            return False
        
        return success_count >= 1
    
    def test_get_saved_contents_unauthorized(self):
        """Test GET /api/saved-contents without authentication"""
        print("\n=== Testing Get Saved Contents Unauthorized ===")
        
        try:
            response = requests.get(f"{self.base_url}/saved-contents", timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Get Saved Unauthorized", True, f"Correctly rejected unauthorized access (status: {response.status_code})")
                return True
            else:
                self.log_test("Get Saved Unauthorized", False, f"Expected 401/403, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Saved Unauthorized", False, f"Exception: {str(e)}")
            return False
    
    def test_save_with_different_roles(self):
        """Test save functionality with different user roles"""
        print("\n=== Testing Save with Different User Roles ===")
        
        if not self.contents:
            self.log_test("Save Different Roles", False, "No content available")
            return False
        
        content_id = self.contents[0]
        success_count = 0
        
        # Test with each user role
        for role in ["listener", "creator", "expert", "label"]:
            if role not in self.tokens:
                print(f"⚠️ No {role} user available")
                continue
                
            try:
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if "saved" in data and "message" in data:
                        self.log_test(f"Save as {role}", True, f"{role.capitalize()} can save content")
                        success_count += 1
                    else:
                        self.log_test(f"Save as {role}", False, f"Unexpected response: {data}")
                else:
                    self.log_test(f"Save as {role}", False, f"Status: {response.status_code} - {response.text}")
                    
            except Exception as e:
                self.log_test(f"Save as {role}", False, f"Exception: {str(e)}")
        
        return success_count > 0
    
    def run_save_content_tests(self):
        """Run all save content functionality tests"""
        print("🚀 Starting Save Content System Tests")
        print(f"Testing against: {self.base_url}")
        print(f"Test run ID: {self.test_suffix}")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users")
            return False
        
        if not self.create_test_content():
            print("❌ Failed to create test content")
            return False
        
        # Run save content specific tests
        tests = [
            ("Save Content Toggle", self.test_save_content_toggle),
            ("Save Non-existent Content", self.test_save_nonexistent_content),
            ("Save Unauthorized", self.test_save_unauthorized),
            ("Get Saved Contents", self.test_get_saved_contents),
            ("Get Saved Contents Unauthorized", self.test_get_saved_contents_unauthorized),
            ("Save with Different Roles", self.test_save_with_different_roles)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test_name} failed with exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 SAVE CONTENT SYSTEM TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Print detailed results
        print("\n📊 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            if result['details']:
                print(f"   {result['details']}")
        
        if passed == total:
            print("\n🎉 ALL SAVE CONTENT TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️ {total - passed} SAVE CONTENT TESTS FAILED!")
            return False

def main():
    """Main function to run save content tests"""
    tester = SaveContentTester()
    success = tester.run_save_content_tests()
    
    if success:
        print("\n✅ Save Content System is working correctly!")
        exit(0)
    else:
        print("\n❌ Save Content System has issues that need attention!")
        exit(1)

if __name__ == "__main__":
    main()