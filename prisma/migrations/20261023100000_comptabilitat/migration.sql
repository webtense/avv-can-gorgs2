-- Migration: Mòdul de comptabilitat i cobraments (quotes, factures emeses/rebudes, pagaments, auditoria)
-- Aditiva: no es modifica ni s'elimina cap taula ni columna existent.

BEGIN;

-- Configuració de quotes (importe i periodicitat). Sense valor per defecte:
-- queda buit fins que la junta el fixi des de l'admin.
CREATE TABLE IF NOT EXISTS accounting_config (
    id                  INT PRIMARY KEY DEFAULT 1,
    fee_amount_cents    INT,
    fee_periodicity     TEXT NOT NULL DEFAULT 'anual' CHECK (fee_periodicity IN ('anual')),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT accounting_config_singleton CHECK (id = 1)
);
INSERT INTO accounting_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Quotes de socis
CREATE TABLE IF NOT EXISTS member_fees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    period          TEXT NOT NULL,
    amount_cents    INT NOT NULL CHECK (amount_cents >= 0),
    status          TEXT NOT NULL DEFAULT 'pendent' CHECK (status IN ('pendent', 'pagada')),
    paid_at         TIMESTAMPTZ,
    method          TEXT CHECK (method IN ('efectiu', 'transferencia', 'altre')),
    receipt_number  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (member_id, period)
);

CREATE INDEX IF NOT EXISTS idx_member_fees_period ON member_fees(period);
CREATE INDEX IF NOT EXISTS idx_member_fees_status ON member_fees(status);
CREATE INDEX IF NOT EXISTS idx_member_fees_member_id ON member_fees(member_id);

-- Factures emeses (serie + correlatiu sense buits)
CREATE TABLE IF NOT EXISTS invoices_issued (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number            TEXT NOT NULL UNIQUE,
    issue_date        DATE NOT NULL,
    recipient_name    TEXT NOT NULL,
    recipient_nif     TEXT,
    recipient_address TEXT,
    subtotal_cents    INT NOT NULL DEFAULT 0,
    vat_cents         INT NOT NULL DEFAULT 0,
    total_cents       INT NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'emesa' CHECK (status IN ('emesa', 'anulada')),
    notes             TEXT,
    rectifies_id      UUID REFERENCES invoices_issued(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- L'IVA es guarda sempre com a camp independent de la base i mai es dedueix
    -- només en pantalla: l'assentament ha de quadrar (base + IVA = total).
    CONSTRAINT chk_invoices_issued_totals CHECK (subtotal_cents + vat_cents = total_cents)
);

CREATE INDEX IF NOT EXISTS idx_invoices_issued_status ON invoices_issued(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_issue_date ON invoices_issued(issue_date);

CREATE TABLE IF NOT EXISTS invoice_issued_lines (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id       UUID NOT NULL REFERENCES invoices_issued(id) ON DELETE CASCADE,
    description      TEXT NOT NULL,
    qty              INT NOT NULL CHECK (qty > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    -- Base, tipus d'IVA i quota d'IVA es guarden com a camps independents
    -- (mai només calculats a pantalla), i l'assentament de la línia ha de quadrar.
    base_cents       INT NOT NULL,
    vat_rate_percent INT NOT NULL CHECK (vat_rate_percent >= 0),
    vat_cents        INT NOT NULL,
    line_total_cents INT NOT NULL,
    position         INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_invoice_issued_lines_totals CHECK (base_cents + vat_cents = line_total_cents)
);

CREATE INDEX IF NOT EXISTS idx_invoice_issued_lines_invoice_id ON invoice_issued_lines(invoice_id);

-- Correlatiu de numeració, una fila per sèrie/any, per assignar-lo en transacció
CREATE TABLE IF NOT EXISTS invoice_number_sequences (
    series     TEXT PRIMARY KEY,
    last_value INT NOT NULL DEFAULT 0
);

-- Factures rebudes
CREATE TABLE IF NOT EXISTS invoices_received (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_name  TEXT NOT NULL,
    supplier_nif   TEXT,
    invoice_number TEXT NOT NULL,
    issue_date     DATE NOT NULL,
    due_date       DATE,
    base_cents     INT NOT NULL CHECK (base_cents >= 0),
    -- Tipus d'IVA i quota d'IVA com a camps independents de la base i del total;
    -- la quota es recalcula sempre al servidor a partir de base i tipus, mai es
    -- confia en un import enviat pel client.
    vat_rate_percent INT NOT NULL CHECK (vat_rate_percent >= 0),
    vat_cents      INT NOT NULL DEFAULT 0 CHECK (vat_cents >= 0),
    total_cents    INT NOT NULL CHECK (total_cents >= 0),
    status         TEXT NOT NULL DEFAULT 'pendent' CHECK (status IN ('pendent', 'pagada')),
    paid_at        TIMESTAMPTZ,
    method          TEXT CHECK (method IN ('efectiu', 'transferencia', 'altre')),
    file_path      TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_invoices_received_totals CHECK (base_cents + vat_cents = total_cents)
);

CREATE INDEX IF NOT EXISTS idx_invoices_received_status ON invoices_received(status);
CREATE INDEX IF NOT EXISTS idx_invoices_received_issue_date ON invoices_received(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_received_supplier ON invoices_received(supplier_name);

-- Auditoria del mòdul de comptabilitat (sense dades sensibles al detall)
CREATE TABLE IF NOT EXISTS accounting_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_member_id UUID REFERENCES members(id),
    action          TEXT NOT NULL,
    entity          TEXT NOT NULL,
    entity_id       UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    detail          TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounting_audit_entity ON accounting_audit(entity, entity_id);

COMMIT;
