import requests
import sys
import json
import subprocess
from datetime import datetime, timezone, timedelta
import time

class StageBasedCRMTester:
    def __init__(self, base_url="https://stage-driven-crm.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.client_id = None
        self.stage_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def setup_test_user(self):
        """Create test user and session in MongoDB"""
        print("🔧 Setting up test user and session...")
        
        timestamp = int(time.time())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        email = f"test.user.{timestamp}@example.com"
        
        mongo_script = f"""
        use('test_database');
        var userId = '{user_id}';
        var sessionToken = '{session_token}';
        var email = '{email}';
        
        // Insert test user
        db.users.insertOne({{
            user_id: userId,
            email: email,
            name: 'Test User',
            picture: 'https://via.placeholder.com/150',
            role: 'client',
            created_at: new Date()
        }});
        
        // Insert session
        db.user_sessions.insertOne({{
            user_id: userId,
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('User created: ' + userId);
        print('Session token: ' + sessionToken);
        """
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.user_id = user_id
                self.session_token = session_token
                print(f"✅ Test user created: {user_id}")
                print(f"✅ Session token: {session_token}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ MongoDB setup error: {str(e)}")
            return False

    def create_team_user(self):
        """Create a team member user for testing team functionality"""
        print("🔧 Creating team member user...")
        
        timestamp = int(time.time()) + 1
        team_user_id = f"team-user-{timestamp}"
        team_session_token = f"team_session_{timestamp}"
        team_email = f"team.user.{timestamp}@example.com"
        
        mongo_script = f"""
        use('test_database');
        var userId = '{team_user_id}';
        var sessionToken = '{team_session_token}';
        var email = '{team_email}';
        
        // Insert team user
        db.users.insertOne({{
            user_id: userId,
            email: email,
            name: 'Team Member',
            picture: 'https://via.placeholder.com/150',
            role: 'team',
            created_at: new Date()
        }});
        
        // Insert session
        db.user_sessions.insertOne({{
            user_id: userId,
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('Team user created: ' + userId);
        """
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.team_user_id = team_user_id
                self.team_session_token = team_session_token
                print(f"✅ Team user created: {team_user_id}")
                return True
            else:
                print(f"❌ Team user setup failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Team user setup error: {str(e)}")
            return False

    def create_admin_user(self):
        """Create an admin user for testing admin functionality"""
        print("🔧 Creating admin user...")
        
        timestamp = int(time.time()) + 2
        admin_user_id = f"admin-user-{timestamp}"
        admin_session_token = f"admin_session_{timestamp}"
        admin_email = f"admin.user.{timestamp}@example.com"
        
        mongo_script = f"""
        use('test_database');
        var userId = '{admin_user_id}';
        var sessionToken = '{admin_session_token}';
        var email = '{admin_email}';
        
        // Insert admin user
        db.users.insertOne({{
            user_id: userId,
            email: email,
            name: 'Admin User',
            picture: 'https://via.placeholder.com/150',
            role: 'admin',
            created_at: new Date()
        }});
        
        // Insert session
        db.user_sessions.insertOne({{
            user_id: userId,
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('Admin user created: ' + userId);
        """
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                self.admin_user_id = admin_user_id
                self.admin_session_token = admin_session_token
                print(f"✅ Admin user created: {admin_user_id}")
                return True
            else:
                print(f"❌ Admin user setup failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Admin user setup error: {str(e)}")
            return False

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use provided token or default session token
        auth_token = token or self.session_token
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")

            return False, {}

        except Exception as e:
            self.failed_tests.append(f"{name} - Error: {str(e)}")
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n📋 Testing Authentication Endpoints...")
        
        # Test /auth/me
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success and response.get('user_id'):
            print(f"   User ID: {response['user_id']}")
            print(f"   Email: {response['email']}")
            print(f"   Role: {response['role']}")
        
        return success

    def test_stages_endpoints(self):
        """Test stages endpoints"""
        print("\n📋 Testing Stages Endpoints...")
        
        # Get all stages
        success, response = self.run_test("Get All Stages", "GET", "stages", 200)
        if success and response:
            print(f"   Found {len(response)} stages")
            if response:
                self.stage_id = response[0]['stage_id']
                print(f"   First stage ID: {self.stage_id}")
                
                # Test getting questions for first stage
                success2, questions = self.run_test(
                    "Get Stage Questions", 
                    "GET", 
                    f"stages/{self.stage_id}/questions", 
                    200
                )
                if success2:
                    print(f"   Found {len(questions)} questions for stage 1")
        
        return success

    def test_client_endpoints(self):
        """Test client-related endpoints"""
        print("\n📋 Testing Client Endpoints...")
        
        # Create a client (this creates a client record for the current user)
        success, response = self.run_test(
            "Create Client", 
            "POST", 
            "clients", 
            200,
            data={
                "full_name": "Test Client",
                "email": "testclient@example.com",
                "phone": "123-456-7890"
            }
        )
        
        if success and response.get('client_id'):
            self.client_id = response['client_id']
            print(f"   Created client ID: {self.client_id}")
        
        # Get all clients
        success2, clients = self.run_test("Get All Clients", "GET", "clients", 200)
        if success2:
            print(f"   Found {len(clients)} clients")
        
        # Get specific client
        if self.client_id:
            success3, client = self.run_test(
                "Get Specific Client", 
                "GET", 
                f"clients/{self.client_id}", 
                200
            )
            if success3:
                print(f"   Client stage: {client.get('current_stage')}")
                print(f"   Client progress: {client.get('progress_percentage')}%")
        
        return success and success2

    def test_response_endpoints(self):
        """Test questionnaire response endpoints"""
        print("\n📋 Testing Response Endpoints...")
        
        if not self.client_id or not self.stage_id:
            print("❌ Cannot test responses - missing client_id or stage_id")
            return False
        
        # Get questions for the stage first
        success, questions = self.run_test(
            "Get Questions for Response Test", 
            "GET", 
            f"stages/{self.stage_id}/questions", 
            200
        )
        
        if not success or not questions:
            print("❌ Cannot test responses - no questions found")
            return False
        
        # Submit response for first question
        first_question = questions[0]
        success2, response = self.run_test(
            "Submit Response", 
            "POST", 
            "responses", 
            200,
            data={
                "client_id": self.client_id,
                "question_id": first_question['question_id'],
                "stage_id": self.stage_id,
                "answer": "Test answer for automated testing"
            }
        )
        
        # Get client responses
        success3, responses = self.run_test(
            "Get Client Responses", 
            "GET", 
            f"clients/{self.client_id}/responses", 
            200
        )
        
        if success3:
            print(f"   Found {len(responses)} responses")
        
        return success2 and success3

    def test_team_endpoints(self):
        """Test team member functionality"""
        print("\n📋 Testing Team Member Endpoints...")
        
        if not hasattr(self, 'team_session_token'):
            print("❌ Cannot test team endpoints - no team user created")
            return False
        
        # Test team member can see all clients
        success, clients = self.run_test(
            "Team - Get All Clients", 
            "GET", 
            "clients", 
            200,
            token=self.team_session_token
        )
        
        if success:
            print(f"   Team member can see {len(clients)} clients")
        
        # Test creating a meeting (team only)
        if self.client_id:
            success2, meeting = self.run_test(
                "Team - Create Meeting", 
                "POST", 
                "meetings", 
                200,
                data={
                    "client_id": self.client_id,
                    "stage_id": self.stage_id,
                    "notes": "Test meeting notes from automated testing"
                },
                token=self.team_session_token
            )
            
            if success2:
                print(f"   Created meeting ID: {meeting.get('meeting_id')}")
        
        # Test updating client (team only)
        if self.client_id:
            success3, updated_client = self.run_test(
                "Team - Update Client", 
                "PUT", 
                f"clients/{self.client_id}", 
                200,
                data={
                    "current_stage": 2,
                    "progress_percentage": 20.0
                },
                token=self.team_session_token
            )
            
            if success3:
                print(f"   Updated client to stage: {updated_client.get('current_stage')}")
        
        return success

    def test_admin_endpoints(self):
        """Test admin functionality"""
        print("\n📋 Testing Admin Endpoints...")
        
        if not hasattr(self, 'admin_session_token'):
            print("❌ Cannot test admin endpoints - no admin user created")
            return False
        
        # Test admin can get all users
        success, users = self.run_test(
            "Admin - Get All Users", 
            "GET", 
            "admin/users", 
            200,
            token=self.admin_session_token
        )
        
        if success:
            print(f"   Admin can see {len(users)} users")
        
        # Test admin can update user role
        if self.user_id:
            success2, response = self.run_test(
                "Admin - Update User Role", 
                "PUT", 
                f"admin/users/{self.user_id}/role", 
                200,
                data={"role": "team"},
                token=self.admin_session_token
            )
            
            if success2:
                print("   Successfully updated user role to team")
        
        return success

    def test_access_control(self):
        """Test role-based access control"""
        print("\n📋 Testing Access Control...")
        
        # Test client cannot access admin endpoints
        success, response = self.run_test(
            "Client Access to Admin (Should Fail)", 
            "GET", 
            "admin/users", 
            403,  # Should be forbidden
            token=self.session_token
        )
        
        # Test client cannot create meetings
        if self.client_id and self.stage_id:
            success2, response = self.run_test(
                "Client Create Meeting (Should Fail)", 
                "POST", 
                "meetings", 
                403,  # Should be forbidden
                data={
                    "client_id": self.client_id,
                    "stage_id": self.stage_id,
                    "notes": "This should fail"
                },
                token=self.session_token
            )
        
        return success

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        mongo_script = """
        use('test_database');
        db.users.deleteMany({email: /test\.user\./});
        db.users.deleteMany({email: /team\.user\./});
        db.users.deleteMany({email: /admin\.user\./});
        db.user_sessions.deleteMany({session_token: /test_session/});
        db.user_sessions.deleteMany({session_token: /team_session/});
        db.user_sessions.deleteMany({session_token: /admin_session/});
        db.clients.deleteMany({email: "testclient@example.com"});
        print('Test data cleaned up');
        """
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️  Cleanup warning: {result.stderr}")
        except Exception as e:
            print(f"⚠️  Cleanup error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Stage-Based CRM Backend Tests")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Setup test users
        if not self.setup_test_user():
            print("❌ Cannot proceed without test user setup")
            return 1
        
        if not self.create_team_user():
            print("⚠️  Team user setup failed - some tests will be skipped")
        
        if not self.create_admin_user():
            print("⚠️  Admin user setup failed - some tests will be skipped")
        
        # Run tests
        auth_success = self.test_auth_endpoints()
        stages_success = self.test_stages_endpoints()
        client_success = self.test_client_endpoints()
        response_success = self.test_response_endpoints()
        team_success = self.test_team_endpoints()
        admin_success = self.test_admin_endpoints()
        access_success = self.test_access_control()
        
        # Print results
        print(f"\n📊 Test Results:")
        print(f"   Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"   Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        # Cleanup
        self.cleanup_test_data()
        
        # Return exit code
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = StageBasedCRMTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())