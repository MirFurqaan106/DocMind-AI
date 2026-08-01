from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db import User, UserSettings
from app.schemas.schemas import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's current LLM generation settings (temperature, max_tokens).
    """
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        # Create default if missing
        user_settings = UserSettings(user_id=current_user.id, temperature=0.7, max_tokens=500)
        db.add(user_settings)
        db.commit()
        db.refresh(user_settings)

    return user_settings


@router.put("", response_model=SettingsResponse)
def update_user_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's LLM generation settings.
    """
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    user_settings.temperature = settings_in.temperature
    user_settings.max_tokens = settings_in.max_tokens
    db.commit()
    db.refresh(user_settings)

    return user_settings
