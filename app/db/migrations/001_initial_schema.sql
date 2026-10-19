-- Migration 001: Initial schema for Can Gorgs II historical archive
-- PostgreSQL syntax
-- 14 entities covering the historical archive domain

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. sources: origin of archived material (donation, loan, institution, etc.)
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. rights: usage/copyright status applicable to archived items
CREATE TABLE rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    is_public_domain BOOLEAN NOT NULL DEFAULT false,
    requires_attribution BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. people: individuals referenced across the archive
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    birth_year INT,
    death_year INT,
    biography TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. places: locations referenced across the archive
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. festivals: recurring local festivities documented in the archive
CREATE TABLE festivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    typical_month INT CHECK (typical_month BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. events: historical events (may belong to a festival)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    event_year INT,
    festival_id UUID REFERENCES festivals(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    rights_id UUID REFERENCES rights(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. photos: photographic archive items
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    taken_year INT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    rights_id UUID REFERENCES rights(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. documents: textual/archival documents (PDF, scans, letters, etc.)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    document_type TEXT,
    document_year INT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    rights_id UUID REFERENCES rights(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. videos: audiovisual archive items
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    duration_seconds INT,
    recorded_year INT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    rights_id UUID REFERENCES rights(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. tags: free-form labels for search/categorization
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. photo_people: many-to-many photos <-> people
CREATE TABLE photo_people (
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (photo_id, person_id)
);

-- 12. item_tags: many-to-many generic tagging across item types
CREATE TABLE item_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('event', 'photo', 'document', 'video')),
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tag_id, item_type, item_id)
);

-- 13. contributions: public submissions awaiting moderation (Fase 2 ready)
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_name TEXT,
    contributor_email TEXT,
    item_type TEXT NOT NULL CHECK (item_type IN ('event', 'photo', 'document', 'video')),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. audit_log: tracks changes to archive records (Fase 2 auth-ready)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT,
    action TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_festival_id ON events(festival_id);
CREATE INDEX idx_events_place_id ON events(place_id);
CREATE INDEX idx_events_event_year ON events(event_year);
CREATE INDEX idx_events_title_trgm ON events USING gin (title gin_trgm_ops);

CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_place_id ON photos(place_id);
CREATE INDEX idx_photos_taken_year ON photos(taken_year);
CREATE INDEX idx_photos_title_trgm ON photos USING gin (title gin_trgm_ops);

CREATE INDEX idx_documents_event_id ON documents(event_id);
CREATE INDEX idx_documents_document_year ON documents(document_year);
CREATE INDEX idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);

CREATE INDEX idx_videos_event_id ON videos(event_id);
CREATE INDEX idx_videos_recorded_year ON videos(recorded_year);

CREATE INDEX idx_photo_people_person_id ON photo_people(person_id);
CREATE INDEX idx_item_tags_item ON item_tags(item_type, item_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_audit_log_item ON audit_log(item_type, item_id);

COMMIT;
