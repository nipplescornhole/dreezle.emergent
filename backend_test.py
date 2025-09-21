#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Drezzle
Tests all endpoints with proper authentication and role-based access control
"""

import requests
import json
import base64
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class DrezzleAPITester:
    def __init__(self):
        self.base_url = API_BASE
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.contents = []  # Store created content IDs
        self.test_results = []
        
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
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n=== Testing Health Check ===")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and data['status'] == 'healthy':
                    self.log_test("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
        return False
    
    def test_user_registration(self):
        """Test user registration with different roles"""
        print("\n=== Testing User Registration ===")
        
        test_users = [
            {"email": "listener@drezzle.com", "password": "password123", "username": "listener_user", "role": "listener"},
            {"email": "creator@drezzle.com", "password": "password123", "username": "creator_user", "role": "creator"},
            {"email": "expert@drezzle.com", "password": "password123", "username": "expert_user", "role": "expert"},
            {"email": "label@drezzle.com", "password": "password123", "username": "label_user", "role": "label"}
        ]
        
        success_count = 0
        for user_data in test_users:
            try:
                response = requests.post(f"{self.base_url}/auth/register", json=user_data, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data and 'token_type' in data:
                        self.tokens[user_data['role']] = data['access_token']
                        self.users[user_data['role']] = user_data
                        self.log_test(f"Register {user_data['role']}", True, "User registered successfully")
                        success_count += 1
                    else:
                        self.log_test(f"Register {user_data['role']}", False, f"Missing token in response: {data}")
                else:
                    error_msg = response.text
                    self.log_test(f"Register {user_data['role']}", False, f"Status: {response.status_code}, Error: {error_msg}")
            except Exception as e:
                self.log_test(f"Register {user_data['role']}", False, f"Exception: {str(e)}")
        
        return success_count == len(test_users)
    
    def test_duplicate_registration(self):
        """Test duplicate registration handling"""
        print("\n=== Testing Duplicate Registration ===")
        
        duplicate_user = {"email": "listener@drezzle.com", "password": "password123", "username": "listener_user", "role": "listener"}
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=duplicate_user, timeout=10)
            if response.status_code == 400:
                self.log_test("Duplicate Registration", True, "Correctly rejected duplicate user")
                return True
            else:
                self.log_test("Duplicate Registration", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Duplicate Registration", False, f"Exception: {str(e)}")
        return False
    
    def test_user_login(self):
        """Test user login"""
        print("\n=== Testing User Login ===")
        
        success_count = 0
        for role, user_data in self.users.items():
            try:
                login_data = {"email": user_data['email'], "password": user_data['password']}
                response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data:
                        # Update token (in case it's different from registration)
                        self.tokens[role] = data['access_token']
                        self.log_test(f"Login {role}", True, "Login successful")
                        success_count += 1
                    else:
                        self.log_test(f"Login {role}", False, f"Missing token: {data}")
                else:
                    self.log_test(f"Login {role}", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Login {role}", False, f"Exception: {str(e)}")
        
        return success_count == len(self.users)
    
    def test_invalid_login(self):
        """Test invalid login credentials"""
        print("\n=== Testing Invalid Login ===")
        
        invalid_login = {"email": "nonexistent@drezzle.com", "password": "wrongpassword"}
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=invalid_login, timeout=10)
            if response.status_code == 401:
                self.log_test("Invalid Login", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_test("Invalid Login", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Login", False, f"Exception: {str(e)}")
        return False
    
    def test_get_current_user(self):
        """Test getting current user info"""
        print("\n=== Testing Get Current User ===")
        
        success_count = 0
        for role, token in self.tokens.items():
            try:
                headers = {"Authorization": f"Bearer {token}"}
                response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'email' in data and 'role' in data and data['role'] == role:
                        self.log_test(f"Get User Info {role}", True, f"Retrieved user info for {role}")
                        success_count += 1
                    else:
                        self.log_test(f"Get User Info {role}", False, f"Invalid user data: {data}")
                else:
                    self.log_test(f"Get User Info {role}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Get User Info {role}", False, f"Exception: {str(e)}")
        
        return success_count == len(self.tokens)
    
    def test_invalid_token(self):
        """Test invalid token handling"""
        print("\n=== Testing Invalid Token ===")
        
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Invalid Token", True, "Correctly rejected invalid token")
                return True
            else:
                self.log_test("Invalid Token", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Token", False, f"Exception: {str(e)}")
        return False
    
    def test_content_creation(self):
        """Test content creation with different user roles"""
        print("\n=== Testing Content Creation ===")
        
        # Sample audio data (base64 encoded)
        sample_audio = base64.b64encode(b"fake_audio_data_for_testing").decode()
        sample_image = base64.b64encode(b"fake_image_data_for_testing").decode()
        
        content_data = {
            "title": "Test Audio Content",
            "description": "This is a test audio content",
            "audio_data": sample_audio,
            "cover_image": sample_image,
            "duration": 120.5
        }
        
        # Test with roles that should be able to create content
        allowed_roles = ["creator", "expert", "label"]
        success_count = 0
        
        for role in allowed_roles:
            if role in self.tokens:
                try:
                    headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                    response = requests.post(f"{self.base_url}/contents", json=content_data, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if 'id' in data and 'title' in data:
                            self.contents.append(data['id'])
                            self.log_test(f"Create Content {role}", True, f"Content created by {role}")
                            success_count += 1
                        else:
                            self.log_test(f"Create Content {role}", False, f"Invalid response: {data}")
                    else:
                        self.log_test(f"Create Content {role}", False, f"Status: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    self.log_test(f"Create Content {role}", False, f"Exception: {str(e)}")
        
        # Test with listener role (should fail)
        if "listener" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
                response = requests.post(f"{self.base_url}/contents", json=content_data, headers=headers, timeout=10)
                
                if response.status_code == 403:
                    self.log_test("Create Content listener (forbidden)", True, "Correctly rejected listener content creation")
                    success_count += 1
                else:
                    self.log_test("Create Content listener (forbidden)", False, f"Expected 403, got {response.status_code}")
            except Exception as e:
                self.log_test("Create Content listener (forbidden)", False, f"Exception: {str(e)}")
        
        return success_count > 0
    
    def test_get_contents(self):
        """Test getting contents (public endpoint)"""
        print("\n=== Testing Get Contents ===")
        
        try:
            response = requests.get(f"{self.base_url}/contents", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Contents", True, f"Retrieved {len(data)} contents")
                    return True
                else:
                    self.log_test("Get Contents", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Get Contents", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Contents", False, f"Exception: {str(e)}")
        return False
    
    def test_like_functionality(self):
        """Test like/unlike functionality"""
        print("\n=== Testing Like Functionality ===")
        
        if not self.contents:
            self.log_test("Like Functionality", False, "No content available to test")
            return False
        
        content_id = self.contents[0]
        success_count = 0
        
        # Test liking content
        if "listener" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
                
                # Like the content
                response = requests.post(f"{self.base_url}/contents/{content_id}/like", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'liked' in data and data['liked'] == True:
                        self.log_test("Like Content", True, "Content liked successfully")
                        success_count += 1
                        
                        # Unlike the content
                        response = requests.post(f"{self.base_url}/contents/{content_id}/like", headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if 'liked' in data and data['liked'] == False:
                                self.log_test("Unlike Content", True, "Content unliked successfully")
                                success_count += 1
                            else:
                                self.log_test("Unlike Content", False, f"Unexpected response: {data}")
                        else:
                            self.log_test("Unlike Content", False, f"Status: {response.status_code}")
                    else:
                        self.log_test("Like Content", False, f"Unexpected response: {data}")
                else:
                    self.log_test("Like Content", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("Like Content", False, f"Exception: {str(e)}")
        
        return success_count == 2
    
    def test_invalid_content_like(self):
        """Test liking non-existent content"""
        print("\n=== Testing Invalid Content Like ===")
        
        if "listener" not in self.tokens:
            self.log_test("Invalid Content Like", False, "No listener token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
            fake_content_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            
            response = requests.post(f"{self.base_url}/contents/{fake_content_id}/like", headers=headers, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Invalid Content Like", True, "Correctly rejected non-existent content")
                return True
            else:
                self.log_test("Invalid Content Like", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Content Like", False, f"Exception: {str(e)}")
        return False
    
    def test_comment_functionality(self):
        """Test comment creation and retrieval"""
        print("\n=== Testing Comment Functionality ===")
        
        if not self.contents:
            self.log_test("Comment Functionality", False, "No content available to test")
            return False
        
        content_id = self.contents[0]
        success_count = 0
        
        # Test creating comment
        if "listener" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
                comment_data = {"text": "This is a test comment on the audio content!"}
                
                response = requests.post(f"{self.base_url}/contents/{content_id}/comments", 
                                       json=comment_data, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'id' in data and 'text' in data and data['text'] == comment_data['text']:
                        self.log_test("Create Comment", True, "Comment created successfully")
                        success_count += 1
                    else:
                        self.log_test("Create Comment", False, f"Invalid response: {data}")
                else:
                    self.log_test("Create Comment", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Create Comment", False, f"Exception: {str(e)}")
        
        # Test retrieving comments
        try:
            response = requests.get(f"{self.base_url}/contents/{content_id}/comments", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Comments", True, f"Retrieved {len(data)} comments")
                    success_count += 1
                else:
                    self.log_test("Get Comments", True, "Retrieved comments (empty list)")
                    success_count += 1
            else:
                self.log_test("Get Comments", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get Comments", False, f"Exception: {str(e)}")
        
        return success_count >= 1
    
    def test_badge_request(self):
        """Test badge request functionality"""
        print("\n=== Testing Badge Request ===")
        
        if "creator" not in self.tokens:
            self.log_test("Badge Request", False, "No creator token available")
            return False
        
        success_count = 0
        
        # Test creating badge request as creator
        try:
            headers = {"Authorization": f"Bearer {self.tokens['creator']}"}
            request_data = {"reason": "I have been creating quality content for months and would like to get verified."}
            
            response = requests.post(f"{self.base_url}/badge-requests", json=request_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'status' in data and data['status'] == 'pending':
                    self.log_test("Create Badge Request", True, "Badge request created successfully")
                    success_count += 1
                else:
                    self.log_test("Create Badge Request", False, f"Invalid response: {data}")
            else:
                self.log_test("Create Badge Request", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Badge Request", False, f"Exception: {str(e)}")
        
        # Test creating badge request as non-creator (should fail)
        if "listener" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
                request_data = {"reason": "I want a badge too!"}
                
                response = requests.post(f"{self.base_url}/badge-requests", json=request_data, headers=headers, timeout=10)
                
                if response.status_code == 403:
                    self.log_test("Badge Request (forbidden)", True, "Correctly rejected non-creator badge request")
                    success_count += 1
                else:
                    self.log_test("Badge Request (forbidden)", False, f"Expected 403, got {response.status_code}")
            except Exception as e:
                self.log_test("Badge Request (forbidden)", False, f"Exception: {str(e)}")
        
        return success_count > 0
    
    def test_label_request(self):
        """Test label request functionality"""
        print("\n=== Testing Label Request ===")
        
        if "listener" not in self.tokens:
            self.log_test("Label Request", False, "No user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
            request_data = {
                "label_name": "Indie Rock Records",
                "description": "A label focused on independent rock music with emerging artists."
            }
            
            response = requests.post(f"{self.base_url}/label-requests", json=request_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'status' in data and data['status'] == 'pending':
                    self.log_test("Create Label Request", True, "Label request created successfully")
                    return True
                else:
                    self.log_test("Create Label Request", False, f"Invalid response: {data}")
            else:
                self.log_test("Create Label Request", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Create Label Request", False, f"Exception: {str(e)}")
        return False
    
    def test_save_content_functionality(self):
        """Test save/unsave content functionality"""
        print("\n=== Testing Save Content Functionality ===")
        
        if not self.contents:
            self.log_test("Save Content", False, "No content available to test")
            return False
        
        content_id = self.contents[0]
        success_count = 0
        
        # Test saving content with listener
        if "listener" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
                
                # Save the content (first time)
                response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("message") == "Content saved" and data.get("saved") == True:
                        self.log_test("Save Content", True, "Content saved successfully")
                        success_count += 1
                        
                        # Unsave the content (toggle)
                        response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("message") == "Content unsaved" and data.get("saved") == False:
                                self.log_test("Unsave Content", True, "Content unsaved successfully")
                                success_count += 1
                                
                                # Save again (toggle back)
                                response = requests.post(f"{self.base_url}/contents/{content_id}/save", headers=headers, timeout=10)
                                if response.status_code == 200:
                                    data = response.json()
                                    if data.get("message") == "Content saved" and data.get("saved") == True:
                                        self.log_test("Re-save Content", True, "Content re-saved successfully (toggle working)")
                                        success_count += 1
                                    else:
                                        self.log_test("Re-save Content", False, f"Unexpected response: {data}")
                                else:
                                    self.log_test("Re-save Content", False, f"Status: {response.status_code}")
                            else:
                                self.log_test("Unsave Content", False, f"Unexpected response: {data}")
                        else:
                            self.log_test("Unsave Content", False, f"Status: {response.status_code}")
                    else:
                        self.log_test("Save Content", False, f"Unexpected response: {data}")
                else:
                    self.log_test("Save Content", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test("Save Content", False, f"Exception: {str(e)}")
        
        return success_count >= 2
    
    def test_save_nonexistent_content(self):
        """Test saving non-existent content"""
        print("\n=== Testing Save Non-existent Content ===")
        
        if "listener" not in self.tokens:
            self.log_test("Save Non-existent Content", False, "No listener token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
            fake_content_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            
            response = requests.post(f"{self.base_url}/contents/{fake_content_id}/save", headers=headers, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Save Non-existent Content", True, "Correctly returned 404 for non-existent content")
                return True
            else:
                self.log_test("Save Non-existent Content", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Save Non-existent Content", False, f"Exception: {str(e)}")
        return False
    
    def test_save_unauthorized(self):
        """Test save content without authentication"""
        print("\n=== Testing Save Content Unauthorized ===")
        
        if not self.contents:
            self.log_test("Save Unauthorized", False, "No content available to test")
            return False
        
        content_id = self.contents[0]
        
        try:
            # Test without Authorization header
            response = requests.post(f"{self.base_url}/contents/{content_id}/save", timeout=10)
            
            if response.status_code in [401, 403]:  # FastAPI HTTPBearer can return either
                self.log_test("Save Unauthorized", True, f"Correctly rejected unauthorized save (status: {response.status_code})")
                return True
            else:
                self.log_test("Save Unauthorized", False, f"Expected 401/403, got {response.status_code}")
        except Exception as e:
            self.log_test("Save Unauthorized", False, f"Exception: {str(e)}")
        return False
    
    def test_get_saved_contents(self):
        """Test retrieving saved contents"""
        print("\n=== Testing Get Saved Contents ===")
        
        if "listener" not in self.tokens:
            self.log_test("Get Saved Contents", False, "No listener token available")
            return False
        
        success_count = 0
        
        try:
            headers = {"Authorization": f"Bearer {self.tokens['listener']}"}
            
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
                            self.log_test("Saved Content Structure", True, "Saved content structure is correct")
                            success_count += 1
                        else:
                            self.log_test("Saved Content Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Get Saved Contents", False, f"Expected list, got: {type(saved_contents)}")
            else:
                self.log_test("Get Saved Contents", False, f"Status: {response.status_code}, Response: {response.text}")
            
            # Test pagination
            response = requests.get(f"{self.base_url}/saved-contents?skip=0&limit=5", headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("Saved Contents Pagination", True, "Pagination parameters accepted")
                success_count += 1
            else:
                self.log_test("Saved Contents Pagination", False, f"Pagination failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Saved Contents", False, f"Exception: {str(e)}")
        
        return success_count >= 1
    
    def test_get_saved_contents_unauthorized(self):
        """Test getting saved contents without authentication"""
        print("\n=== Testing Get Saved Contents Unauthorized ===")
        
        try:
            response = requests.get(f"{self.base_url}/saved-contents", timeout=10)
            
            if response.status_code in [401, 403]:
                self.log_test("Get Saved Contents Unauthorized", True, f"Correctly rejected unauthorized access (status: {response.status_code})")
                return True
            else:
                self.log_test("Get Saved Contents Unauthorized", False, f"Expected 401/403, got {response.status_code}")
        except Exception as e:
            self.log_test("Get Saved Contents Unauthorized", False, f"Exception: {str(e)}")
        return False
    
    def test_save_with_different_roles(self):
        """Test save functionality with different user roles"""
        print("\n=== Testing Save with Different User Roles ===")
        
        if not self.contents:
            self.log_test("Save Different Roles", False, "No content available to test")
            return False
        
        content_id = self.contents[0]
        success_count = 0
        
        # Test with each user role
        for role in ["listener", "creator", "expert", "label"]:
            if role not in self.tokens:
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
                    self.log_test(f"Save as {role}", False, f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Save as {role}", False, f"Exception: {str(e)}")
        
        return success_count > 0

    def test_missing_fields(self):
        """Test API endpoints with missing required fields"""
        print("\n=== Testing Missing Fields ===")
        
        success_count = 0
        
        # Test registration with missing fields
        try:
            incomplete_user = {"email": "incomplete@test.com"}  # Missing password, username
            response = requests.post(f"{self.base_url}/auth/register", json=incomplete_user, timeout=10)
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_test("Missing Fields Registration", True, "Correctly rejected incomplete registration")
                success_count += 1
            else:
                self.log_test("Missing Fields Registration", False, f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.log_test("Missing Fields Registration", False, f"Exception: {str(e)}")
        
        # Test content creation with missing fields
        if "creator" in self.tokens:
            try:
                headers = {"Authorization": f"Bearer {self.tokens['creator']}"}
                incomplete_content = {"title": "Test"}  # Missing audio_data
                response = requests.post(f"{self.base_url}/contents", json=incomplete_content, headers=headers, timeout=10)
                
                if response.status_code == 422:
                    self.log_test("Missing Fields Content", True, "Correctly rejected incomplete content")
                    success_count += 1
                else:
                    self.log_test("Missing Fields Content", False, f"Expected 422, got {response.status_code}")
            except Exception as e:
                self.log_test("Missing Fields Content", False, f"Exception: {str(e)}")
        
        return success_count > 0
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Drezzle Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        tests = [
            self.test_health_check,
            self.test_user_registration,
            self.test_duplicate_registration,
            self.test_user_login,
            self.test_invalid_login,
            self.test_get_current_user,
            self.test_invalid_token,
            self.test_content_creation,
            self.test_get_contents,
            self.test_like_functionality,
            self.test_invalid_content_like,
            self.test_comment_functionality,
            self.test_badge_request,
            self.test_label_request,
            self.test_missing_fields
        ]
        
        passed = 0
        total = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                total += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
                total += 1
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
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
        
        return passed, total

def main():
    """Main function to run tests"""
    tester = DrezzleAPITester()
    passed, total = tester.run_all_tests()
    
    if passed == total:
        print("\n🎉 All tests passed!")
        exit(0)
    else:
        print(f"\n⚠️  {total - passed} tests failed!")
        exit(1)

if __name__ == "__main__":
    main()