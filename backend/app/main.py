from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import CostRequest
from app.pricing import calculate_cost
from app.ai import get_ai_recommendation

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/estimate")
def estimate(req: CostRequest):
    aws = calculate_cost("aws", req.cpu, req.ram, req.storage)
    azure = calculate_cost("azure", req.cpu, req.ram, req.storage)
    gcp = calculate_cost("gcp", req.cpu, req.ram, req.storage)

    costs = {"aws": aws, "azure": azure, "gcp": gcp}
    recommendation = get_ai_recommendation(costs)

    return {"costs": costs, "recommendation": recommendation}
