
# Tech Itern

 Projekt składający się z:

 - **Frontend** — React + Vite + Tailwind CSS
- **Backend** — Python + FastAPI
- **Git** — system kontroli wersji

---

 ## 1\. Wymagania

 Przed rozpoczęciem pracy upewnij się, że masz zainstalowane:

 - Git
- Node.js + npm
- Python

 Możesz sprawdzić wersje:

```
git --version
node --version
npm --version
python --version
```

 Na Linux/macOS Python może być dostępny jako:

```
python3 --version
```

---

 ## 2\. Pobranie projektu

 Najpierw sklonuj repozytorium:

```
git clone ADRES_REPOZYTORIUM
```

 Następnie wejdź do projektu:

```
cd tech-itern
```

 Struktura projektu wygląda mniej więcej tak:

```
tech-itern/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

---

 ## 3\. Konfiguracja frontendu

 Przejdź do folderu frontend:

```
cd frontend
```

 Zainstaluj wszystkie zależności:

```
npm install
```

 `npm install` pobierze paczki zapisane w `package.json`.

 Nie musimy pobierać `node_modules` z GitHuba — ten folder jest ignorowany przez Git.

 ### Uruchomienie frontendu

 W folderze `frontend` wykonaj:

```
npm run dev
```

 Vite uruchomi serwer developerski.

 W terminalu pojawi się adres podobny do:

```
http://localhost:5173/
```

 Otwórz ten adres w przeglądarce.

 > **Ważne:** podczas pracy zostaw terminal z uruchomionym frontendem.

 Aby zatrzymać serwer:

```
Ctrl + C
```

---

 ## 4\. Konfiguracja backendu

 Otwórz **drugi terminal**.

 Przejdź do folderu backend:

```
cd backend
```

 ### Utworzenie środowiska wirtualnego

 Python powinien korzystać z osobnego środowiska dla tego projektu.

 ### Linux / macOS

 Utwórz środowisko:

```
python3 -m venv .venv
```

 Następnie aktywuj:

```
source .venv/bin/activate
```

 ### Windows

 Utwórz środowisko:

```
python -m venv .venv
```

 Następnie aktywuj:

```
.venv\Scripts\activate
```

 Po aktywowaniu środowiska w terminalu powinno pojawić się coś podobnego do:

```
(.venv) user@computer:~/tech-itern/backend$
```

---

 ## 5\. Instalacja FastAPI i pozostałych paczek

 Upewnij się, że środowisko `.venv` jest aktywne.

 Następnie:

```
pip install -r requirements.txt
```

 Python zainstaluje wszystkie wymagane biblioteki.

 Nie wrzucamy `.venv` na GitHuba.

 Każdy developer tworzy własne środowisko `.venv` na swoim komputerze.

---

 ## 6\. Uruchomienie backendu

 Jeżeli główny plik backendu to:

```
backend/app/main.py
```

 i znajduje się w nim:

```
from fastapi import FastAPI

app = FastAPI()
```

 backend można uruchomić:

```
uvicorn app.main:app --reload
```

 FastAPI powinno być dostępne pod:

```
http://127.0.0.1:8000
```

 Dokumentacja API znajduje się pod:

```
http://127.0.0.1:8000/docs
```

---

 ## 7\. Frontend i backend jednocześnie

 Podczas normalnej pracy będziemy potrzebować **dwóch terminali**.

 ### Terminal 1 — frontend

```
cd tech-itern/frontend
npm run dev
```

 ### Terminal 2 — backend

 Linux / macOS:

```
cd tech-itern/backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

 Windows:

