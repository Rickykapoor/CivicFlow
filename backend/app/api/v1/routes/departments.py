from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.dependencies import require_admin, get_current_user
from app.models.user import User
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.core.response import success_response
from app.core.exceptions import NotFoundException

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/")
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    departments = db.query(Department).order_by(Department.name).all()
    data = [DepartmentResponse.model_validate(d).model_dump(mode="json") for d in departments]
    return success_response(data=data, message="Departments retrieved")


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    dept = Department(name=data.name, description=data.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return success_response(
        data=DepartmentResponse.model_validate(dept).model_dump(mode="json"),
        message="Department created",
        status_code=status.HTTP_201_CREATED,
    )


@router.put("/{dept_id}")
def update_department(
    dept_id: UUID,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise NotFoundException("Department not found")
    if data.name is not None:
        dept.name = data.name
    if data.description is not None:
        dept.description = data.description
    db.commit()
    db.refresh(dept)
    return success_response(
        data=DepartmentResponse.model_validate(dept).model_dump(mode="json"),
        message="Department updated",
    )


@router.delete("/{dept_id}")
def delete_department(
    dept_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise NotFoundException("Department not found")
    db.delete(dept)
    db.commit()
    return success_response(message="Department deleted")
