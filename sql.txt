CREATE TABLE Uzytkownicy (
    uzytkownik_id INT AUTO_INCREMENT PRIMARY KEY,
    nazwa VARCHAR(16) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE Wyniki (
  	wynik_id INT AUTO_INCREMENT PRIMARY KEY,
    uzytkownik_id INT NOT NULL,
  	wynik INT NOT NULL,    
	CONSTRAINT fk_uzytkownik FOREIGN KEY (uzytkownik_id) 
    REFERENCES Uzytkownicy(uzytkownik_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);