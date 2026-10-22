-- Migration: Cost de producte i moviments d'estoc per al TPV (v1.5.3).
-- Permet registrar el cost de compra d'un producte, entrades/sortides
-- manuals d'estoc, i el cost/valor congelats de cada venda i regal per
-- poder mostrar coste, valor dels regals i marge a l'informe d'acte.
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Coste unitari de compra d'un producte (editable des de /admin/tpv, junt
-- amb el preu de venda). Nul·lable: no tots els productes en tenen.
ALTER TABLE tpv_products ADD COLUMN IF NOT EXISTS cost_cents INT;

-- Moviments d'estoc d'un producte: entrades/sortides manuals (admin) i
-- vendes/regals generats automàticament dins la mateixa transacció que la
-- venda. El cost i el valor es congelen en el moment del moviment (còpia de
-- cost_cents del producte en aquell instant), de manera que un canvi
-- posterior del cost de catàleg no altera l'històric.
CREATE TABLE IF NOT EXISTS tpv_stock_movements (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID NOT NULL REFERENCES tpv_products(id) ON DELETE CASCADE,
    event_id          UUID REFERENCES events(id),
    session_id        UUID REFERENCES cash_sessions(id),
    type              TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'venta', 'regalo')),
    qty               INT NOT NULL CHECK (qty > 0),
    unit_cost_cents   INT,
    unit_value_cents  INT,
    total_cost_cents  INT NOT NULL DEFAULT 0,
    total_value_cents INT NOT NULL DEFAULT 0,
    note              TEXT,
    created_by        UUID REFERENCES members(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpv_stock_movements_product_id ON tpv_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_tpv_stock_movements_event_id ON tpv_stock_movements(event_id);
CREATE INDEX IF NOT EXISTS idx_tpv_stock_movements_session_id ON tpv_stock_movements(session_id);

COMMIT;
