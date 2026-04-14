# CostOps
 
# Multi-Cloud Cost Estimator (Mini) - CostOps

## Overview

CostOps AI is a lightweight multi-cloud cost estimator that compares infrastructure pricing across Amazon Web Services, Microsoft Azure, and Google Cloud Platform. It uses AI to provide smart cost insights, recommendations, and optimization tips based on user-defined compute resources.

## Architecture

```
Frontend (Next.js) → Backend (FastAPI) → Pricing Engine (JSON) → AI Layer (OpenAI API) → Dockerized Deployment
```

## Project Structure

```
multi-cloud-cost-estimator/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── pricing.py
│   │   ├── ai.py
│   │   └── models.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   └── components/
│   │       └── CostForm.tsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## Backend - requirements.txt

```
fastapi
uvicorn
pydantic
requests
python-dotenv
```

## Access

- Frontend → http://localhost:3000
- Backend → http://localhost:8000/docs