-- Extensions are provisioned separately from Flyway because production extension
-- installation requires a privileged database administrator role.
CREATE EXTENSION IF NOT EXISTS vector;
