package com.adsage.platform.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMigrationTest {

    @Container
    private static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:17-alpine");

    @Test
    void foundationMigrationCreatesTenantScopedTables() throws SQLException {
        Flyway flyway =
                Flyway.configure()
                        .dataSource(
                                POSTGRES.getJdbcUrl(),
                                POSTGRES.getUsername(),
                                POSTGRES.getPassword())
                        .locations("classpath:db/migration")
                        .load();

        assertThat(flyway.migrate().success).isTrue();
        try (var connection = POSTGRES.createConnection("");
                var statement =
                        connection.prepareStatement(
                                """
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name IN ('conversation', 'conversation_message',
                                             'orchestration_run', 'audit_event')
                        """);
                var result = statement.executeQuery()) {
            var tables = new java.util.HashSet<String>();
            while (result.next()) {
                tables.add(result.getString(1));
            }
            assertThat(tables)
                    .containsExactlyInAnyOrder(
                            "conversation",
                            "conversation_message",
                            "orchestration_run",
                            "audit_event");
        }
    }
}
