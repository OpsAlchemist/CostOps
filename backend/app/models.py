from pydantic import BaseModel, EmailStr


class CostRequest(BaseModel):
    cpu: int
    ram: int
    storage: int


class LoginRequest(BaseModel):
    username: str
    password: str


class CalculateCostRequest(BaseModel):
    cloud_provider: str = "aws"  # "aws" | "azure" | "gcp"
    service: str
    parameters: dict


class SignupRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str


class ProfileUpdateRequest(BaseModel):
    name: str
    company: str
    email: EmailStr
    bio: str = ""


class CloudCredentialRequest(BaseModel):
    cloud_provider: str  # "aws" | "azure" | "gcp"
    access_key_id: str
    secret_access_key: str


class OnboardUserRequest(BaseModel):
    username: str
    password: str
    name: str
    email: EmailStr
    role: str = "user"


class OAuthLoginRequest(BaseModel):
    provider: str  # "google" or "apple"
    id_token: str
