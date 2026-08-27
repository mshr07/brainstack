from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import IntegrityError

DATABASE_URL = "mysql+pymysql://root:12345@localhost:3306/student_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    course = Column(String(100), nullable=False)
Base.metadata.create_all(bind=engine)
class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    age: int = Field(..., gt=0)
    course: str = Field(..., min_length=1)
class StudentUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    age: int = Field(..., gt=0)
    course: str = Field(..., min_length=1)
class StudentPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = Field(default=None, min_length=1)
    age: Optional[int] = Field(default=None, gt=0)
    course: Optional[str] = Field(default=None, min_length=1)
class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    age: int
    course: str
    model_config = ConfigDict(from_attributes=True)
app = FastAPI()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {
        "message": "Welcome to Student CRUD API",
    }
@app.post(
    "/students",
    response_model=StudentResponse,
)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    existing_student = db.query(Student).filter(Student.email == student.email).first()
    if existing_student:
        raise HTTPException("Student already exists")
    new_student = Student(
        name=student.name,
        email=student.email,
        age=student.age,
        course=student.course
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


@app.get("/students", response_model=List[StudentResponse])
def get_all_students(
    skip: int = 0,
    limit: int = 10,
    course: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Student)

    if course:
        query = query.filter(Student.course == course)
    students = query.offset(skip).limit(limit).all()
    return students

@app.get("/students/{student_id}", response_model=StudentResponse)
def get_student_by_id(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    return student

@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    updated_data: StudentUpdate,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    student.name = updated_data.name
    student.email = updated_data.email
    student.age = updated_data.age
    student.course = updated_data.course
    try:
        db.commit()
        db.refresh(student)
        return student
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

@app.patch("/students/{student_id}", response_model=StudentResponse)
def patch_student(
    student_id: int,
    patch_data: StudentPatch,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    update_values = patch_data.model_dump(exclude_unset=True)
    for key, value in update_values.items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return student
@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    db.delete(student)
    db.commit()
    return {
        "message": "Student deleted successfully"
    }