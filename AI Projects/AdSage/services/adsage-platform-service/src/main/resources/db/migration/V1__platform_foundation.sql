CREATE TABLE conversation (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    owner_subject_id VARCHAR(256) NOT NULL,
    title VARCHAR(256),
    status VARCHAR(32) NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_conversation_tenant_owner_updated
    ON conversation (tenant_id, owner_subject_id, updated_at DESC);

CREATE TABLE conversation_message (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversation(id),
    role VARCHAR(32) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'TOOL')),
    content TEXT NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    sequence_number BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE (conversation_id, sequence_number)
);

CREATE INDEX idx_message_tenant_conversation_sequence
    ON conversation_message (tenant_id, conversation_id, sequence_number);

CREATE TABLE orchestration_run (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversation(id),
    request_id VARCHAR(128) NOT NULL,
    state VARCHAR(32) NOT NULL,
    intent VARCHAR(64),
    deadline_at TIMESTAMPTZ NOT NULL,
    step_count INTEGER NOT NULL DEFAULT 0 CHECK (step_count >= 0),
    repair_count INTEGER NOT NULL DEFAULT 0 CHECK (repair_count >= 0),
    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, request_id)
);

CREATE TABLE audit_event (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(128) NOT NULL,
    actor_subject_id VARCHAR(256) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(256),
    decision VARCHAR(32) NOT NULL,
    policy_version VARCHAR(64) NOT NULL,
    request_id VARCHAR(128) NOT NULL,
    trace_id VARCHAR(64),
    redacted_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_audit_tenant_occurred ON audit_event (tenant_id, occurred_at DESC);
