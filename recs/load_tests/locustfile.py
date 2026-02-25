import json
import random
import os
from uuid import uuid4
from locust import HttpUser, task, between

SEED_FILE = os.path.join(os.path.dirname(__file__), "users_seed.json")

import uuid

def load_users():
    try:
        with open(SEED_FILE, "r") as f:
            data = json.load(f)
            users = data.get("users", [])
            if users:
                return users
    except Exception:
        pass
    print("Warning: users_seed.json missing or empty. Using fallback pool of 100 dummy users.")
    return [str(uuid.uuid4()) for _ in range(100)]

VALID_USERS = load_users()

SKILLS_POOL = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", 
    "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", 
    "Machine Learning", "Data Science", "C++", "C#", "Go", "Rust"
]

INTERESTS_POOL = [
    "Backend Development", "Frontend Development", "Full Stack", 
    "Artificial Intelligence", "Cloud Computing", "Data Engineering", 
    "DevOps", "Cybersecurity", "Mobile Development"
]

class RecommenderUser(HttpUser):
    wait_time = between(1, 5)

    def _generate_profile(self):
        num_skills = random.randint(2, 5)
        num_interests = random.randint(1, 3)
        
        skills = [
            {"name": skill, "proficiency": random.randint(1, 5)}
            for skill in random.sample(SKILLS_POOL, num_skills)
        ]
        
        interests = random.sample(INTERESTS_POOL, num_interests)
        
        return {
            "skills": skills,
            "interests": interests
        }

    @task(8)
    def test_recommendation(self):
        # 10% cold-start simulation
        is_cold_start = random.random() < 0.10
        
        if is_cold_start:
            user_id = str(uuid.uuid4())
        else:
            user_id = random.choice(VALID_USERS)
            
        payload = {
            "user_id": user_id,
            "profile": self._generate_profile(),
            "context": {
                "limit": 10,
                "exclude_ids": []
            }
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        with self.client.post("/recommend", json=payload, headers=headers, catch_response=True) as response:
            if response.status_code == 200:
                resp_json = response.json()
                if "items" not in resp_json:
                    response.failure("Missing 'items' in response")
            else:
                response.failure(f"Failed with status {response.status_code}: {response.text}")

    @task(1)
    def test_health(self):
        self.client.get("/health")

    @task(1)
    def test_metrics(self):
        self.client.get("/metrics")
