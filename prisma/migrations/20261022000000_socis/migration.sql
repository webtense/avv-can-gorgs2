-- Migration 002: Sistema de socis, reserves d'actes i pujada de fotos
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Nous camps a events per gestionar actes exclusius per a socis i reserves
ALTER TABLE events ADD COLUMN IF NOT EXISTS members_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reservations_open BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INT;

-- Socis
CREATE TABLE IF NOT EXISTS members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT,
    password_hash   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pendent' CHECK (status IN ('pendent', 'actiu', 'rebutjat')),
    admin           BOOLEAN NOT NULL DEFAULT false,
    gdpr_consent_at TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Reserves d'actes (gratuïtes)
CREATE TABLE IF NOT EXISTS reservations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id  UUID REFERENCES members(id) ON DELETE SET NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    quantity   INT NOT NULL CHECK (quantity BETWEEN 1 AND 4),
    status     TEXT NOT NULL DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancel·lada')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_event_id ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_member_id ON reservations(member_id);

-- Fotos pujades pels socis
CREATE TABLE IF NOT EXISTS event_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    file_name   TEXT NOT NULL,
    mime_type   TEXT NOT NULL,
    size_bytes  INT NOT NULL,
    caption     TEXT,
    approved    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_approved ON event_photos(approved);

COMMIT;

-- Per marcar el primer administrador (executar manualment després de registrar-se i
-- ser aprovat com a soci actiu):
-- UPDATE members SET admin = true WHERE email = 'correu@exemple.cat';
