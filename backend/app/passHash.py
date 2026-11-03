import hashlib;
import os;
import hmac;

def hashuj(password):
    password_bytes = password.encode('utf-8')
    
    # Generate a unique 16-byte random salt
    salt = os.urandom(16)
    
    # Hash using PBKDF2 with SHA-256 and 600,000 iterations (OWASP recommendation)
    hashed = hashlib.pbkdf2_hmac('sha256', password_bytes, salt, 600000)
    
    # You MUST store BOTH the salt and the hash in your database
    return salt.hex(), hashed.hex()
def czyPoprawne(stored_salt, stored_hash, password_to_check):
    password_bytes = password_to_check.encode('utf-8')
    
    # Compute the hash using the exact same salt and iteration count
    new_hash = hashlib.pbkdf2_hmac('sha256', password_bytes, bytes.fromhex(stored_salt), 600000)
    
    # Use hmac.compare_digest to prevent timing attacks 
    # == niebezpieczne
    return hmac.compare_digest(bytes.fromhex(stored_hash), new_hash);
# uzycie:
#salt, hashed = hashuj("123123")
#print(czyPoprawne(salt, hashed, "123123 "))