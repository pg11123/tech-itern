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
class Wynik(Base):
    __tablename__ = "Wynik"
    id = Column(Integer, primary_key=True, index=True)
    uzytkownik_id = Column(Integer, index=True)
    wynik = Column(Integer, index=True)
    poziom_id = Column(Integer, unique=True,index=True) 

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
@app.post("/wynik/")
def dodaj_wynik_jesli_najwiekszy(uzytkownik_id: int, wynik: int, poziom_id: int, db: DbSession):
    # czy wynik jest wiekszy
    if db.query(Wynik).filter(Wynik.uzytkownik_id == uzytkownik_id and Wynik.poziom_id == poziom_id and Wynik.wynik >= wynik).first():
        return None
    #jeśli nie ma większego: usuń i dodaj nowy największy
    wynik_mniejszy = db.query(Wynik).filter(Wynik.uzytkownik_id == uzytkownik_id and Wynik.poziom_id == poziom_id and Wynik.wynik < wynik).first()
    if wynik_mniejszy is not None:
        db.delete(wynik_mniejszy)
        db.commit()
    nowy_wynik = Wynik(uzytkownik_id = uzytkownik_id, wynik = wynik, poziom_id = poziom_id)
    db.add(nowy_wynik)
    db.commit()
    db.refresh(nowy_wynik)
    return nowy_wynik
@app.get("/wynik/{user_id}{poziom_id}")
def read_wynik(uzytkownik_id: int, poziom_id: int, db: DbSession):
    wynik = db.query(Wynik).filter(Wynik.uzytkownik_id == uzytkownik_id and Wynik.poziom_id == poziom_id).first()
    if wynik is None:
        raise HTTPException(status_code=404, detail="Poziom nie ukończony")
    return wynik.wynik

