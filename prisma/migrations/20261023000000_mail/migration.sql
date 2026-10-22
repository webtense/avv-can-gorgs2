-- Migration 003: Mòdul de comunicacions per correu amb socis (Brevo)
-- Aditiva: no es modifica ni s'elimina cap columna o taula existent.

BEGIN;

-- Exclusió de comunicacions informatives per soci (respectada sempre en els enviaments)
ALTER TABLE members ADD COLUMN IF NOT EXISTS mail_opt_out BOOLEAN NOT NULL DEFAULT false;

-- Plantilles de correu
CREATE TABLE IF NOT EXISTS mail_templates (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    locale     TEXT NOT NULL DEFAULT 'ca' CHECK (locale IN ('ca', 'es')),
    subject    TEXT NOT NULL,
    body_text  TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registre d'enviaments (no es desa el cos complet del correu, només l'assumpte)
CREATE TABLE IF NOT EXISTS mail_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id           UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    template_id         UUID REFERENCES mail_templates(id) ON DELETE SET NULL,
    campaign_id         UUID,
    subject             TEXT NOT NULL,
    status              TEXT NOT NULL CHECK (status IN ('enviat', 'error')),
    provider_message_id TEXT,
    error_code          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_log_member_id ON mail_log(member_id);
CREATE INDEX IF NOT EXISTS idx_mail_log_status ON mail_log(status);
CREATE INDEX IF NOT EXISTS idx_mail_log_campaign_id ON mail_log(campaign_id);

-- Plantilles de partida (catalán i castellà)
INSERT INTO mail_templates (name, locale, subject, body_text) VALUES
('Avís de quota pendent', 'ca', 'Quota pendent de pagament — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Repassant els rebuts ens hem adonat que la quota del període {{periode}}, de {{import}} €, encara consta com a pendent.' || E'\n\n' ||
 'Si ja l''has pagat, ignora aquest avís; segurament s''han creuat els terminis. Si no ha estat així, pots fer l''ingrés quan et vagi bé o escriure''ns si hi ha algun problema, que ho mirem junts.' || E'\n\n' ||
 'Gràcies per formar part de l''associació.'),
('Avís de cuota pendiente', 'es', 'Cuota pendiente de pago — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Revisando los recibos hemos visto que la cuota del periodo {{periode}}, de {{import}} €, sigue pendiente.' || E'\n\n' ||
 'Si ya la has pagado, no hagas caso de este aviso; es probable que se hayan cruzado los plazos. Si no ha sido así, puedes hacer el ingreso cuando puedas o escribirnos si hay algún problema, que lo miramos juntos.' || E'\n\n' ||
 'Gracias por formar parte de la asociación.'),
('Confirmació de pagament', 'ca', 'Hem rebut el teu pagament — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Et confirmem que hem rebut el pagament de {{import}} € corresponent al període {{periode}} (factura {{nº_factura}}).' || E'\n\n' ||
 'Guarda aquest correu com a justificant. Qualsevol dubte, ja saps on trobar-nos.' || E'\n\n' ||
 'Gràcies!'),
('Confirmación de pago', 'es', 'Hemos recibido tu pago — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Te confirmamos que hemos recibido el pago de {{import}} € correspondiente al periodo {{periode}} (factura {{nº_factura}}).' || E'\n\n' ||
 'Guarda este correo como justificante. Cualquier duda, ya sabes dónde encontrarnos.' || E'\n\n' ||
 'Gracias!'),
('Convocatòria d''assemblea o activitat', 'ca', 'Et convoquem: {{periode}} — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Et volem convidar a la propera trobada de l''associació, el {{periode}}. Com sempre, serà un bon moment per posar-nos al dia i decidir entre tots els propers passos del barri.' || E'\n\n' ||
 'Confirma''ns si hi podràs venir responent a aquest correu. Ens fa il·lusió comptar amb tu.'),
('Convocatoria de asamblea o actividad', 'es', 'Te convocamos: {{periode}} — AVV Can Gorgs II',
 'Hola {{nom}},' || E'\n\n' ||
 'Queremos invitarte al próximo encuentro de la asociación, el {{periode}}. Como siempre, será un buen momento para ponernos al día y decidir entre todos los próximos pasos del barrio.' || E'\n\n' ||
 'Confírmanos si podrás venir respondiendo a este correo. Nos hace ilusión contar contigo.')
ON CONFLICT DO NOTHING;

COMMIT;
