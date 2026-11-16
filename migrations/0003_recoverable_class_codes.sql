-- Los códigos anteriores conservan NULL: un HMAC no permite recuperar el valor.
ALTER TABLE classes ADD COLUMN code_encrypted TEXT;
