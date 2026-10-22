-- Migration 003: TPV senzill en efectiu (torns de caixa, catàleg, vendes)
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Flag per marcar quins socis poden operar el TPV (a més dels admins)
ALTER TABLE members ADD COLUMN IF NOT EXISTS tpv_operator BOOLEAN NOT NULL DEFAULT false;

-- Catàleg de productes. Es creen inactius i sense preu; l'administrador
-- ha de posar el preu i activar-los abans que es puguin vendre.
CREATE TABLE IF NOT EXISTS tpv_products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    category    TEXT,
    price_cents INT,
    active      BOOLEAN NOT NULL DEFAULT false,
    sort        INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tpv_products_active_price_chk CHECK (active = false OR price_cents IS NOT NULL)
);

-- Torns de caixa
CREATE TABLE IF NOT EXISTS cash_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_by           UUID NOT NULL REFERENCES members(id),
    opened_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    opening_float_cents INT NOT NULL DEFAULT 0,
    closed_at           TIMESTAMPTZ,
    closed_by           UUID REFERENCES members(id),
    counted_cents       INT,
    expected_cents      INT,
    difference_cents    INT,
    note                TEXT
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_at ON cash_sessions(opened_at);

-- Vendes
CREATE TABLE IF NOT EXISTS tpv_sales (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID NOT NULL REFERENCES cash_sessions(id),
    operator_id  UUID NOT NULL REFERENCES members(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_cents  INT NOT NULL,
    paid_cents   INT NOT NULL,
    change_cents INT NOT NULL,
    voided       BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tpv_sales_session_id ON tpv_sales(session_id);

-- Línies de venda (snapshot del nom i preu en el moment de la venda)
CREATE TABLE IF NOT EXISTS tpv_sale_lines (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id           UUID NOT NULL REFERENCES tpv_sales(id) ON DELETE CASCADE,
    product_id        UUID REFERENCES tpv_products(id) ON DELETE SET NULL,
    name              TEXT NOT NULL,
    unit_price_cents  INT NOT NULL,
    qty               INT NOT NULL CHECK (qty > 0),
    line_total_cents  INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tpv_sale_lines_sale_id ON tpv_sale_lines(sale_id);

-- Catàleg inicial: productes creats inactius i sense preu, a l'espera que
-- l'administrador els activi des de /admin/tpv.
INSERT INTO tpv_products (name, category, active, sort) VALUES
    ('Coca-Cola', 'Begudes', false, 10),
    ('Cervesa', 'Begudes', false, 20),
    ('Refresc', 'Begudes', false, 30)
ON CONFLICT DO NOTHING;

COMMIT;
