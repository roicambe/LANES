from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LANES"
    API_VERSION: str = "0.1.0"
    
    # Database Configuration
    # Defaults to PostgreSQL with psycopg (v3) driver
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/lanes"

    # OSRM Server URL (defaults to public demo server)
    OSRM_URL: str = "https://router.project-osrm.org"

    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
