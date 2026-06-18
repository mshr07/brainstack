from pydantic import BaseModel

class StudentCreate(BaseModel):
    name: str
    age: int
    branch: str
    marks: float

class StudentUpdate(BaseModel):
    name: str
    age: int
    branch: str
    marks: float

class StudentResponse(BaseModel):
    id: int
    name: str
    age: int
    branch: str
    marks: float

    model_config = {
        "from_attributes": True
    }