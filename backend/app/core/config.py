from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LANES"
    API_VERSION: str = "0.1.0"
    
    # Database Configuration
    # Defaults to PostgreSQL with psycopg (v3) driver
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/lanes"

    # OSRM Server URL (defaults to public demo server)
    OSRM_URL: str = "https://router.project-osrm.org"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
