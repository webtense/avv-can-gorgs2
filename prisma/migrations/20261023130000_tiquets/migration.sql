-- Migration: Tiquets virtuals amb codi QR per a les reserves d'esdeveniments (v1.7.0).
-- Afegeix un codi públic únic per reserva (per generar un tiquet amb QR i
-- fer-ne el control d'accés a la barra/entrada) i el registre de check-in.
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES members(id);

-- Backfill: les reserves ja existents (creades abans d'aquesta migració) no
-- tenen ticket_code. Se'ls en genera un d'aleatori i únic amb el mateix
-- alfabet que fa servir lib/tickets.ts (Crockford sense 0/O/1/I/L/U), perquè
-- la columna pugui quedar NOT NULL + UNIQUE sense trencar files existents.
DO $$
DECLARE
  alphabet TEXT := '23456789ABCDEFGHJKMNPQRSTVWXYZ';
  r RECORD;
  code TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id FROM reservations WHERE ticket_code IS NULL LOOP
    LOOP
      code := '';
      FOR i IN 1..12 LOOP
        code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM reservations WHERE ticket_code = code);
    END LOOP;
    UPDATE reservations SET ticket_code = code WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE reservations ALTER COLUMN ticket_code SET NOT NULL;
ALTER TABLE reservations ADD CONSTRAINT reservations_ticket_code_key UNIQUE (ticket_code);

CREATE INDEX IF NOT EXISTS idx_reservations_ticket_code ON reservations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_reservations_checked_in_by ON reservations(checked_in_by);

COMMIT;
