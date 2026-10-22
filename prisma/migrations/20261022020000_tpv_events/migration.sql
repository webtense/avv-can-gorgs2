-- Migration 004: Actes de barra per al TPV (catàleg per acte, caixa lligada a un
-- acte, línies de venda marcades com a regal).
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Productes habilitats per a un acte de barra concret, amb preu propi opcional
-- (si no es defineix, es fa servir el preu de catàleg de tpv_products).
CREATE TABLE IF NOT EXISTS tpv_event_products (
    event_id             UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    product_id           UUID NOT NULL REFERENCES tpv_products(id) ON DELETE CASCADE,
    price_cents_override INT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_tpv_event_products_event_id ON tpv_event_products(event_id);

-- Torn de caixa lligat opcionalment a un acte de barra ("ningú / barra habitual"
-- quan és NULL).
ALTER TABLE cash_sessions ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_event_id ON cash_sessions(event_id);

-- Línia de venda marcada com a regal: line_total_cents es calcula a 0 en
-- servidor però unit_price_cents es conserva per poder calcular el valor
-- regalat als informes.
ALTER TABLE tpv_sale_lines ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

COMMIT;
