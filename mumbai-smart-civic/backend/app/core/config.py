from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = "Mumbai Smart Civic Portal"
    api_v1_prefix: str = "/api/v1"

    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "mumbai_smart_civic"

    jwt_secret_key: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    ml_service_url: str = "http://localhost:9000"
    ml_service_timeout_seconds: float = 2.5

    duplicate_radius_meters: int = 50
    duplicate_window_hours: int = 48

    cluster_spatial_eps_meters: int = 120
    cluster_temporal_eps_hours: int = 36
    cluster_min_samples: int = 2

    authority_code_inspector: str = "MUM-INS-1101"
    authority_code_ward_officer: str = "MUM-WARD-2202"
    authority_code_deputy_commissioner: str = "MUM-DEP-3303"
    authority_code_commissioner: str = "MUM-COM-4404"

    authority_min_level_list: int = 1
    authority_min_level_status_update: int = 2
    authority_min_level_spatial_analytics: int = 3


settings = Settings()
