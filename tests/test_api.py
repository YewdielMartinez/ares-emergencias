import unittest

from fastapi.testclient import TestClient

from backend.main import create_app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(create_app())

    def test_health_state_and_openapi(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")
        self.assertEqual(self.client.get("/api/state").json()["tick"], 0)
        self.assertEqual(self.client.get("/openapi.json").status_code, 200)

    def test_api_instances_are_isolated(self):
        other = TestClient(create_app())
        self.client.post("/api/step", json={"steps": 3})
        self.assertEqual(other.get("/api/state").json()["tick"], 0)

    def test_step_reset_and_algorithm(self):
        self.assertEqual(self.client.post("/api/step", json={"steps": 2}).json()["tick"], 2)
        self.assertEqual(
            self.client.post("/api/algorithm", json={"algorithm": "BFS"}).json()["algorithm"], "BFS"
        )
        reset = self.client.post("/api/reset", json={"scenario": "traffic", "seed": 7}).json()
        self.assertEqual((reset["tick"], reset["scenario"], reset["seed"]), (0, "traffic", 7))

    def test_invalid_input_validation(self):
        for path, body in [
            ("/step", {"steps": 0}),
            ("/step", {"steps": 101}),
            ("/algorithm", {"algorithm": "random"}),
            ("/reset", {"scenario": "unknown"}),
            ("/incidents", {"kind": "unknown", "severity": 3}),
            ("/incidents", {"kind": "medical", "severity": 4}),
        ]:
            with self.subTest(path=path, body=body):
                self.assertEqual(self.client.post("/api" + path, json=body).status_code, 422)

    def test_incidents_obstacles_and_errors(self):
        response = self.client.post(
            "/api/incidents",
            json={
                "kind": "fire",
                "severity": 3,
                "title": "Prueba de integración",
                "position": [12, 7],
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["incidents"][-1]["id"], "EM-005")
        self.assertEqual(
            self.client.post("/api/obstacles", json={"position": [12, 7]}).status_code, 400
        )
        self.assertEqual(
            self.client.post("/api/obstacles", json={"position": [10, 7]}).status_code, 200
        )
        self.assertEqual(self.client.get("/api/compare?incident_id=missing").status_code, 404)
        self.assertEqual(self.client.get("/api/compare?agent_id=missing").status_code, 404)

    def test_same_endpoints_in_comparison(self):
        comparison = self.client.get("/api/compare?incident_id=EM-002").json()
        self.assertEqual(len(comparison["results"]), 4)
        for result in comparison["results"]:
            self.assertEqual(result["path"][0], comparison["start"])
            self.assertEqual(result["path"][-1], comparison["goal"])


if __name__ == "__main__":
    unittest.main()
