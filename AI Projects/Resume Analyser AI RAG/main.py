from typing import Optional
from database import SessionLocal
from fastapi import FastAPI
from models import Student
app = FastAPI()
students=[
    Student(1,"A",22,"CSE",50),
    Student(2,"B",22,"CSE",52),
    Student(3,"D",22,"CSE",60),
    Student(4,"E",22,"CSE",70),
    Student(5,"F",22,"CSE",80)
]
@app.get("/")
async def root():
    return {"students": students}

@app.get("/{id}")
async def root(id: int):
    std=None
    for i in students:
        if i.id == id:
            std=i
            break
    return {"students": std}
