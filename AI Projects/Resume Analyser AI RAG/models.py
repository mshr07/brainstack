from sqlalchemy import Column, Integer, String, Float
from database import Base

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    branch = Column(String, nullable=False)
    marks = Column(Float, nullable=False)
    def __init__(self, id: int,  name: str, age: int, branch: str, marks: float):
        self.id = id
        self.name = name
        self.age = age
        self.branch = branch
        self.marks = marks