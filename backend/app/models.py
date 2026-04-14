from pydantic import BaseModel

class CostRequest(BaseModel):
    cpu: int
    ram: int
    storage: int