```
cd tech-itern/backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

---

 # Gra: Angry Birds Epic: Chopped Edition

 Turowa gra RPG w przeglądarce. Plan budowy: `PLAN_ABE_CE_.md`, decyzje projektowe: `docs/DECISIONS.md`, źródła grafiki/dźwięku: `ASSETS.md`.

 ## Stan: Faza 1 — fundament i arena testowa (bez backendu)

 - Scena bitwy w PixiJS v8: plaża (niebo, morze, piasek, palmy), 4 sloty bohaterów po lewej, 4 sloty wrogów po prawej, cienie, animacja „oddychania”, paski HP.
 - Grafika zastępcza generowana w kodzie (`src/game/render/placeholders/`), podmieniana w jednym miejscu: `src/game/render/spriteFactory.js`.
 - Obraz 16:9 (1280x720) skalowany do okna z czarnymi pasami (letterbox).
 - Dane gry w JSON (`src/data/`), sprawdzane przy starcie prostym walidatorem schematu.
 - Teksty UI przez i18n (`src/i18n/en.js`, `src/i18n/pl.js`), przełącznik języka w menu głównym.

 ### Uruchomienie (PowerShell)

```
cd frontend
npm install
npm run dev
```

 Arena testowa: http://localhost:5173/battle/test (albo przycisk „Battle sandbox” w menu).

 Parametry (tylko arena testowa):

```
/battle/test?party=red,chuck,blues     # do 4 bohaterów: red, chuck, matilda, bomb, blues
/battle/test?seed=123                  # ta sama bitwa przy każdym uruchomieniu
```

 ### Testy, lint, build

```
cd frontend
npm test
npm run lint
npm run build
```

 ## Stan: Faza 2 — silnik walki (czysta logika + testy)

 - `src/game/engine/` — silnik walki bez Pixi i Reacta. API w `battle.js`: `createBattle`, `getLegalActions`, `applyAction`, `runEnemyPhase`. Każde wywołanie zwraca nowy stan i listę zdarzeń (obrażenia, leczenie, statusy, śmierć, fale); stary stan się nie zmienia.
 - Cała losowość idzie przez seed (mulberry32): ten sam seed i te same akcje dają te same zdarzenia.
 - Dane: 20 umiejętności bohaterów (3 + 1 ultimate na klasę), umiejętności 5 wrogów, statusy (`statuses.json`), przedmioty jednorazowe (`items.json`), skrypt bossa Chieftain (2 fazy).
 - Odblokowywanie bohaterów (`unlocks.js`), XP i poziomy (`xp.js`), łupy (`loot.js`), gwiazdki (`rating.js`).

 ### Testy i symulacja

```
cd frontend
npm test            # wszystkie testy, w tym 1000 losowych bitew
npm run simulate    # tylko symulacja, z podsumowaniem wyników
```

 ## Stan: Faza 3 — interfejs walki i animacje

 - Arena testowa (`/battle/test`) to grywalna bitwa: 3 fale (w ostatniej boss Chieftain), drużyna Red, Chuck, Matilda i Bomb na poziomie 15, mały zestaw przedmiotów.
 - Świnie zadają 3× obrażenia i mają 1,5× PŻ (`ENEMY_DAMAGE_MULT`, `ENEMY_HP_MULT` w `src/config/balance.js`).
 - HUD: karty bohaterów (PŻ, Skupienie, Furia, statusy), menu akcji (Atak / Umiejętności / Przedmioty / Obrona), celownik nad celami, banery tur, licznik fal i rund, pauza (przycisk albo Esc), szybkość 1x/2x.
 - Pasek wyczucia ataku: kliknij, stuknij albo naciśnij Spację. W menu pauzy można wybrać „Auto” (zawsze „Dobrze”).
 - Animacje zdarzeń z silnika: doskok do celu, błysk trafienia, liczby obrażeń (krytyki większe i żółte), leczenie, ikony statusów nad postaciami, śmierć z deszczem monet, wstrząs ekranu, przerywnik ultimate (zbliżenie i przyciemnienie).
 - Ekran zwycięstwa (gwiazdki, PD, monety, łupy) i porażki, przycisk „Zagraj ponownie”.
 - To, co widać na ekranie, po każdym kroku jest synchronizowane ze stanem silnika (test sprawdza to na 300 losowych bitwach).

 ### Jak zagrać

 1. `npm run dev`, potem http://localhost:5173/battle/test
 2. Bohater z żółtą obwódką czeka na rozkaz. Wybierz akcję, potem cel (żółty pierścień).
 3. Przy ataku zatrzymaj wskaźnik na zielonym polu.
 4. Inny bohater: kliknij jego kartę na dole.

---

 # Git

 ## 8\. Git — podstawy

 Git służy do śledzenia zmian w projekcie.

 ### Sprawdzenie statusu

```
git status
```

 Pokazuje, co zmieniło się w projekcie.

 ### Pobieranie zmian od drugiej osoby

 Przed rozpoczęciem pracy warto pobrać najnowszą wersję projektu:

```
git pull
```

 Dzięki temu masz najnowszy kod z repozytorium.

---

 ## 9\. Tworzenie własnej gałęzi

 Nie pracujemy bezpośrednio na `main`.

 Przed rozpoczęciem zadania utwórz własną gałąź:

```
git checkout -b nazwa-zadania
```

 Przykład:

```
git checkout -b dodanie-logowania
```

 Możesz sprawdzić, na jakiej gałęzi jesteś:

```
git branch
```

 Aktualna gałąź będzie oznaczona `*`.

---

 ## 10\. Wprowadzanie zmian

 Pracujesz normalnie nad kodem.

 Przykładowo możesz zmienić:

```
frontend/src/components/Login.jsx
```

 Po skończeniu sprawdź:

```
git status
```

 Git pokaże zmienione pliki.

---

 ## 11\. Dodawanie zmian do Gita

 Aby dodać wszystkie zmiany:

```
git add .
```

 Następnie sprawdź:

```
git status
```

 Pliki powinny pojawić się jako przygotowane do commita.

---

 ## 12\. Commit

 Commit to zapisanie konkretnego zestawu zmian.

 Przykład:

```
git commit -m "Dodano formularz logowania"
```

 Commit powinien opisywać to, co faktycznie zostało zrobione.

 ### Dobre przykłady commitów:

```
Dodano endpoint użytkownika
Dodano formularz logowania
Poprawiono wygląd navbaru
Dodano walidację formularza
Naprawiono błąd logowania
```

 ### Unikamy commitów typu:

```
zmiany
test
aaa
cos tam
```

---

 ## 13\. Wysyłanie zmian na GitHuba

 Po commicie:

```
git push
```

 Jeżeli jest to pierwszy push nowej gałęzi:

```
git push -u origin nazwa-galezi
```

 Przykład:

```
git push -u origin dodanie-logowania
```

---

 ## 14\. Pull Request

 Po wysłaniu gałęzi na GitHuba tworzymy **Pull Request (PR)**.

 Pull Request oznacza:

 > "Zrobiłem swoją część pracy. Proszę sprawdźcie moje zmiany i po zaakceptowaniu dodajcie je do `main`."

 Nie mergujemy samodzielnie zmian do `main`, jeżeli ustaliliśmy, że druga osoba ma je najpierw sprawdzić.

---

 # Workflow pracy

 ## 15\. Typowy workflow

 Za każdym razem, gdy zaczynasz nowe zadanie:

 ### Krok 1 — przejdź do projektu

```
cd tech-itern
```

 ### Krok 2 — pobierz najnowsze zmiany

```
git checkout main
git pull
```

 ### Krok 3 — utwórz branch

```
git checkout -b nazwa-zadania
```

 Przykład:

```
git checkout -b dodanie-rejestracji
```

 ### Krok 4 — pracuj nad kodem

 Zmieniasz pliki i testujesz aplikację.

 ### Krok 5 — sprawdź zmiany

```
git status
```

 ### Krok 6 — dodaj zmiany

```
git add .
```

 ### Krok 7 — commit

```
git commit -m "Dodano rejestrację użytkownika"
```

 ### Krok 8 — wyślij na GitHuba

```
git push -u origin dodanie-rejestracji
```

 ### Krok 9 — utwórz Pull Request

 Na GitHubie otwórz Pull Request:

```
dodanie-rejestracji
        ↓
      main
