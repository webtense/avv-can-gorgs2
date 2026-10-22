-- Migration 005: Cost de producte, moviments d'estoc i valor explícit dels
-- regals per poder mostrar coste i stock a l'informe d'actes de barra.
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Coste unitari de compra d'un producte (editable des de /admin/tpv).
ALTER TABLE tpv_products ADD COLUMN IF NOT EXISTS cost_cents INT;

-- Valor unitari explícit indicat en marcar una línia de venda com a regal
-- (ex: 10,00€ per unitat). Si és NULL, el valor es resol amb cost_cents i,
-- si tampoc n'hi ha, amb el preu normal de la línia.
ALTER TABLE tpv_sale_lines ADD COLUMN IF NOT EXISTS gift_value_cents INT;

-- Moviments d'estoc: entrades/sortides manuals (admin) i vendes/regals
-- generats automàticament en crear cada línia de venda.
CREATE TABLE IF NOT EXISTS tpv_stock_movements (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID NOT NULL REFERENCES tpv_products(id) ON DELETE CASCADE,
    event_id          UUID REFERENCES events(id),
    session_id        UUID REFERENCES cash_sessions(id),
    type              TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'venta', 'regalo')),
    qty               INT NOT NULL CHECK (qty > 0),
    unit_cost_cents   INT,
    unit_value_cents  INT,
    total_cost_cents  INT,
    total_value_cents INT,
    note              TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpv_stock_movements_product_id ON tpv_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_tpv_stock_movements_event_id ON tpv_stock_movements(event_id);

COMMIT;
