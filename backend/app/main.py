from fastapi import FastAPI, Depends, HTTPException
from typing import Annotated
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app import passHash as ph
app = FastAPI()

@app.get("/")
def root():
    return {"message":"działa"}
ph.hashuj("1234")


# 1. Konfiguracja bazy danych (tutaj plik lokalny SQLite)
DATABASE_URL = "sqlite:///./test.db"

# Utworzenie silnika bazy danych (Engine)
# 'check_same_thread' jest wymagane tylko dla SQLite
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Utworzenie fabryki sesji
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Klasa bazowa dla modeli ORM
Base = declarative_base()

# 2. Model bazy danych (Tabela)
class Uzytkownik(Base):
    __tablename__ = "Uzytkownik"
    
    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, index=True)
    password_hash = Column(String)
    salt = Column(String)

# Automatyczne tworzenie tabel przy starcie aplikacji
Base.metadata.create_all(bind=engine)

# 4. Generator sesji (Dependency Injection)
# Zapewnia otwarcie sesji przed zapytaniem i zamknięcie jej po zakończeniu żądania
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Użycie Annotated (nowoczesny i czytelny styl FastAPI dla zależności)
DbSession = Annotated[Session, Depends(get_db)]

# 5. Punkty końcowe (Endpoints)
@app.post("/users/")
def create_user(nazwa: str, password: str, db: DbSession):
    # Sprawdzenie czy użytkownik istnieje
    db_user = db.query(Uzytkownik).filter(Uzytkownik.nazwa == nazwa).first()
    if db_user:
        raise HTTPException(status_code=400, detail="nazwa zajęta.")
    
    # Tworzenie nowego rekordu
    password_hash, salt = ph.hashuj(password)
    new_user = Uzytkownik(nazwa=nazwa, password_hash=password_hash, salt=salt)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/{user_id}")
def read_user(user_id: int, db: DbSession):
    user = db.query(Uzytkownik).filter(Uzytkownik.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