```

---

 # Ważne informacje

 ## 16\. Czego NIE wrzucamy na GitHuba

 Nie wrzucamy między innymi:

```
node_modules/
.venv/
__pycache__/
.env
dist/
```

 Te pliki i foldery są ignorowane przez `.gitignore`.

 ### Dlaczego?

 `node_modules` i `.venv` mogą zajmować bardzo dużo miejsca.

 Nie są potrzebne w repozytorium, ponieważ można je odtworzyć.

 ### Frontend

```
npm install
```

 ### Backend

```
python3 -m venv .venv
pip install -r requirements.txt
```

---

 ## 17\. Pliki `.env`

 Jeżeli projekt korzysta ze zmiennych środowiskowych, np.:

```
DATABASE_URL=...
SECRET_KEY=...
API_KEY=...
```

 **nie wrzucamy `.env` na GitHuba.**

 Sekrety i hasła powinny pozostać lokalnie.

 Możemy natomiast utworzyć:

```
.env.example
```

 który pokazuje, jakie zmienne są potrzebne.

 Przykład:

```
DATABASE_URL=
SECRET_KEY=
API_KEY=
```

 Każdy developer tworzy wtedy swój własny `.env`.

---

 # Przydatne polecenia Git

 ## 18\. Najważniejsze komendy

 ### Sprawdzenie statusu

```
git status
```

 ### Lista branchy

```
git branch
```

 ### Przełączenie na branch

```
git checkout nazwa-brancha
```

 ### Utworzenie nowego brancha

```
git checkout -b nazwa-brancha
```

 ### Pobranie zmian

```
git pull
```

 ### Dodanie zmian

```
git add .
```

 ### Commit

```
git commit -m "Opis zmian"
```

 ### Wysłanie zmian

```
git push
```

 ### Sprawdzenie historii commitów

```
git log --oneline
```

---

 ## 19\. Co zrobić, jeżeli coś pójdzie nie tak?

 **Nie panikuj.**

 Jeżeli Git pokazuje błąd:

 1. Nie wykonuj losowych poleceń.
2. Przeczytaj komunikat błędu.
3. Sprawdź:

```
git status
```

 4. Jeżeli nadal nie wiesz, co zrobić — zapytaj drugą osobę z zespołu.

 Szczególnie **nie używaj bez zrozumienia**:

```
git reset --hard
```

 ani:

```
git push --force
```

 Mogą one spowodować utratę zmian albo nadpisać historię brancha.

---

 # Zasady współpracy

 ## 20\. Najważniejsze zasady

 1. Nie pracujemy bezpośrednio na `main`.
2. Każde zadanie ma własny branch.
3. Przed rozpoczęciem pracy robimy `git pull`.
4. Robimy małe, konkretne commity.
5. Commit opisuje wykonane zmiany.
6. Przed wysłaniem zmian sprawdzamy `git status`.
7. Nie wrzucamy `node_modules`, `.venv` ani `.env`.
8. Przed Pull Requestem upewniamy się, że aplikacja działa.
9. Nie używamy `git push --force`, jeżeli nie wiemy dokładnie, dlaczego tego potrzebujemy.
10. Jeżeli pojawi się konflikt Git, nie usuwamy losowo plików — najpierw sprawdzamy, co Git od nas chce.

---

 # Szybka ściąga

 ## 21\. Nowe zadanie

 Jeżeli masz już projekt skonfigurowany i zaczynasz nowe zadanie:

```
git checkout main
git pull
git checkout -b moje-zadanie
```

 Pracujesz...

 Następnie:

```
git status
git add .
git commit -m "Opis wykonanych zmian"
git push -u origin moje-zadanie
```

 Następnie tworzysz Pull Request na GitHubie.

---

 # Pierwsza konfiguracja

 ## 22\. Pierwsza konfiguracja po `git clone`

 Jeżeli dopiero co sklonowałeś projekt:

 ### Frontend

```
cd frontend
npm install
```

 ### Backend — Linux/macOS

```
cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

 ### Backend — Windows

```
cd ..\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

 Po wykonaniu tych kroków projekt powinien być gotowy do pracy.

---

 # Uruchamianie projektu

 ## 23\. Uruchamianie projektu na co dzień

 Podczas codziennej pracy potrzebujesz dwóch terminali.

 ### Terminal 1 — frontend

```
cd tech-itern/frontend
npm run dev
```

 ### Terminal 2 — backend

 Linux/macOS:

```
cd tech-itern/backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

 Windows:

```
cd tech-itern/backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

 ### Adresy

 Frontend:

```
http://localhost:5173
```

 Backend:

```
http://127.0.0.1:8000
```

 Dokumentacja FastAPI:

```
http://127.0.0.1:8000/docs
```

---

 ## Powodzenia! 🚀