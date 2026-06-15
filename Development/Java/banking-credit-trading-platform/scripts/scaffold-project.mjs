import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function write(file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.trimStart().replace(/\r\n/g, '\n'));
}

const serviceModules = [
  'market-data-service',
  'rfq-service',
  'oms-service',
  'risk-service',
  'fix-gateway-simulator',
  'api-gateway',
  'reporting-service'
];

write('pom.xml', `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.5</version>
        <relativePath/>
    </parent>

    <groupId>com.example.banking</groupId>
    <artifactId>banking-credit-trading-platform</artifactId>
    <version>0.1.0-SNAPSHOT</version>
    <packaging>pom</packaging>
    <name>banking-credit-trading-platform</name>
    <description>Production-style simulated banking credit trading platform for local learning.</description>

    <modules>
        <module>common-domain</module>
        <module>common-observability</module>
        <module>market-data-service</module>
        <module>rfq-service</module>
        <module>oms-service</module>
        <module>risk-service</module>
        <module>fix-gateway-simulator</module>
        <module>low-latency-lab</module>
        <module>api-gateway</module>
        <module>reporting-service</module>
    </modules>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.release>21</maven.compiler.release>
        <springdoc.version>2.6.0</springdoc.version>
        <resilience4j.version>2.2.0</resilience4j.version>
        <testcontainers.version>1.20.3</testcontainers.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>testcontainers-bom</artifactId>
                <version>\${testcontainers.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <configuration>
                        <release>\${maven.compiler.release}</release>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <configuration>
                        <useModulePath>false</useModulePath>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
`);

write('common-domain/pom.xml', `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.example.banking</groupId>
        <artifactId>banking-credit-trading-platform</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>
    <artifactId>common-domain</artifactId>
    <name>common-domain</name>

    <dependencies>
        <dependency>
            <groupId>jakarta.validation</groupId>
            <artifactId>jakarta.validation-api</artifactId>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
`);

write('common-observability/pom.xml', `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.example.banking</groupId>
        <artifactId>banking-credit-trading-platform</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>
    <artifactId>common-observability</artifactId>
    <name>common-observability</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-web</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
`);

function servicePom(module, extra = '') {
  write(`${module}/pom.xml`, `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.example.banking</groupId>
        <artifactId>banking-credit-trading-platform</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>
    <artifactId>${module}</artifactId>
    <name>${module}</name>

    <dependencies>
        <dependency>
            <groupId>com.example.banking</groupId>
            <artifactId>common-domain</artifactId>
            <version>\${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.example.banking</groupId>
            <artifactId>common-observability</artifactId>
            <version>\${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>\${springdoc.version}</version>
        </dependency>
        ${extra}
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`);
}

const dataDeps = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.github.resilience4j</groupId>
            <artifactId>resilience4j-spring-boot3</artifactId>
            <version>\${resilience4j.version}</version>
        </dependency>`;

for (const module of ['market-data-service', 'rfq-service', 'oms-service', 'risk-service', 'reporting-service']) {
  servicePom(module, dataDeps);
}

servicePom('fix-gateway-simulator', `
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>`);

servicePom('api-gateway', `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jsr310</artifactId>
        </dependency>`);

write('low-latency-lab/pom.xml', `
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.example.banking</groupId>
        <artifactId>banking-credit-trading-platform</artifactId>
        <version>0.1.0-SNAPSHOT</version>
    </parent>
    <artifactId>low-latency-lab</artifactId>
    <name>low-latency-lab</name>

    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
`);

// Common domain
write('common-domain/src/main/java/com/example/banking/domain/model/Side.java', `
package com.example.banking.domain.model;

public enum Side {
    BUY,
    SELL
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/RfqStatus.java', `
package com.example.banking.domain.model;

public enum RfqStatus {
    CREATED,
    QUOTED,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    CANCELLED
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/OrderStatus.java', `
package com.example.banking.domain.model;

public enum OrderStatus {
    NEW,
    VALIDATED,
    RISK_REJECTED,
    ACCEPTED,
    ROUTED,
    EXECUTED,
    CANCELLED,
    FAILED
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/RiskDecisionStatus.java', `
package com.example.banking.domain.model;

public enum RiskDecisionStatus {
    APPROVED,
    REJECTED
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/InstrumentType.java', `
package com.example.banking.domain.model;

public enum InstrumentType {
    CREDIT_BOND,
    CDS_INDEX
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/Money.java', `
package com.example.banking.domain.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

public record Money(BigDecimal amount, String currency) implements Comparable<Money> {
    public Money {
        Objects.requireNonNull(amount, "amount is required");
        Objects.requireNonNull(currency, "currency is required");
        if (currency.isBlank()) {
            throw new IllegalArgumentException("currency is required");
        }
        amount = amount.setScale(2, RoundingMode.HALF_UP);
        currency = currency.toUpperCase();
    }

    public static Money usd(String amount) {
        return new Money(new BigDecimal(amount), "USD");
    }

    public Money add(Money other) {
        requireSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    public Money subtract(Money other) {
        requireSameCurrency(other);
        return new Money(amount.subtract(other.amount), currency);
    }

    public Money multiply(BigDecimal multiplier) {
        return new Money(amount.multiply(multiplier), currency);
    }

    private void requireSameCurrency(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("currency mismatch: " + currency + " vs " + other.currency);
        }
    }

    @Override
    public int compareTo(Money other) {
        requireSameCurrency(other);
        return amount.compareTo(other.amount);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/Isin.java', `
package com.example.banking.domain.model;

import java.util.Locale;
import java.util.regex.Pattern;

public record Isin(String value) {
    private static final Pattern ISIN_PATTERN = Pattern.compile("[A-Z]{2}[A-Z0-9]{9}[0-9]");

    public Isin {
        if (value == null || !ISIN_PATTERN.matcher(value.toUpperCase(Locale.ROOT)).matches()) {
            throw new IllegalArgumentException("Invalid ISIN: " + value);
        }
        value = value.toUpperCase(Locale.ROOT);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/model/CorrelationId.java', `
package com.example.banking.domain.model;

import java.util.UUID;

public record CorrelationId(String value) {
    public CorrelationId {
        if (value == null || value.isBlank()) {
            value = UUID.randomUUID().toString();
        }
    }

    public static CorrelationId newId() {
        return new CorrelationId(UUID.randomUUID().toString());
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/exception/DomainException.java', `
package com.example.banking.domain.exception;

public class DomainException extends RuntimeException {
    public DomainException(String message) {
        super(message);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/exception/NotFoundException.java', `
package com.example.banking.domain.exception;

public class NotFoundException extends DomainException {
    public NotFoundException(String message) {
        super(message);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/exception/BusinessRuleViolationException.java', `
package com.example.banking.domain.exception;

public class BusinessRuleViolationException extends DomainException {
    public BusinessRuleViolationException(String message) {
        super(message);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/DomainEvent.java', `
package com.example.banking.domain.event;

import java.time.Instant;

public interface DomainEvent {
    String eventId();
    String eventType();
    String aggregateId();
    String correlationId();
    Instant occurredAt();
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/MarketDataTickEvent.java', `
package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketDataTickEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String instrumentId,
        BigDecimal bid,
        BigDecimal ask,
        BigDecimal mid,
        BigDecimal yield,
        BigDecimal spreadBps) implements DomainEvent {
    @Override
    public String eventType() {
        return "market-data.ticks";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/RfqCreatedEvent.java', `
package com.example.banking.domain.event;

import com.example.banking.domain.model.Side;
import java.math.BigDecimal;
import java.time.Instant;

public record RfqCreatedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String clientId,
        String instrumentId,
        Side side,
        BigDecimal notional) implements DomainEvent {
    @Override
    public String eventType() {
        return "rfq.created";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/RfqQuotedEvent.java', `
package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record RfqQuotedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String traderId,
        BigDecimal quotePrice,
        BigDecimal spreadBps) implements DomainEvent {
    @Override
    public String eventType() {
        return "rfq.quoted";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/RfqAcceptedEvent.java', `
package com.example.banking.domain.event;

import java.time.Instant;

public record RfqAcceptedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String quoteId,
        String clientId) implements DomainEvent {
    @Override
    public String eventType() {
        return "rfq.accepted";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/OrderCreatedEvent.java', `
package com.example.banking.domain.event;

import com.example.banking.domain.model.Side;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderCreatedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String rfqId,
        String clientId,
        String instrumentId,
        Side side,
        BigDecimal notional) implements DomainEvent {
    @Override
    public String eventType() {
        return "order.created";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/OrderExecutedEvent.java', `
package com.example.banking.domain.event;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderExecutedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String executionId,
        BigDecimal executedPrice,
        BigDecimal executedQuantity) implements DomainEvent {
    @Override
    public String eventType() {
        return "order.executed";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/RiskRejectedEvent.java', `
package com.example.banking.domain.event;

import java.time.Instant;

public record RiskRejectedEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String clientId,
        String reason) implements DomainEvent {
    @Override
    public String eventType() {
        return "risk.rejected";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/AuditEvent.java', `
package com.example.banking.domain.event;

import java.time.Instant;
import java.util.Map;

public record AuditEvent(
        String eventId,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        String actor,
        String action,
        Map<String, String> details) implements DomainEvent {
    @Override
    public String eventType() {
        return "audit.events";
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/event/DomainEventFactory.java', `
package com.example.banking.domain.event;

import com.example.banking.domain.model.Side;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class DomainEventFactory {
    private DomainEventFactory() {
    }

    public static RfqCreatedEvent rfqCreated(String rfqId, String correlationId, String clientId,
                                             String instrumentId, Side side, BigDecimal notional) {
        return new RfqCreatedEvent(newEventId(), rfqId, correlationId, Instant.now(), clientId, instrumentId, side, notional);
    }

    public static RfqQuotedEvent rfqQuoted(String rfqId, String correlationId, String traderId,
                                           BigDecimal quotePrice, BigDecimal spreadBps) {
        return new RfqQuotedEvent(newEventId(), rfqId, correlationId, Instant.now(), traderId, quotePrice, spreadBps);
    }

    public static RfqAcceptedEvent rfqAccepted(String rfqId, String correlationId, String quoteId, String clientId) {
        return new RfqAcceptedEvent(newEventId(), rfqId, correlationId, Instant.now(), quoteId, clientId);
    }

    public static OrderCreatedEvent orderCreated(String orderId, String correlationId, String rfqId,
                                                 String clientId, String instrumentId, Side side, BigDecimal notional) {
        return new OrderCreatedEvent(newEventId(), orderId, correlationId, Instant.now(), rfqId, clientId, instrumentId, side, notional);
    }

    public static OrderExecutedEvent orderExecuted(String orderId, String correlationId, String executionId,
                                                   BigDecimal price, BigDecimal quantity) {
        return new OrderExecutedEvent(newEventId(), orderId, correlationId, Instant.now(), executionId, price, quantity);
    }

    public static RiskRejectedEvent riskRejected(String orderId, String correlationId, String clientId, String reason) {
        return new RiskRejectedEvent(newEventId(), orderId, correlationId, Instant.now(), clientId, reason);
    }

    private static String newEventId() {
        return UUID.randomUUID().toString();
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/pricing/PricingRequest.java', `
package com.example.banking.domain.pricing;

import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.Side;
import java.math.BigDecimal;

public record PricingRequest(
        String instrumentId,
        Side side,
        Money notional,
        BigDecimal couponPercent,
        int yearsToMaturity,
        BigDecimal marketYieldPercent,
        BigDecimal spreadBps) {
}
`);

write('common-domain/src/main/java/com/example/banking/domain/pricing/QuotePrice.java', `
package com.example.banking.domain.pricing;

import com.example.banking.domain.model.Money;
import java.math.BigDecimal;

public record QuotePrice(
        BigDecimal cleanPrice,
        BigDecimal dirtyPrice,
        BigDecimal spreadBps,
        BigDecimal dv01,
        Money estimatedSettlementAmount) {
}
`);

write('common-domain/src/main/java/com/example/banking/domain/pricing/PricingStrategy.java', `
package com.example.banking.domain.pricing;

public interface PricingStrategy {
    QuotePrice price(PricingRequest request);
}
`);

write('common-domain/src/main/java/com/example/banking/domain/pricing/CleanPricePricingStrategy.java', `
package com.example.banking.domain.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class CleanPricePricingStrategy implements PricingStrategy {
    private static final BigDecimal PAR = new BigDecimal("100.00");

    @Override
    public QuotePrice price(PricingRequest request) {
        BigDecimal duration = BigDecimal.valueOf(Math.max(1, request.yearsToMaturity()) * 0.85d);
        BigDecimal yieldPenalty = request.marketYieldPercent()
                .subtract(request.couponPercent())
                .multiply(duration)
                .divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP);
        BigDecimal spreadPenalty = request.spreadBps()
                .divide(new BigDecimal("10000"), 8, RoundingMode.HALF_UP)
                .multiply(duration)
                .multiply(PAR);
        BigDecimal clean = PAR.subtract(yieldPenalty.multiply(PAR)).subtract(spreadPenalty)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal dirty = clean.add(request.couponPercent().divide(new BigDecimal("4"), 4, RoundingMode.HALF_UP));
        BigDecimal dv01 = request.notional().amount()
                .multiply(duration)
                .multiply(new BigDecimal("0.0001"))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal settlement = request.notional().amount()
                .multiply(dirty)
                .divide(PAR, 2, RoundingMode.HALF_UP);
        return new QuotePrice(clean, dirty, request.spreadBps(), dv01,
                new com.example.banking.domain.model.Money(settlement, request.notional().currency()));
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/RiskContext.java', `
package com.example.banking.domain.risk;

import com.example.banking.domain.model.Money;

public record RiskContext(
        String clientId,
        String instrumentId,
        Money orderNotional,
        Money clientDailyExposure,
        Money clientDailyLimit,
        boolean instrumentRestricted,
        boolean duplicateOrder,
        boolean killSwitchEnabled) {
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/RiskDecision.java', `
package com.example.banking.domain.risk;

import com.example.banking.domain.model.RiskDecisionStatus;
import java.util.List;

public record RiskDecision(RiskDecisionStatus status, List<String> reasons) {
    public static RiskDecision approved() {
        return new RiskDecision(RiskDecisionStatus.APPROVED, List.of());
    }

    public static RiskDecision rejected(List<String> reasons) {
        return new RiskDecision(RiskDecisionStatus.REJECTED, List.copyOf(reasons));
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/RiskRule.java', `
package com.example.banking.domain.risk;

import java.util.Optional;

public interface RiskRule {
    Optional<String> evaluate(RiskContext context);
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/KillSwitchRule.java', `
package com.example.banking.domain.risk;

import java.util.Optional;

public class KillSwitchRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.killSwitchEnabled() ? Optional.of("Trading kill switch is enabled") : Optional.empty();
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/InstrumentRestrictionRule.java', `
package com.example.banking.domain.risk;

import java.util.Optional;

public class InstrumentRestrictionRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.instrumentRestricted() ? Optional.of("Instrument is restricted for this client") : Optional.empty();
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/DuplicateOrderRule.java', `
package com.example.banking.domain.risk;

import java.util.Optional;

public class DuplicateOrderRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        return context.duplicateOrder() ? Optional.of("Duplicate idempotency key detected") : Optional.empty();
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/MaxOrderNotionalRule.java', `
package com.example.banking.domain.risk;

import java.util.Optional;

public class MaxOrderNotionalRule implements RiskRule {
    @Override
    public Optional<String> evaluate(RiskContext context) {
        if (context.orderNotional().compareTo(context.clientDailyLimit()) > 0) {
            return Optional.of("Order notional exceeds client limit");
        }
        if (context.clientDailyExposure().add(context.orderNotional()).compareTo(context.clientDailyLimit()) > 0) {
            return Optional.of("Daily exposure limit would be breached");
        }
        return Optional.empty();
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/risk/CompositeRiskEngine.java', `
package com.example.banking.domain.risk;

import com.example.banking.domain.model.RiskDecisionStatus;
import java.util.ArrayList;
import java.util.List;

public class CompositeRiskEngine {
    private final List<RiskRule> rules;

    public CompositeRiskEngine(List<RiskRule> rules) {
        this.rules = List.copyOf(rules);
    }

    public RiskDecision evaluate(RiskContext context) {
        List<String> reasons = new ArrayList<>();
        for (RiskRule rule : rules) {
            rule.evaluate(context).ifPresent(reasons::add);
        }
        return reasons.isEmpty()
                ? new RiskDecision(RiskDecisionStatus.APPROVED, List.of())
                : new RiskDecision(RiskDecisionStatus.REJECTED, reasons);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/order/OrderLifecycleStateMachine.java', `
package com.example.banking.domain.order;

import com.example.banking.domain.exception.BusinessRuleViolationException;
import com.example.banking.domain.model.OrderStatus;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;

public class OrderLifecycleStateMachine {
    private static final Map<OrderStatus, EnumSet<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(OrderStatus.NEW, EnumSet.of(OrderStatus.VALIDATED, OrderStatus.CANCELLED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.VALIDATED, EnumSet.of(OrderStatus.ACCEPTED, OrderStatus.RISK_REJECTED, OrderStatus.CANCELLED));
        TRANSITIONS.put(OrderStatus.ACCEPTED, EnumSet.of(OrderStatus.ROUTED, OrderStatus.CANCELLED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.ROUTED, EnumSet.of(OrderStatus.EXECUTED, OrderStatus.FAILED));
        TRANSITIONS.put(OrderStatus.RISK_REJECTED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.EXECUTED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.FAILED, EnumSet.noneOf(OrderStatus.class));
    }

    public OrderStatus transition(OrderStatus current, OrderStatus next) {
        if (!canTransition(current, next)) {
            throw new BusinessRuleViolationException("Invalid order transition from " + current + " to " + next);
        }
        return next;
    }

    public boolean canTransition(OrderStatus current, OrderStatus next) {
        return TRANSITIONS.getOrDefault(current, EnumSet.noneOf(OrderStatus.class)).contains(next);
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/util/ValidationUtils.java', `
package com.example.banking.domain.util;

import java.math.BigDecimal;

public final class ValidationUtils {
    private ValidationUtils() {
    }

    public static void requirePositive(BigDecimal value, String fieldName) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
    }

    public static void requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
    }
}
`);

write('common-domain/src/main/java/com/example/banking/domain/concurrency/CoreJavaExamples.java', `
package com.example.banking.domain.concurrency;

import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;

public class CoreJavaExamples {
    private final Map<String, String> activeRfqs = new ConcurrentHashMap<>();
    private final BlockingQueue<String> auditQueue = new LinkedBlockingQueue<>(1024);
    private final AtomicLong sequence = new AtomicLong();
    private final ReentrantLock publishLock = new ReentrantLock();
    private volatile boolean running = true;

    public long nextSequence() {
        return sequence.incrementAndGet();
    }

    public CompletableFuture<String> enrichAsync(String rfqId) {
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            return CompletableFuture.supplyAsync(() -> activeRfqs.getOrDefault(rfqId, "missing"), executor);
        }
    }

    public void publishWithBackpressure(String event) throws InterruptedException {
        if (!auditQueue.offer(event, 250, TimeUnit.MILLISECONDS)) {
            throw new IllegalStateException("audit queue is saturated");
        }
    }

    public void publishSingleWriter(String key, String value) {
        publishLock.lock();
        try {
            activeRfqs.put(key, value);
        } finally {
            publishLock.unlock();
        }
    }

    public synchronized void stop() {
        running = false;
    }

    public boolean isRunning() {
        return running;
    }
}
`);

write('common-domain/src/test/java/com/example/banking/domain/PricingAndRiskTest.java', `
package com.example.banking.domain;

import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.domain.order.OrderLifecycleStateMachine;
import com.example.banking.domain.pricing.CleanPricePricingStrategy;
import com.example.banking.domain.pricing.PricingRequest;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PricingAndRiskTest {
    @Test
    void cleanPriceStrategyProducesSettlementAndDv01() {
        var price = new CleanPricePricingStrategy().price(new PricingRequest(
                "bond-1",
                Side.BUY,
                Money.usd("1000000"),
                new BigDecimal("5.25"),
                5,
                new BigDecimal("5.70"),
                new BigDecimal("125")));

        assertTrue(price.cleanPrice().compareTo(BigDecimal.ZERO) > 0);
        assertEquals("USD", price.estimatedSettlementAmount().currency());
    }

    @Test
    void riskEngineRejectsKillSwitch() {
        var engine = new CompositeRiskEngine(List.of(new KillSwitchRule(), new MaxOrderNotionalRule()));
        var decision = engine.evaluate(new RiskContext(
                "client-1",
                "bond-1",
                Money.usd("500000"),
                Money.usd("0"),
                Money.usd("1000000"),
                false,
                false,
                true));

        assertEquals(RiskDecisionStatus.REJECTED, decision.status());
    }

    @Test
    void orderLifecycleAllowsHappyPath() {
        var sm = new OrderLifecycleStateMachine();
        assertEquals(OrderStatus.VALIDATED, sm.transition(OrderStatus.NEW, OrderStatus.VALIDATED));
        assertEquals(OrderStatus.ACCEPTED, sm.transition(OrderStatus.VALIDATED, OrderStatus.ACCEPTED));
        assertEquals(OrderStatus.ROUTED, sm.transition(OrderStatus.ACCEPTED, OrderStatus.ROUTED));
        assertEquals(OrderStatus.EXECUTED, sm.transition(OrderStatus.ROUTED, OrderStatus.EXECUTED));
    }
}
`);

// Observability
write('common-observability/src/main/java/com/example/banking/observability/CorrelationIdFilter.java', `
package com.example.banking.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put(MDC_KEY, correlationId);
        response.setHeader(HEADER, correlationId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
`);

write('common-observability/src/main/java/com/example/banking/observability/BusinessMetrics.java', `
package com.example.banking.observability;

public final class BusinessMetrics {
    public static final String RFQS_CREATED = "banking.rfqs.created";
    public static final String ORDERS_CREATED = "banking.orders.created";
    public static final String ORDERS_REJECTED = "banking.orders.rejected";
    public static final String RISK_REJECTION_COUNT = "banking.risk.rejections";
    public static final String CACHE_HIT_RATIO = "banking.cache.hit.ratio";

    private BusinessMetrics() {
    }
}
`);

write('common-observability/src/main/java/com/example/banking/observability/StructuredLog.java', `
package com.example.banking.observability;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;

public final class StructuredLog {
    private StructuredLog() {
    }

    public static void info(Logger logger, String event, Map<String, ?> fields) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", event);
        payload.putAll(fields);
        logger.info("{}", payload);
    }
}
`);

// Shared application yml helper
function appYml(name, port) {
  return `
spring:
  application:
    name: ${name}
  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:h2:mem:${name};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1}
    username: \${SPRING_DATASOURCE_USERNAME:sa}
    password: \${SPRING_DATASOURCE_PASSWORD:}
  h2:
    console:
      enabled: true
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: ${name}
      auto-offset-reset: earliest
      properties:
        spring.json.trusted.packages: com.example.banking.*
  data:
    redis:
      host: \${REDIS_HOST:localhost}
      port: \${REDIS_PORT:6379}
server:
  port: \${SERVER_PORT:${port}}
management:
  health:
    redis:
      enabled: \${REDIS_HEALTH_ENABLED:false}
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
springdoc:
  swagger-ui:
    path: /swagger-ui.html
`;
}

// Market data service
write('market-data-service/src/main/resources/application.yml', appYml('market-data-service', 8081));

write('market-data-service/src/main/resources/db/migration/V1__market_data_schema.sql', `
CREATE TABLE instruments (
    id VARCHAR(64) PRIMARY KEY,
    isin VARCHAR(12) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    instrument_type VARCHAR(40) NOT NULL,
    coupon_percent NUMERIC(10,4) NOT NULL,
    maturity_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL,
    sector VARCHAR(80) NOT NULL
);

CREATE TABLE market_data_ticks (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    instrument_id VARCHAR(64) NOT NULL,
    bid NUMERIC(18,6) NOT NULL,
    ask NUMERIC(18,6) NOT NULL,
    mid NUMERIC(18,6) NOT NULL,
    yield_percent NUMERIC(10,6) NOT NULL,
    spread_bps NUMERIC(10,4) NOT NULL,
    received_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_market_data_instrument_time ON market_data_ticks(instrument_id, received_at DESC);

INSERT INTO instruments (id, isin, name, issuer, instrument_type, coupon_percent, maturity_date, currency, sector)
VALUES
('bond-apple-2029', 'US037833AK68', 'Apple 2029 Senior', 'Apple Inc', 'CREDIT_BOND', 3.4500, DATE '2029-02-09', 'USD', 'Technology'),
('bond-bank-2031', 'US06051GJX30', 'Bank Senior 2031', 'Example Bank', 'CREDIT_BOND', 4.1250, DATE '2031-05-15', 'USD', 'Financials');

INSERT INTO market_data_ticks (instrument_id, bid, ask, mid, yield_percent, spread_bps, received_at)
VALUES
('bond-apple-2029', 98.120000, 98.180000, 98.150000, 5.210000, 95.0000, CURRENT_TIMESTAMP),
('bond-bank-2031', 96.300000, 96.420000, 96.360000, 5.870000, 145.0000, CURRENT_TIMESTAMP);
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/MarketDataApplication.java', `
package com.example.banking.marketdata;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class MarketDataApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketDataApplication.class, args);
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/domain/InstrumentEntity.java', `
package com.example.banking.marketdata.domain;

import com.example.banking.domain.model.InstrumentType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "instruments")
public class InstrumentEntity {
    @Id
    private String id;
    private String isin;
    private String name;
    private String issuer;
    @Enumerated(EnumType.STRING)
    private InstrumentType instrumentType;
    private BigDecimal couponPercent;
    private LocalDate maturityDate;
    private String currency;
    private String sector;

    protected InstrumentEntity() {
    }

    public InstrumentEntity(String id, String isin, String name, String issuer, InstrumentType instrumentType,
                            BigDecimal couponPercent, LocalDate maturityDate, String currency, String sector) {
        this.id = id;
        this.isin = isin;
        this.name = name;
        this.issuer = issuer;
        this.instrumentType = instrumentType;
        this.couponPercent = couponPercent;
        this.maturityDate = maturityDate;
        this.currency = currency;
        this.sector = sector;
    }

    public String getId() { return id; }
    public String getIsin() { return isin; }
    public String getName() { return name; }
    public String getIssuer() { return issuer; }
    public InstrumentType getInstrumentType() { return instrumentType; }
    public BigDecimal getCouponPercent() { return couponPercent; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public String getCurrency() { return currency; }
    public String getSector() { return sector; }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/domain/MarketDataTickEntity.java', `
package com.example.banking.marketdata.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "market_data_ticks")
public class MarketDataTickEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String instrumentId;
    private BigDecimal bid;
    private BigDecimal ask;
    private BigDecimal mid;
    private BigDecimal yieldPercent;
    private BigDecimal spreadBps;
    private Instant receivedAt;

    protected MarketDataTickEntity() {
    }

    public MarketDataTickEntity(String instrumentId, BigDecimal bid, BigDecimal ask, BigDecimal yieldPercent,
                                BigDecimal spreadBps, Instant receivedAt) {
        this.instrumentId = instrumentId;
        this.bid = bid;
        this.ask = ask;
        this.mid = bid.add(ask).divide(new BigDecimal("2"));
        this.yieldPercent = yieldPercent;
        this.spreadBps = spreadBps;
        this.receivedAt = receivedAt;
    }

    public Long getId() { return id; }
    public String getInstrumentId() { return instrumentId; }
    public BigDecimal getBid() { return bid; }
    public BigDecimal getAsk() { return ask; }
    public BigDecimal getMid() { return mid; }
    public BigDecimal getYieldPercent() { return yieldPercent; }
    public BigDecimal getSpreadBps() { return spreadBps; }
    public Instant getReceivedAt() { return receivedAt; }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/repository/InstrumentRepository.java', `
package com.example.banking.marketdata.repository;

import com.example.banking.marketdata.domain.InstrumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstrumentRepository extends JpaRepository<InstrumentEntity, String> {
    Page<InstrumentEntity> findByIssuerContainingIgnoreCase(String issuer, Pageable pageable);
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/repository/MarketDataTickRepository.java', `
package com.example.banking.marketdata.repository;

import com.example.banking.marketdata.domain.MarketDataTickEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketDataTickRepository extends JpaRepository<MarketDataTickEntity, Long> {
    Optional<MarketDataTickEntity> findFirstByInstrumentIdOrderByReceivedAtDesc(String instrumentId);
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/InstrumentRequest.java', `
package com.example.banking.marketdata.api;

import com.example.banking.domain.model.InstrumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InstrumentRequest(
        @NotBlank String id,
        @NotBlank String isin,
        @NotBlank String name,
        @NotBlank String issuer,
        @NotNull InstrumentType instrumentType,
        @Positive BigDecimal couponPercent,
        @NotNull LocalDate maturityDate,
        @NotBlank String currency,
        @NotBlank String sector) {
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/InstrumentResponse.java', `
package com.example.banking.marketdata.api;

import com.example.banking.domain.model.InstrumentType;
import com.example.banking.marketdata.domain.InstrumentEntity;
import java.math.BigDecimal;
import java.time.LocalDate;

public record InstrumentResponse(String id, String isin, String name, String issuer, InstrumentType instrumentType,
                                 BigDecimal couponPercent, LocalDate maturityDate, String currency, String sector) {
    public static InstrumentResponse from(InstrumentEntity entity) {
        return new InstrumentResponse(entity.getId(), entity.getIsin(), entity.getName(), entity.getIssuer(),
                entity.getInstrumentType(), entity.getCouponPercent(), entity.getMaturityDate(), entity.getCurrency(), entity.getSector());
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/MarketDataRequest.java', `
package com.example.banking.marketdata.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record MarketDataRequest(
        @NotBlank String instrumentId,
        @Positive BigDecimal bid,
        @Positive BigDecimal ask,
        @Positive BigDecimal yieldPercent,
        @Positive BigDecimal spreadBps) {
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/MarketDataResponse.java', `
package com.example.banking.marketdata.api;

import com.example.banking.marketdata.domain.MarketDataTickEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record MarketDataResponse(String instrumentId, BigDecimal bid, BigDecimal ask, BigDecimal mid,
                                 BigDecimal yieldPercent, BigDecimal spreadBps, Instant receivedAt) {
    public static MarketDataResponse from(MarketDataTickEntity entity) {
        return new MarketDataResponse(entity.getInstrumentId(), entity.getBid(), entity.getAsk(), entity.getMid(),
                entity.getYieldPercent(), entity.getSpreadBps(), entity.getReceivedAt());
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/PagedResponse.java', `
package com.example.banking.marketdata.api;

import java.util.List;
import org.springframework.data.domain.Page;

public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/messaging/MarketDataPublisher.java', `
package com.example.banking.marketdata.messaging;

import com.example.banking.domain.event.MarketDataTickEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MarketDataPublisher {
    private static final Logger log = LoggerFactory.getLogger(MarketDataPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public MarketDataPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(MarketDataTickEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; market data event retained in database only");
            return;
        }
        kafkaTemplate.send(event.eventType(), event.instrumentId(), event);
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/service/NioMarketFeedReader.java', `
package com.example.banking.marketdata.service;

import com.example.banking.marketdata.api.MarketDataRequest;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class NioMarketFeedReader {
    public List<MarketDataRequest> readCsvFeed(Path path) throws IOException {
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocateDirect(16 * 1024);
            StringBuilder text = new StringBuilder();
            while (channel.read(buffer) != -1) {
                buffer.flip();
                text.append(StandardCharsets.UTF_8.decode(buffer));
                buffer.clear();
            }
            List<MarketDataRequest> ticks = new ArrayList<>();
            for (String line : text.toString().split("\\\\R")) {
                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                String[] parts = line.split(",");
                ticks.add(new MarketDataRequest(parts[0].trim(), new BigDecimal(parts[1].trim()),
                        new BigDecimal(parts[2].trim()), new BigDecimal(parts[3].trim()), new BigDecimal(parts[4].trim())));
            }
            return ticks;
        }
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/service/MarketDataService.java', `
package com.example.banking.marketdata.service;

import com.example.banking.domain.event.MarketDataTickEvent;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.marketdata.api.InstrumentRequest;
import com.example.banking.marketdata.api.MarketDataRequest;
import com.example.banking.marketdata.domain.InstrumentEntity;
import com.example.banking.marketdata.domain.MarketDataTickEntity;
import com.example.banking.marketdata.messaging.MarketDataPublisher;
import com.example.banking.marketdata.repository.InstrumentRepository;
import com.example.banking.marketdata.repository.MarketDataTickRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketDataService {
    private final InstrumentRepository instruments;
    private final MarketDataTickRepository ticks;
    private final MarketDataPublisher publisher;

    public MarketDataService(InstrumentRepository instruments, MarketDataTickRepository ticks, MarketDataPublisher publisher) {
        this.instruments = instruments;
        this.ticks = ticks;
        this.publisher = publisher;
    }

    @Transactional
    public InstrumentEntity createInstrument(InstrumentRequest request) {
        return instruments.save(new InstrumentEntity(request.id(), request.isin(), request.name(), request.issuer(),
                request.instrumentType(), request.couponPercent(), request.maturityDate(), request.currency(), request.sector()));
    }

    @Transactional
    public MarketDataTickEntity ingest(MarketDataRequest request, String correlationId) {
        if (!instruments.existsById(request.instrumentId())) {
            throw new NotFoundException("Instrument not found: " + request.instrumentId());
        }
        MarketDataTickEntity tick = ticks.save(new MarketDataTickEntity(request.instrumentId(), request.bid(), request.ask(),
                request.yieldPercent(), request.spreadBps(), Instant.now()));
        publisher.publish(new MarketDataTickEvent(UUID.randomUUID().toString(), request.instrumentId(), correlationId,
                tick.getReceivedAt(), request.instrumentId(), tick.getBid(), tick.getAsk(), tick.getMid(),
                tick.getYieldPercent(), tick.getSpreadBps()));
        return tick;
    }

    @Transactional(readOnly = true)
    @Cacheable("marketDataSnapshot")
    public MarketDataTickEntity latest(String instrumentId) {
        return ticks.findFirstByInstrumentIdOrderByReceivedAtDesc(instrumentId)
                .orElseThrow(() -> new NotFoundException("No market data for instrument: " + instrumentId));
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/InstrumentController.java', `
package com.example.banking.marketdata.api;

import com.example.banking.marketdata.repository.InstrumentRepository;
import com.example.banking.marketdata.service.MarketDataService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/instruments")
public class InstrumentController {
    private final InstrumentRepository instruments;
    private final MarketDataService service;

    public InstrumentController(InstrumentRepository instruments, MarketDataService service) {
        this.instruments = instruments;
        this.service = service;
    }

    @GetMapping
    public PagedResponse<InstrumentResponse> list(@RequestParam(required = false) String issuer, Pageable pageable) {
        var page = issuer == null || issuer.isBlank()
                ? instruments.findAll(pageable)
                : instruments.findByIssuerContainingIgnoreCase(issuer, pageable);
        return PagedResponse.from(page.map(InstrumentResponse::from));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InstrumentResponse create(@Valid @RequestBody InstrumentRequest request) {
        return InstrumentResponse.from(service.createInstrument(request));
    }
}
`);

write('market-data-service/src/main/java/com/example/banking/marketdata/api/MarketDataController.java', `
package com.example.banking.marketdata.api;

import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.marketdata.service.MarketDataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market-data")
public class MarketDataController {
    private final MarketDataService service;

    public MarketDataController(MarketDataService service) {
        this.service = service;
    }

    @GetMapping("/{instrumentId}")
    public MarketDataResponse latest(@PathVariable String instrumentId) {
        return MarketDataResponse.from(service.latest(instrumentId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarketDataResponse ingest(@Valid @RequestBody MarketDataRequest request,
                                     @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return MarketDataResponse.from(service.ingest(request, correlationId));
    }
}
`);

// RFQ service
write('rfq-service/src/main/resources/application.yml', appYml('rfq-service', 8082));
write('rfq-service/src/main/resources/db/migration/V1__rfq_schema.sql', `
CREATE TABLE rfqs (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    side VARCHAR(10) NOT NULL,
    notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE quotes (
    id VARCHAR(64) PRIMARY KEY,
    rfq_id VARCHAR(64) NOT NULL,
    trader_id VARCHAR(80) NOT NULL,
    quote_price NUMERIC(18,6) NOT NULL,
    spread_bps NUMERIC(10,4) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    aggregate_id VARCHAR(64) NOT NULL,
    topic VARCHAR(120) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    published_at TIMESTAMP
);

CREATE INDEX idx_rfqs_client_status ON rfqs(client_id, status);

INSERT INTO rfqs (id, client_id, instrument_id, side, notional, currency, status, created_at, updated_at)
VALUES ('rfq-demo-1', 'client-alpha', 'bond-apple-2029', 'BUY', 1000000.00, 'USD', 'CREATED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`);

write('rfq-service/src/main/java/com/example/banking/rfq/RfqApplication.java', `
package com.example.banking.rfq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class RfqApplication {
    public static void main(String[] args) {
        SpringApplication.run(RfqApplication.class, args);
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/domain/RfqEntity.java', `
package com.example.banking.rfq.domain;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.domain.model.Side;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "rfqs")
public class RfqEntity {
    @Id
    private String id;
    private String clientId;
    private String instrumentId;
    @Enumerated(EnumType.STRING)
    private Side side;
    private BigDecimal notional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private RfqStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    protected RfqEntity() {
    }

    public RfqEntity(String id, String clientId, String instrumentId, Side side, BigDecimal notional, String currency) {
        this.id = id;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.side = side;
        this.notional = notional;
        this.currency = currency;
        this.status = RfqStatus.CREATED;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void markQuoted() { this.status = RfqStatus.QUOTED; this.updatedAt = Instant.now(); }
    public void accept() { this.status = RfqStatus.ACCEPTED; this.updatedAt = Instant.now(); }
    public void reject() { this.status = RfqStatus.REJECTED; this.updatedAt = Instant.now(); }
    public void updateStatus(RfqStatus status) { this.status = status; this.updatedAt = Instant.now(); }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public Side getSide() { return side; }
    public BigDecimal getNotional() { return notional; }
    public String getCurrency() { return currency; }
    public RfqStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/domain/QuoteEntity.java', `
package com.example.banking.rfq.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "quotes")
public class QuoteEntity {
    @Id
    private String id;
    private String rfqId;
    private String traderId;
    private BigDecimal quotePrice;
    private BigDecimal spreadBps;
    private String status;
    private Instant createdAt;

    protected QuoteEntity() {
    }

    public QuoteEntity(String id, String rfqId, String traderId, BigDecimal quotePrice, BigDecimal spreadBps) {
        this.id = id;
        this.rfqId = rfqId;
        this.traderId = traderId;
        this.quotePrice = quotePrice;
        this.spreadBps = spreadBps;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public void accept() { this.status = "ACCEPTED"; }
    public void reject() { this.status = "REJECTED"; }

    public String getId() { return id; }
    public String getRfqId() { return rfqId; }
    public String getTraderId() { return traderId; }
    public BigDecimal getQuotePrice() { return quotePrice; }
    public BigDecimal getSpreadBps() { return spreadBps; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/domain/OutboxEventEntity.java', `
package com.example.banking.rfq.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outbox_events")
public class OutboxEventEntity {
    @Id
    private String id;
    private String aggregateId;
    private String topic;
    private String payload;
    private Instant createdAt;
    private Instant publishedAt;

    protected OutboxEventEntity() {
    }

    public OutboxEventEntity(String id, String aggregateId, String topic, String payload) {
        this.id = id;
        this.aggregateId = aggregateId;
        this.topic = topic;
        this.payload = payload;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getTopic() { return topic; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPublishedAt() { return publishedAt; }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/repository/RfqRepository.java', `
package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.RfqEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqRepository extends JpaRepository<RfqEntity, String> {
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/repository/QuoteRepository.java', `
package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.QuoteEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<QuoteEntity, String> {
    Optional<QuoteEntity> findFirstByRfqIdOrderByCreatedAtDesc(String rfqId);
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/repository/OutboxEventRepository.java', `
package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.OutboxEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, String> {
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/api/RfqRequests.java', `
package com.example.banking.rfq.api;

import com.example.banking.domain.model.Side;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public final class RfqRequests {
    private RfqRequests() {
    }

    public record CreateRfq(@NotBlank String clientId, @NotBlank String instrumentId, @NotNull Side side,
                            @Positive BigDecimal notional, @NotBlank String currency) {
    }

    public record GenerateQuote(@NotBlank String traderId, @Positive BigDecimal quotePrice,
                                @Positive BigDecimal spreadBps) {
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/api/RfqResponse.java', `
package com.example.banking.rfq.api;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.rfq.domain.RfqEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record RfqResponse(String id, String clientId, String instrumentId, Side side, BigDecimal notional,
                          String currency, RfqStatus status, Instant createdAt, Instant updatedAt) {
    public static RfqResponse from(RfqEntity rfq) {
        return new RfqResponse(rfq.getId(), rfq.getClientId(), rfq.getInstrumentId(), rfq.getSide(),
                rfq.getNotional(), rfq.getCurrency(), rfq.getStatus(), rfq.getCreatedAt(), rfq.getUpdatedAt());
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/api/QuoteResponse.java', `
package com.example.banking.rfq.api;

import com.example.banking.rfq.domain.QuoteEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record QuoteResponse(String id, String rfqId, String traderId, BigDecimal quotePrice,
                            BigDecimal spreadBps, String status, Instant createdAt) {
    public static QuoteResponse from(QuoteEntity quote) {
        return new QuoteResponse(quote.getId(), quote.getRfqId(), quote.getTraderId(), quote.getQuotePrice(),
                quote.getSpreadBps(), quote.getStatus(), quote.getCreatedAt());
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/cache/RfqCache.java', `
package com.example.banking.rfq.cache;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RfqCache {
    private static final Logger log = LoggerFactory.getLogger(RfqCache.class);
    private final Map<String, String> localCache = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;

    public RfqCache(ObjectProvider<StringRedisTemplate> redisTemplate) {
        this.redisTemplate = redisTemplate.getIfAvailable();
    }

    public void putActive(String rfqId, String status) {
        localCache.put(rfqId, status);
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set("rfq:active:" + rfqId, status);
            } catch (RuntimeException ex) {
                log.warn("Redis unavailable; retained active RFQ in local cache");
            }
        }
    }

    public Optional<String> get(String rfqId) {
        if (redisTemplate != null) {
            try {
                String value = redisTemplate.opsForValue().get("rfq:active:" + rfqId);
                if (value != null) {
                    log.info("cache hit for rfq {}", rfqId);
                    return Optional.of(value);
                }
            } catch (RuntimeException ex) {
                log.warn("Redis unavailable on cache get");
            }
        }
        return Optional.ofNullable(localCache.get(rfqId));
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/service/RfqEventPublisher.java', `
package com.example.banking.rfq.service;

import com.example.banking.domain.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class RfqEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(RfqEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public RfqEventPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(DomainEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; outbox still records {}", event.eventType());
            return;
        }
        kafkaTemplate.send(event.eventType(), event.aggregateId(), event);
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/service/RfqService.java', `
package com.example.banking.rfq.service;

import com.example.banking.domain.event.DomainEventFactory;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.RfqStatus;
import com.example.banking.rfq.api.RfqRequests.CreateRfq;
import com.example.banking.rfq.api.RfqRequests.GenerateQuote;
import com.example.banking.rfq.cache.RfqCache;
import com.example.banking.rfq.domain.OutboxEventEntity;
import com.example.banking.rfq.domain.QuoteEntity;
import com.example.banking.rfq.domain.RfqEntity;
import com.example.banking.rfq.repository.OutboxEventRepository;
import com.example.banking.rfq.repository.QuoteRepository;
import com.example.banking.rfq.repository.RfqRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RfqService {
    private final RfqRepository rfqs;
    private final QuoteRepository quotes;
    private final OutboxEventRepository outbox;
    private final RfqCache cache;
    private final RfqEventPublisher publisher;

    public RfqService(RfqRepository rfqs, QuoteRepository quotes, OutboxEventRepository outbox,
                      RfqCache cache, RfqEventPublisher publisher) {
        this.rfqs = rfqs;
        this.quotes = quotes;
        this.outbox = outbox;
        this.cache = cache;
        this.publisher = publisher;
    }

    @Transactional
    public RfqEntity create(CreateRfq request, String correlationId) {
        String id = "rfq-" + UUID.randomUUID();
        RfqEntity rfq = rfqs.save(new RfqEntity(id, request.clientId(), request.instrumentId(), request.side(),
                request.notional(), request.currency()));
        cache.putActive(id, rfq.getStatus().name());
        var event = DomainEventFactory.rfqCreated(id, correlationId, request.clientId(), request.instrumentId(),
                request.side(), request.notional());
        outbox.save(new OutboxEventEntity(event.eventId(), id, event.eventType(), event.toString()));
        publisher.publish(event);
        return rfq;
    }

    @Transactional
    public QuoteEntity quote(String rfqId, GenerateQuote request, String correlationId) {
        RfqEntity rfq = get(rfqId);
        QuoteEntity quote = quotes.save(new QuoteEntity("quote-" + UUID.randomUUID(), rfqId, request.traderId(),
                request.quotePrice(), request.spreadBps()));
        rfq.markQuoted();
        cache.putActive(rfqId, rfq.getStatus().name());
        var event = DomainEventFactory.rfqQuoted(rfqId, correlationId, request.traderId(), request.quotePrice(), request.spreadBps());
        outbox.save(new OutboxEventEntity(event.eventId(), rfqId, event.eventType(), event.toString()));
        publisher.publish(event);
        return quote;
    }

    @Transactional
    public RfqEntity accept(String rfqId, String correlationId) {
        RfqEntity rfq = get(rfqId);
        QuoteEntity quote = quotes.findFirstByRfqIdOrderByCreatedAtDesc(rfqId)
                .orElseThrow(() -> new NotFoundException("Quote not found for RFQ: " + rfqId));
        quote.accept();
        rfq.accept();
        cache.putActive(rfqId, rfq.getStatus().name());
        var event = DomainEventFactory.rfqAccepted(rfqId, correlationId, quote.getId(), rfq.getClientId());
        outbox.save(new OutboxEventEntity(event.eventId(), rfqId, event.eventType(), event.toString()));
        publisher.publish(event);
        return rfq;
    }

    @Transactional
    public RfqEntity updateStatus(String rfqId, RfqStatus status) {
        RfqEntity rfq = get(rfqId);
        rfq.updateStatus(status);
        cache.putActive(rfqId, status.name());
        return rfq;
    }

    @Transactional(readOnly = true)
    public RfqEntity get(String rfqId) {
        return rfqs.findById(rfqId).orElseThrow(() -> new NotFoundException("RFQ not found: " + rfqId));
    }
}
`);

write('rfq-service/src/main/java/com/example/banking/rfq/api/RfqController.java', `
package com.example.banking.rfq.api;

import com.example.banking.domain.model.RfqStatus;
import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.rfq.api.RfqRequests.CreateRfq;
import com.example.banking.rfq.api.RfqRequests.GenerateQuote;
import com.example.banking.rfq.service.RfqService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rfqs")
public class RfqController {
    private final RfqService service;

    public RfqController(RfqService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RfqResponse create(@Valid @RequestBody CreateRfq request,
                              @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return RfqResponse.from(service.create(request, correlationId));
    }

    @GetMapping("/{rfqId}")
    public RfqResponse get(@PathVariable String rfqId) {
        return RfqResponse.from(service.get(rfqId));
    }

    @PatchMapping("/{rfqId}/status")
    public RfqResponse status(@PathVariable String rfqId, @RequestParam RfqStatus status) {
        return RfqResponse.from(service.updateStatus(rfqId, status));
    }

    @PostMapping("/{rfqId}/quote")
    public QuoteResponse quote(@PathVariable String rfqId, @Valid @RequestBody GenerateQuote request,
                               @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return QuoteResponse.from(service.quote(rfqId, request, correlationId));
    }

    @PostMapping("/{rfqId}/accept")
    public RfqResponse accept(@PathVariable String rfqId,
                              @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return RfqResponse.from(service.accept(rfqId, correlationId));
    }
}
`);

// OMS service
write('oms-service/src/main/resources/application.yml', appYml('oms-service', 8083));
write('oms-service/src/main/resources/db/migration/V1__oms_schema.sql', `
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    rfq_id VARCHAR(64) NOT NULL,
    quote_id VARCHAR(64),
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    side VARCHAR(10) NOT NULL,
    notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL
);

CREATE TABLE executions (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    executed_price NUMERIC(18,6) NOT NULL,
    executed_quantity NUMERIC(18,2) NOT NULL,
    venue VARCHAR(80) NOT NULL,
    executed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_orders_client_status ON orders(client_id, status);
INSERT INTO orders (id, rfq_id, quote_id, client_id, instrument_id, side, notional, currency, status, idempotency_key, created_at, updated_at, version)
VALUES ('order-demo-1', 'rfq-demo-1', 'quote-demo-1', 'client-alpha', 'bond-apple-2029', 'BUY', 1000000.00, 'USD', 'EXECUTED', 'demo-key-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);
`);

write('oms-service/src/main/java/com/example/banking/oms/OmsApplication.java', `
package com.example.banking.oms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class OmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(OmsApplication.class, args);
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/domain/OrderEntity.java', `
package com.example.banking.oms.domain;

import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.Side;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    private String id;
    private String rfqId;
    private String quoteId;
    private String clientId;
    private String instrumentId;
    @Enumerated(EnumType.STRING)
    private Side side;
    private BigDecimal notional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    private String idempotencyKey;
    private Instant createdAt;
    private Instant updatedAt;
    @Version
    private long version;

    protected OrderEntity() {
    }

    public OrderEntity(String id, String rfqId, String quoteId, String clientId, String instrumentId, Side side,
                       BigDecimal notional, String currency, String idempotencyKey) {
        this.id = id;
        this.rfqId = rfqId;
        this.quoteId = quoteId;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.side = side;
        this.notional = notional;
        this.currency = currency;
        this.idempotencyKey = idempotencyKey;
        this.status = OrderStatus.NEW;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void status(OrderStatus status) { this.status = status; this.updatedAt = Instant.now(); }

    public String getId() { return id; }
    public String getRfqId() { return rfqId; }
    public String getQuoteId() { return quoteId; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public Side getSide() { return side; }
    public BigDecimal getNotional() { return notional; }
    public String getCurrency() { return currency; }
    public OrderStatus getStatus() { return status; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/domain/ExecutionEntity.java', `
package com.example.banking.oms.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "executions")
public class ExecutionEntity {
    @Id
    private String id;
    private String orderId;
    private BigDecimal executedPrice;
    private BigDecimal executedQuantity;
    private String venue;
    private Instant executedAt;

    protected ExecutionEntity() {
    }

    public ExecutionEntity(String id, String orderId, BigDecimal executedPrice, BigDecimal executedQuantity, String venue) {
        this.id = id;
        this.orderId = orderId;
        this.executedPrice = executedPrice;
        this.executedQuantity = executedQuantity;
        this.venue = venue;
        this.executedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getOrderId() { return orderId; }
    public BigDecimal getExecutedPrice() { return executedPrice; }
    public BigDecimal getExecutedQuantity() { return executedQuantity; }
    public String getVenue() { return venue; }
    public Instant getExecutedAt() { return executedAt; }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/repository/OrderRepository.java', `
package com.example.banking.oms.repository;

import com.example.banking.oms.domain.OrderEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    Optional<OrderEntity> findByIdempotencyKey(String idempotencyKey);
}
`);

write('oms-service/src/main/java/com/example/banking/oms/repository/ExecutionRepository.java', `
package com.example.banking.oms.repository;

import com.example.banking.oms.domain.ExecutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionRepository extends JpaRepository<ExecutionEntity, String> {
}
`);

write('oms-service/src/main/java/com/example/banking/oms/api/OrderRequests.java', `
package com.example.banking.oms.api;

import com.example.banking.domain.model.Side;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public final class OrderRequests {
    private OrderRequests() {
    }

    public record CreateOrder(@NotBlank String rfqId, String quoteId, @NotBlank String clientId,
                              @NotBlank String instrumentId, @NotNull Side side, @Positive BigDecimal notional,
                              @NotBlank String currency, @NotBlank String idempotencyKey) {
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/api/OrderResponse.java', `
package com.example.banking.oms.api;

import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.Side;
import com.example.banking.oms.domain.OrderEntity;
import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(String id, String rfqId, String quoteId, String clientId, String instrumentId,
                            Side side, BigDecimal notional, String currency, OrderStatus status,
                            String idempotencyKey, Instant createdAt, Instant updatedAt, long version) {
    public static OrderResponse from(OrderEntity order) {
        return new OrderResponse(order.getId(), order.getRfqId(), order.getQuoteId(), order.getClientId(),
                order.getInstrumentId(), order.getSide(), order.getNotional(), order.getCurrency(), order.getStatus(),
                order.getIdempotencyKey(), order.getCreatedAt(), order.getUpdatedAt(), order.getVersion());
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/service/OrderEventPublisher.java', `
package com.example.banking.oms.service;

import com.example.banking.domain.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventPublisher(ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate.getIfAvailable();
    }

    public void publish(DomainEvent event) {
        if (kafkaTemplate == null) {
            log.info("KafkaTemplate unavailable; skipped publish {}", event.eventType());
            return;
        }
        kafkaTemplate.send(event.eventType(), event.aggregateId(), event);
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/service/OrderService.java', `
package com.example.banking.oms.service;

import com.example.banking.domain.event.DomainEventFactory;
import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.Money;
import com.example.banking.domain.model.OrderStatus;
import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.domain.order.OrderLifecycleStateMachine;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.DuplicateOrderRule;
import com.example.banking.domain.risk.InstrumentRestrictionRule;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import com.example.banking.oms.api.OrderRequests.CreateOrder;
import com.example.banking.oms.domain.ExecutionEntity;
import com.example.banking.oms.domain.OrderEntity;
import com.example.banking.oms.repository.ExecutionRepository;
import com.example.banking.oms.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final ExecutionRepository executions;
    private final OrderEventPublisher publisher;
    private final OrderLifecycleStateMachine lifecycle = new OrderLifecycleStateMachine();
    private final CompositeRiskEngine riskEngine = new CompositeRiskEngine(List.of(
            new KillSwitchRule(), new InstrumentRestrictionRule(), new DuplicateOrderRule(), new MaxOrderNotionalRule()));

    public OrderService(OrderRepository orders, ExecutionRepository executions, OrderEventPublisher publisher) {
        this.orders = orders;
        this.executions = executions;
        this.publisher = publisher;
    }

    @Transactional
    public OrderEntity create(CreateOrder request, String correlationId) {
        var existing = orders.findByIdempotencyKey(request.idempotencyKey());
        if (existing.isPresent()) {
            return existing.get();
        }

        String orderId = "order-" + UUID.randomUUID();
        OrderEntity order = orders.save(new OrderEntity(orderId, request.rfqId(), request.quoteId(), request.clientId(),
                request.instrumentId(), request.side(), request.notional(), request.currency(), request.idempotencyKey()));
        publisher.publish(DomainEventFactory.orderCreated(orderId, correlationId, request.rfqId(), request.clientId(),
                request.instrumentId(), request.side(), request.notional()));

        order.status(lifecycle.transition(order.getStatus(), OrderStatus.VALIDATED));
        var decision = riskEngine.evaluate(new RiskContext(request.clientId(), request.instrumentId(),
                new Money(request.notional(), request.currency()), Money.usd("0"), Money.usd("5000000"),
                false, false, false));
        if (decision.status() == RiskDecisionStatus.REJECTED) {
            order.status(lifecycle.transition(order.getStatus(), OrderStatus.RISK_REJECTED));
            publisher.publish(DomainEventFactory.riskRejected(orderId, correlationId, request.clientId(), String.join("; ", decision.reasons())));
            return order;
        }

        order.status(lifecycle.transition(order.getStatus(), OrderStatus.ACCEPTED));
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.ROUTED));
        ExecutionEntity execution = executions.save(new ExecutionEntity("exec-" + UUID.randomUUID(), orderId,
                new BigDecimal("99.875"), request.notional(), "SIMULATED_FIX_GATEWAY"));
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.EXECUTED));
        publisher.publish(DomainEventFactory.orderExecuted(orderId, correlationId, execution.getId(),
                execution.getExecutedPrice(), execution.getExecutedQuantity()));
        return order;
    }

    @Transactional
    public OrderEntity cancel(String orderId) {
        OrderEntity order = get(orderId);
        order.status(lifecycle.transition(order.getStatus(), OrderStatus.CANCELLED));
        return order;
    }

    @Transactional(readOnly = true)
    public OrderEntity get(String orderId) {
        return orders.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/messaging/RfqEventConsumer.java', `
package com.example.banking.oms.messaging;

import com.example.banking.domain.event.RfqAcceptedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class RfqEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(RfqEventConsumer.class);

    @KafkaListener(topics = "rfq.accepted", groupId = "oms-service", autoStartup = "false")
    public void onAccepted(RfqAcceptedEvent event) {
        log.info("Received RFQ accepted event {}; demo keeps explicit order creation for clarity", event.aggregateId());
    }
}
`);

write('oms-service/src/main/java/com/example/banking/oms/api/OrderController.java', `
package com.example.banking.oms.api;

import com.example.banking.observability.CorrelationIdFilter;
import com.example.banking.oms.api.OrderRequests.CreateOrder;
import com.example.banking.oms.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrder request,
                                @RequestHeader(value = CorrelationIdFilter.HEADER, required = false) String correlationId) {
        return OrderResponse.from(service.create(request, correlationId));
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable String orderId) {
        return OrderResponse.from(service.get(orderId));
    }

    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancel(@PathVariable String orderId) {
        return OrderResponse.from(service.cancel(orderId));
    }
}
`);

// Risk service
write('risk-service/src/main/resources/application.yml', appYml('risk-service', 8084));
write('risk-service/src/main/resources/db/migration/V1__risk_schema.sql', `
CREATE TABLE risk_limits (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    daily_limit NUMERIC(18,2) NOT NULL,
    current_exposure NUMERIC(18,2) NOT NULL,
    restricted_instruments VARCHAR(1000) NOT NULL
);

CREATE TABLE risk_decisions (
    id VARCHAR(64) PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL,
    instrument_id VARCHAR(64) NOT NULL,
    order_notional NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    reasons VARCHAR(2000),
    decided_at TIMESTAMP NOT NULL
);

INSERT INTO risk_limits (id, client_id, currency, daily_limit, current_exposure, restricted_instruments)
VALUES ('limit-client-alpha', 'client-alpha', 'USD', 5000000.00, 1000000.00, 'bond-restricted-1');
`);

write('risk-service/src/main/java/com/example/banking/risk/RiskApplication.java', `
package com.example.banking.risk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class RiskApplication {
    public static void main(String[] args) {
        SpringApplication.run(RiskApplication.class, args);
    }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/domain/RiskLimitEntity.java', `
package com.example.banking.risk.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "risk_limits")
public class RiskLimitEntity {
    @Id
    private String id;
    private String clientId;
    private String currency;
    private BigDecimal dailyLimit;
    private BigDecimal currentExposure;
    private String restrictedInstruments;

    protected RiskLimitEntity() {
    }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getCurrency() { return currency; }
    public BigDecimal getDailyLimit() { return dailyLimit; }
    public BigDecimal getCurrentExposure() { return currentExposure; }
    public Set<String> restrictedInstrumentSet() {
        if (restrictedInstruments == null || restrictedInstruments.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(restrictedInstruments.split(",")).map(String::trim).collect(Collectors.toSet());
    }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/domain/RiskDecisionEntity.java', `
package com.example.banking.risk.domain;

import com.example.banking.domain.model.RiskDecisionStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "risk_decisions")
public class RiskDecisionEntity {
    @Id
    private String id;
    private String clientId;
    private String instrumentId;
    private BigDecimal orderNotional;
    private String currency;
    @Enumerated(EnumType.STRING)
    private RiskDecisionStatus status;
    private String reasons;
    private Instant decidedAt;

    protected RiskDecisionEntity() {
    }

    public RiskDecisionEntity(String id, String clientId, String instrumentId, BigDecimal orderNotional,
                              String currency, RiskDecisionStatus status, String reasons) {
        this.id = id;
        this.clientId = clientId;
        this.instrumentId = instrumentId;
        this.orderNotional = orderNotional;
        this.currency = currency;
        this.status = status;
        this.reasons = reasons;
        this.decidedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getClientId() { return clientId; }
    public String getInstrumentId() { return instrumentId; }
    public BigDecimal getOrderNotional() { return orderNotional; }
    public String getCurrency() { return currency; }
    public RiskDecisionStatus getStatus() { return status; }
    public String getReasons() { return reasons; }
    public Instant getDecidedAt() { return decidedAt; }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/repository/RiskLimitRepository.java', `
package com.example.banking.risk.repository;

import com.example.banking.risk.domain.RiskLimitEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskLimitRepository extends JpaRepository<RiskLimitEntity, String> {
    Optional<RiskLimitEntity> findByClientId(String clientId);
}
`);

write('risk-service/src/main/java/com/example/banking/risk/repository/RiskDecisionRepository.java', `
package com.example.banking.risk.repository;

import com.example.banking.risk.domain.RiskDecisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskDecisionRepository extends JpaRepository<RiskDecisionEntity, String> {
}
`);

write('risk-service/src/main/java/com/example/banking/risk/api/RiskCheckRequest.java', `
package com.example.banking.risk.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record RiskCheckRequest(@NotBlank String clientId, @NotBlank String instrumentId,
                               @Positive BigDecimal orderNotional, @NotBlank String currency,
                               String idempotencyKey) {
}
`);

write('risk-service/src/main/java/com/example/banking/risk/api/KillSwitchRequest.java', `
package com.example.banking.risk.api;

public record KillSwitchRequest(boolean enabled) {
}
`);

write('risk-service/src/main/java/com/example/banking/risk/api/RiskDecisionResponse.java', `
package com.example.banking.risk.api;

import com.example.banking.domain.model.RiskDecisionStatus;
import com.example.banking.risk.domain.RiskDecisionEntity;
import java.time.Instant;
import java.util.List;

public record RiskDecisionResponse(String id, RiskDecisionStatus status, List<String> reasons, Instant decidedAt) {
    public static RiskDecisionResponse from(RiskDecisionEntity entity) {
        List<String> reasons = entity.getReasons() == null || entity.getReasons().isBlank()
                ? List.of()
                : List.of(entity.getReasons().split("; "));
        return new RiskDecisionResponse(entity.getId(), entity.getStatus(), reasons, entity.getDecidedAt());
    }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/service/RiskService.java', `
package com.example.banking.risk.service;

import com.example.banking.domain.exception.NotFoundException;
import com.example.banking.domain.model.Money;
import com.example.banking.domain.risk.CompositeRiskEngine;
import com.example.banking.domain.risk.DuplicateOrderRule;
import com.example.banking.domain.risk.InstrumentRestrictionRule;
import com.example.banking.domain.risk.KillSwitchRule;
import com.example.banking.domain.risk.MaxOrderNotionalRule;
import com.example.banking.domain.risk.RiskContext;
import com.example.banking.risk.api.RiskCheckRequest;
import com.example.banking.risk.domain.RiskDecisionEntity;
import com.example.banking.risk.repository.RiskDecisionRepository;
import com.example.banking.risk.repository.RiskLimitRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RiskService {
    private final RiskLimitRepository limits;
    private final RiskDecisionRepository decisions;
    private final AtomicBoolean killSwitch = new AtomicBoolean(false);
    private final Set<String> seenIdempotencyKeys = ConcurrentHashMap.newKeySet();
    private final CompositeRiskEngine engine = new CompositeRiskEngine(List.of(
            new KillSwitchRule(), new InstrumentRestrictionRule(), new DuplicateOrderRule(), new MaxOrderNotionalRule()));

    public RiskService(RiskLimitRepository limits, RiskDecisionRepository decisions) {
        this.limits = limits;
        this.decisions = decisions;
    }

    @Transactional
    public RiskDecisionEntity check(RiskCheckRequest request) {
        var limit = limits.findByClientId(request.clientId())
                .orElseThrow(() -> new NotFoundException("Risk limit not found for client: " + request.clientId()));
        boolean duplicate = request.idempotencyKey() != null && !seenIdempotencyKeys.add(request.idempotencyKey());
        var decision = engine.evaluate(new RiskContext(request.clientId(), request.instrumentId(),
                new Money(request.orderNotional(), request.currency()),
                new Money(limit.getCurrentExposure(), limit.getCurrency()),
                new Money(limit.getDailyLimit(), limit.getCurrency()),
                limit.restrictedInstrumentSet().contains(request.instrumentId()),
                duplicate,
                killSwitch.get()));
        return decisions.save(new RiskDecisionEntity("risk-" + UUID.randomUUID(), request.clientId(), request.instrumentId(),
                request.orderNotional(), request.currency(), decision.status(), String.join("; ", decision.reasons())));
    }

    public boolean setKillSwitch(boolean enabled) {
        killSwitch.set(enabled);
        return killSwitch.get();
    }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/api/RiskController.java', `
package com.example.banking.risk.api;

import com.example.banking.risk.service.RiskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/risk")
public class RiskController {
    private final RiskService service;

    public RiskController(RiskService service) {
        this.service = service;
    }

    @PostMapping("/check")
    public RiskDecisionResponse check(@Valid @RequestBody RiskCheckRequest request) {
        return RiskDecisionResponse.from(service.check(request));
    }

    @PostMapping("/kill-switch")
    public KillSwitchRequest killSwitch(@RequestBody KillSwitchRequest request) {
        return new KillSwitchRequest(service.setKillSwitch(request.enabled()));
    }
}
`);

write('risk-service/src/main/java/com/example/banking/risk/messaging/RiskEventConsumer.java', `
package com.example.banking.risk.messaging;

import com.example.banking.domain.event.OrderCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class RiskEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(RiskEventConsumer.class);

    @KafkaListener(topics = "order.created", groupId = "risk-service", autoStartup = "false")
    public void onOrderCreated(OrderCreatedEvent event) {
        log.info("Received order event {} for asynchronous risk analytics", event.aggregateId());
    }
}
`);

// FIX gateway
write('fix-gateway-simulator/src/main/resources/application.yml', `
spring:
  application:
    name: fix-gateway-simulator
server:
  port: \${SERVER_PORT:8085}
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
`);

write('fix-gateway-simulator/src/main/java/com/example/banking/fix/FixGatewayApplication.java', `
package com.example.banking.fix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class FixGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(FixGatewayApplication.class, args);
    }
}
`);

write('fix-gateway-simulator/src/main/java/com/example/banking/fix/domain/FixMessage.java', `
package com.example.banking.fix.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class FixMessage {
    private final Map<Integer, String> tags;

    public FixMessage(Map<Integer, String> tags) {
        this.tags = new LinkedHashMap<>(tags);
    }

    public Optional<String> value(int tag) {
        return Optional.ofNullable(tags.get(tag));
    }

    public String required(int tag) {
        return value(tag).orElseThrow(() -> new IllegalArgumentException("Missing FIX tag " + tag));
    }

    public String messageType() {
        return required(35);
    }

    public Map<Integer, String> tags() {
        return Map.copyOf(tags);
    }
}
`);

write('fix-gateway-simulator/src/main/java/com/example/banking/fix/domain/FixParser.java', `
package com.example.banking.fix.domain;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FixParser {
    public FixMessage parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("FIX message is required");
        }
        Map<Integer, String> tags = new LinkedHashMap<>();
        String normalized = raw.replace('\\u0001', '|');
        for (String token : normalized.split("\\\\|")) {
            if (token.isBlank()) {
                continue;
            }
            int eq = token.indexOf('=');
            if (eq <= 0) {
                throw new IllegalArgumentException("Invalid FIX token: " + token);
            }
            tags.put(Integer.parseInt(token.substring(0, eq)), token.substring(eq + 1));
        }
        if (!tags.containsKey(35)) {
            throw new IllegalArgumentException("FIX message type tag 35 is required");
        }
        return new FixMessage(tags);
    }

    public String newOrderSingle(String clientOrderId, String symbol, String side, String quantity, String price) {
        return "8=FIX.4.4|35=D|11=" + clientOrderId + "|55=" + symbol + "|54=" + side + "|38=" + quantity + "|44=" + price + "|";
    }

    public String executionReport(String clientOrderId, String orderId, String execType, String ordStatus) {
        return "8=FIX.4.4|35=8|11=" + clientOrderId + "|37=" + orderId + "|150=" + execType + "|39=" + ordStatus + "|";
    }

    public String quoteRequest(String rfqId, String symbol) {
        return "8=FIX.4.4|35=R|131=" + rfqId + "|55=" + symbol + "|";
    }

    public String quote(String quoteId, String rfqId, String bid, String ask) {
        return "8=FIX.4.4|35=S|117=" + quoteId + "|131=" + rfqId + "|132=" + bid + "|133=" + ask + "|";
    }
}
`);

write('fix-gateway-simulator/src/main/java/com/example/banking/fix/api/FixController.java', `
package com.example.banking.fix.api;

import com.example.banking.fix.domain.FixMessage;
import com.example.banking.fix.domain.FixParser;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fix")
public class FixController {
    private final FixParser parser;

    public FixController(FixParser parser) {
        this.parser = parser;
    }

    public record ParseRequest(@NotBlank String message) {
    }

    @PostMapping("/parse")
    public Map<Integer, String> parse(@RequestBody ParseRequest request) {
        FixMessage message = parser.parse(request.message());
        return message.tags();
    }

    @GetMapping("/new-order-single")
    public String newOrder(@RequestParam String clientOrderId, @RequestParam String symbol,
                           @RequestParam(defaultValue = "1") String side,
                           @RequestParam(defaultValue = "1000000") String quantity,
                           @RequestParam(defaultValue = "99.875") String price) {
        return parser.newOrderSingle(clientOrderId, symbol, side, quantity, price);
    }
}
`);

write('fix-gateway-simulator/src/test/java/com/example/banking/fix/FixParserTest.java', `
package com.example.banking.fix;

import com.example.banking.fix.domain.FixParser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FixParserTest {
    @Test
    void parsesNewOrderSingle() {
        var message = new FixParser().parse("8=FIX.4.4|35=D|11=abc|55=US037833AK68|54=1|38=1000000|44=99.875|");
        assertEquals("D", message.messageType());
        assertEquals("abc", message.required(11));
    }

    @Test
    void requiresMessageType() {
        assertThrows(IllegalArgumentException.class, () -> new FixParser().parse("8=FIX.4.4|11=abc|"));
    }
}
`);

// Low latency lab
write('low-latency-lab/src/main/java/com/example/banking/latency/RingBuffer.java', `
package com.example.banking.latency;

import java.util.concurrent.atomic.AtomicLong;

public class RingBuffer<T> {
    private final Object[] slots;
    private final int mask;
    private final AtomicLong sequence = new AtomicLong(-1);

    public RingBuffer(int powerOfTwoCapacity) {
        if (Integer.bitCount(powerOfTwoCapacity) != 1) {
            throw new IllegalArgumentException("capacity must be a power of two");
        }
        this.slots = new Object[powerOfTwoCapacity];
        this.mask = powerOfTwoCapacity - 1;
    }

    public long publish(T event) {
        long seq = sequence.incrementAndGet();
        slots[(int) seq & mask] = event;
        return seq;
    }

    @SuppressWarnings("unchecked")
    public T get(long seq) {
        return (T) slots[(int) seq & mask];
    }

    public long cursor() {
        return sequence.get();
    }
}
`);

write('low-latency-lab/src/main/java/com/example/banking/latency/FileBackedEventJournal.java', `
package com.example.banking.latency;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FileBackedEventJournal implements AutoCloseable {
    private final FileChannel channel;

    public FileBackedEventJournal(Path path) throws IOException {
        this.channel = FileChannel.open(path, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.APPEND);
    }

    public void append(String event) throws IOException {
        byte[] bytes = (event + System.lineSeparator()).getBytes(StandardCharsets.UTF_8);
        channel.write(ByteBuffer.wrap(bytes));
    }

    @Override
    public void close() throws IOException {
        channel.close();
    }
}
`);

write('low-latency-lab/src/main/java/com/example/banking/latency/ThreadingModelDemo.java', `
package com.example.banking.latency;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadingModelDemo {
    public List<String> priceInParallel(List<String> instruments) {
        try (ExecutorService executor = Executors.newFixedThreadPool(4)) {
            return instruments.stream()
                    .map(instrument -> CompletableFuture.supplyAsync(() -> "priced:" + instrument, executor))
                    .map(CompletableFuture::join)
                    .toList();
        }
    }

    public List<String> priceWithVirtualThreads(List<String> instruments) {
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            return instruments.stream()
                    .map(instrument -> CompletableFuture.supplyAsync(() -> "priced:" + instrument, executor))
                    .map(CompletableFuture::join)
                    .toList();
        }
    }
}
`);

write('low-latency-lab/src/main/java/com/example/banking/latency/JmmVisibilityDemo.java', `
package com.example.banking.latency;

public class JmmVisibilityDemo {
    private volatile boolean running = true;
    private long counter;

    public void runLoop() {
        while (running) {
            counter++;
        }
    }

    public void stop() {
        running = false;
    }

    public long counter() {
        return counter;
    }
}
`);

write('low-latency-lab/src/main/java/com/example/banking/latency/LowLatencyLab.java', `
package com.example.banking.latency;

public class LowLatencyLab {
    public static void main(String[] args) {
        RingBuffer<String> ring = new RingBuffer<>(1024);
        long seq = ring.publish("market-data-tick");
        System.out.println("Published sequence " + seq + " value=" + ring.get(seq));
    }
}
`);

write('low-latency-lab/src/test/java/com/example/banking/latency/RingBufferTest.java', `
package com.example.banking.latency;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RingBufferTest {
    @Test
    void storesLatestEventBySequence() {
        RingBuffer<String> buffer = new RingBuffer<>(8);
        long seq = buffer.publish("tick-1");
        assertEquals("tick-1", buffer.get(seq));
    }
}
`);

// API gateway
write('api-gateway/src/main/resources/application.yml', `
spring:
  application:
    name: api-gateway
server:
  port: \${SERVER_PORT:8080}
security:
  jwt:
    secret: \${DEMO_JWT_SECRET:local-demo-secret-change-me-with-at-least-32-characters}
    ttl-seconds: 3600
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
springdoc:
  swagger-ui:
    path: /swagger-ui.html
`);

write('api-gateway/src/main/java/com/example/banking/gateway/ApiGatewayApplication.java', `
package com.example.banking.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/security/JwtProperties.java', `
package com.example.banking.gateway.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(String secret, long ttlSeconds) {
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/security/JwtService.java', `
package com.example.banking.gateway.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtProperties properties;
    private final ObjectMapper objectMapper;

    public JwtService(JwtProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String issue(String username, List<String> roles) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            long exp = Instant.now().plusSeconds(properties.ttlSeconds()).getEpochSecond();
            String payload = encodeJson(Map.of("sub", username, "roles", roles, "exp", exp));
            String unsigned = header + "." + payload;
            return unsigned + "." + sign(unsigned);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to issue JWT", ex);
        }
    }

    public Map<String, Object> verify(String token) {
        try {
            String[] parts = token.split("\\\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT");
            }
            String unsigned = parts[0] + "." + parts[1];
            if (!sign(unsigned).equals(parts[2])) {
                throw new IllegalArgumentException("Invalid JWT signature");
            }
            Map<String, Object> payload = objectMapper.readValue(Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
            Number exp = (Number) payload.get("exp");
            if (exp.longValue() < Instant.now().getEpochSecond()) {
                throw new IllegalArgumentException("JWT expired");
            }
            return payload;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid JWT", ex);
        }
    }

    private String encodeJson(Map<String, ?> value) throws Exception {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String unsigned) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(unsigned.getBytes(StandardCharsets.UTF_8)));
    }
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/security/JwtAuthenticationFilter.java', `
package com.example.banking.gateway.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            var payload = jwtService.verify(header.substring(7));
            String username = (String) payload.get("sub");
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) payload.get("roles");
            var authorities = roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(username, null, authorities));
        }
        filterChain.doFilter(request, response);
    }
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/security/SecurityConfig.java', `
package com.example.banking.gateway.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/login", "/actuator/health/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    UserDetailsService userDetailsService(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("admin").password(encoder.encode("password")).roles("ADMIN").build(),
                User.withUsername("trader").password(encoder.encode("password")).roles("TRADER").build(),
                User.withUsername("risk").password(encoder.encode("password")).roles("RISK_MANAGER").build(),
                User.withUsername("support").password(encoder.encode("password")).roles("SUPPORT").build(),
                User.withUsername("readonly").password(encoder.encode("password")).roles("READ_ONLY").build());
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/api/AuthController.java', `
package com.example.banking.gateway.api;

import com.example.banking.gateway.security.JwtProperties;
import com.example.banking.gateway.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties properties;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, JwtProperties properties) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.properties = properties;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LoginResponse(String accessToken, String tokenType, Instant expiresAt) {
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        var roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .toList();
        return new LoginResponse(jwtService.issue(authentication.getName(), roles), "Bearer",
                Instant.now().plusSeconds(properties.ttlSeconds()));
    }
}
`);

write('api-gateway/src/main/java/com/example/banking/gateway/api/GatewayController.java', `
package com.example.banking.gateway.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class GatewayController {
    @GetMapping("/gateway/routes")
    public Map<String, String> routes() {
        return Map.of(
                "market-data-service", "http://localhost:8081/api/v1",
                "rfq-service", "http://localhost:8082/api/v1",
                "oms-service", "http://localhost:8083/api/v1",
                "risk-service", "http://localhost:8084/api/v1",
                "reporting-service", "http://localhost:8086/api/v1");
    }

    @GetMapping("/support/incidents")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public List<Map<String, Object>> incidents() {
        return List.of(Map.of(
                "id", "incident-demo-1",
                "title", "Market data stale",
                "severity", "P2",
                "status", "OPEN",
                "createdAt", Instant.now().minusSeconds(1800).toString()));
    }

    @PostMapping("/support/incidents")
    @PreAuthorize("hasAnyRole('ADMIN','SUPPORT')")
    public Map<String, Object> createIncident(@RequestBody Map<String, Object> request) {
        return Map.of("id", "incident-" + System.currentTimeMillis(), "status", "OPEN", "input", request);
    }
}
`);

write('api-gateway/src/test/java/com/example/banking/gateway/JwtServiceTest.java', `
package com.example.banking.gateway;

import com.example.banking.gateway.security.JwtProperties;
import com.example.banking.gateway.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {
    @Test
    void issuesAndVerifiesToken() {
        JwtService service = new JwtService(new JwtProperties("test-secret-with-at-least-32-characters", 60), new ObjectMapper());
        var token = service.issue("trader", List.of("TRADER"));
        var payload = service.verify(token);
        assertEquals("trader", payload.get("sub"));
    }
}
`);

// Reporting service
write('reporting-service/src/main/resources/application.yml', appYml('reporting-service', 8086));
write('reporting-service/src/main/resources/db/migration/V1__reporting_schema.sql', `
CREATE TABLE audit_events (
    id VARCHAR(64) PRIMARY KEY,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    actor VARCHAR(120) NOT NULL,
    details VARCHAR(2000) NOT NULL,
    occurred_at TIMESTAMP NOT NULL
);

CREATE TABLE incident_records (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE VIEW rfq_lifecycle_report AS
SELECT aggregate_id, event_type, actor, occurred_at
FROM audit_events
WHERE event_type LIKE 'rfq.%';

INSERT INTO audit_events (id, aggregate_id, event_type, actor, details, occurred_at)
VALUES
('audit-1', 'rfq-demo-1', 'rfq.created', 'trader', 'demo rfq created', CURRENT_TIMESTAMP),
('audit-2', 'order-demo-1', 'order.executed', 'oms', 'demo order executed', CURRENT_TIMESTAMP);

INSERT INTO incident_records (id, title, severity, status, created_at)
VALUES ('incident-demo-1', 'Kafka consumer lag elevated', 'P2', 'OPEN', CURRENT_TIMESTAMP);
`);

write('reporting-service/src/main/java/com/example/banking/reporting/ReportingApplication.java', `
package com.example.banking.reporting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.banking")
public class ReportingApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReportingApplication.class, args);
    }
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/domain/AuditEventEntity.java', `
package com.example.banking.reporting.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEventEntity {
    @Id
    private String id;
    private String aggregateId;
    private String eventType;
    private String actor;
    private String details;
    private Instant occurredAt;

    protected AuditEventEntity() {
    }

    public String getId() { return id; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getActor() { return actor; }
    public String getDetails() { return details; }
    public Instant getOccurredAt() { return occurredAt; }
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/domain/IncidentRecordEntity.java', `
package com.example.banking.reporting.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "incident_records")
public class IncidentRecordEntity {
    @Id
    private String id;
    private String title;
    private String severity;
    private String status;
    private Instant createdAt;

    protected IncidentRecordEntity() {
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getSeverity() { return severity; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/repository/AuditEventRepository.java', `
package com.example.banking.reporting.repository;

import com.example.banking.reporting.domain.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, String> {
    Page<AuditEventEntity> findByEventTypeContainingIgnoreCase(String eventType, Pageable pageable);
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/repository/IncidentRecordRepository.java', `
package com.example.banking.reporting.repository;

import com.example.banking.reporting.domain.IncidentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRecordRepository extends JpaRepository<IncidentRecordEntity, String> {
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/api/PagedResponse.java', `
package com.example.banking.reporting.api;

import java.util.List;
import org.springframework.data.domain.Page;

public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
`);

write('reporting-service/src/main/java/com/example/banking/reporting/api/ReportController.java', `
package com.example.banking.reporting.api;

import com.example.banking.reporting.domain.AuditEventEntity;
import com.example.banking.reporting.domain.IncidentRecordEntity;
import com.example.banking.reporting.repository.AuditEventRepository;
import com.example.banking.reporting.repository.IncidentRecordRepository;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private final AuditEventRepository auditEvents;
    private final IncidentRecordRepository incidents;

    public ReportController(AuditEventRepository auditEvents, IncidentRecordRepository incidents) {
        this.auditEvents = auditEvents;
        this.incidents = incidents;
    }

    @GetMapping("/audit")
    public PagedResponse<AuditEventEntity> audit(@RequestParam(defaultValue = "") String eventType, Pageable pageable) {
        var page = eventType.isBlank() ? auditEvents.findAll(pageable) : auditEvents.findByEventTypeContainingIgnoreCase(eventType, pageable);
        return PagedResponse.from(page);
    }

    @GetMapping("/risk-rejections")
    public List<Map<String, Object>> riskRejections() {
        return List.of(Map.of("clientId", "client-alpha", "reason", "Daily exposure limit would be breached", "count", 1));
    }

    @GetMapping("/mifid-export")
    public Map<String, Object> mifidExport() {
        return Map.of("reportType", "SIMULATED_MIFID_II", "records", auditEvents.count(), "disclaimer", "Educational simulation only");
    }

    @GetMapping("/incidents")
    public List<IncidentRecordEntity> incidents() {
        return incidents.findAll();
    }
}
`);

// Documentation and infra
write('.env.example', `
POSTGRES_DB=banking
POSTGRES_USER=banking
POSTGRES_PASSWORD=banking
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/banking
SPRING_DATASOURCE_USERNAME=banking
SPRING_DATASOURCE_PASSWORD=banking
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379
DEMO_JWT_SECRET=replace-this-local-demo-secret-with-at-least-32-characters
`);

write('README.md', `
# Banking Credit Trading Platform

This repository is a production-style educational simulation of credit trading workflows inside a bank. It is intentionally local and safe: it does not connect to real exchanges, real bank systems, real customer data, or live trading venues. Market data, FIX messages, RFQs, orders, risk checks, executions, audit events, and regulatory reports are simulated.

## Why This Project Is Valuable

The project gives you a realistic codebase to discuss Java, Spring Boot, distributed systems, and credit trading in interviews. It favors stable, runnable examples over fragile demos: Kafka, Redis, PostgreSQL, OpenTelemetry, ELK, Prometheus, Grafana, Kubernetes, JMeter, and Gatling are represented with code, config, and docs, while the services also run in a simple H2-backed local mode.

## Architecture

- \`common-domain\`: value objects, enums, pricing strategy, risk rules, events, order state machine, concurrency examples.
- \`common-observability\`: correlation ID filter, metric names, structured logging helper.
- \`market-data-service\`: instrument catalogue, tick ingestion, NIO mock feed reader, Kafka tick producer.
- \`rfq-service\`: RFQ lifecycle, quote generation, Redis/local active RFQ cache, JPA, transactions, outbox records, Kafka events.
- \`oms-service\`: order creation, idempotency keys, pre-trade risk, optimistic locking, execution simulation, Kafka events.
- \`risk-service\`: client limits, instrument restrictions, duplicate protection, kill switch, MiFID-style controls.
- \`fix-gateway-simulator\`: small FIX-like parser and message generator for NewOrderSingle, ExecutionReport, QuoteRequest, and Quote.
- \`low-latency-lab\`: ring buffer, virtual threads, NIO file journal, JMM visibility examples.
- \`api-gateway\`: JWT security, demo users, protected support and route APIs.
- \`reporting-service\`: audit search, risk rejection report, simulated MiFID II export, SQL view examples.

## Tech Stack

Java 21, Spring Boot, Spring MVC, Spring Data JPA, Hibernate, Spring Security, Maven, H2 local mode, PostgreSQL, Redis, Kafka, Flyway, Micrometer, Prometheus, Grafana, OpenTelemetry notes, ELK configs, Docker Compose, Kubernetes manifests, Jenkins, GitHub Actions, JUnit 5, Mockito-ready test setup, JMeter, and Gatling.

## Topic Coverage

| Topic | Where Used | Why It Matters In Banking | Interview Explanation |
|---|---|---|---|
| Advanced Core Java | \`common-domain/.../CoreJavaExamples.java\`, records, enums, generics | Trading systems need precise types and predictable behavior | Explain immutable records for value objects and explicit domain enums |
| Java Collections Framework | caches, repositories, ring buffer, maps, sets | Choosing the wrong collection can increase latency or contention | Compare \`ConcurrentHashMap\`, \`List\`, \`Set\`, and bounded queues |
| Multithreading & Concurrency | \`CoreJavaExamples\`, \`low-latency-lab\` | RFQ enrichment, audit publishing, and market data pipelines run concurrently | Discuss ExecutorService, CompletableFuture, BlockingQueue, AtomicLong |
| JVM Internals | \`docs/java-performance.md\` | GC pauses and allocation rate affect trading latency | Explain heap, stack, metaspace, JIT, and allocation pressure |
| Garbage Collection | \`docs/java-performance.md\` | Stop-the-world pauses can delay orders | Discuss G1/ZGC flags and measuring before tuning |
| Java Memory Model | \`JmmVisibilityDemo.java\` | Visibility bugs cause stale risk or order state | Explain volatile and happens-before |
| NIO | \`NioMarketFeedReader.java\`, \`FileBackedEventJournal.java\` | Feeds and journals often use non-blocking or buffered I/O | Explain ByteBuffer and FileChannel |
| Design Patterns | strategy pricing/risk, factory events, state OMS | Patterns keep domain behavior extensible | Map each pattern to a package |
| SOLID Principles | \`docs/lld.md\` and risk/pricing interfaces | New rules should not require editing every service | Explain open-closed via \`RiskRule\` |
| Spring Framework Core | beans, DI, filters, properties | DI keeps services testable and replaceable | Explain constructor injection |
| Spring Boot | all service modules | Local runnable services with auto-configuration | Explain profiles and Actuator |
| Spring Data JPA & Hibernate | service repositories/entities | Banking workflows need durable state and optimistic locking | Explain repositories and \`@Version\` |
| Spring Security | \`api-gateway\` | Role-based access protects trading/support APIs | Explain JWT filter and BCrypt users |
| REST API Design | controllers under \`/api/v1\` | Clear APIs reduce integration errors | Explain HTTP methods, DTOs, validation |
| Microservices Architecture | Maven modules per service | Separate scaling and ownership | Explain service boundaries |
| Distributed Systems Fundamentals | Kafka/outbox/docs | Failures are partial and asynchronous | Explain retries, idempotency, correlation IDs |
| Event-Driven Architecture | domain events and Kafka publishers | Trading workflows are naturally event streams | Explain RFQ accepted to order creation |
| Apache Kafka | producers/consumers/topics | Durable event backbone for workflows | Explain topic naming and consumer groups |
| FIX Protocol | \`fix-gateway-simulator\` | Common protocol for electronic trading | Explain tags 35, 11, 55, 54, 38, 44 |
| Electronic Trading Systems | OMS, RFQ, FIX, market data | Orders require state, routing, execution, audit | Explain lifecycle from RFQ to execution |
| RFQ Workflows | \`rfq-service\` | Credit trading often negotiates quotes | Explain created, quoted, accepted |
| Order Management Systems | \`oms-service\` | OMS tracks state and idempotency | Explain state machine and optimistic locking |
| Market Data Systems | \`market-data-service\` | Pricing depends on fresh ticks | Explain ingestion, snapshot, Kafka publish |
| Low Latency System Design | \`low-latency-lab\`, docs | Latency outliers matter in trading | Explain batching and avoiding allocation churn |
| JVM Performance Tuning | \`docs/java-performance.md\` | Latency and throughput depend on JVM behavior | Explain flags and profiling loop |
| Performance Profiling | docs and performance tests | Tune based on evidence | Explain JFR, async-profiler, metrics |
| Threading Models | \`ThreadingModelDemo.java\` | Workloads differ for CPU and I/O | Compare pools and virtual threads |
| High Throughput System Design | Kafka, queues, ring buffer | Throughput comes from batching and backpressure | Explain producer/consumer design |
| LMAX Disruptor | \`docs/low-latency.md\`, ring buffer abstraction | Single-writer ring buffers reduce coordination overhead | Explain concept without fragile dependency |
| Aeron Messaging | \`docs/low-latency.md\` | Ultra-low latency transport for specialized cases | Compare to Kafka |
| Chronicle Queue | \`FileBackedEventJournal.java\`, docs | Durable low-latency event journal concept | Explain file-backed append-only journal |
| Database Design | migrations in each service | Correct schema supports audit and workflows | Explain indexes and table ownership |
| Advanced SQL | \`docs/advanced-sql.md\` | Reports need windows, CTEs, partitions | Explain exposure aggregation query |
| PostgreSQL | Docker Compose and Flyway | Common durable service database | Explain local H2 vs Postgres |
| Oracle Database compatibility notes | \`docs/oracle-compatibility.md\` | Banks often run Oracle estates | Explain syntax and type differences |
| Transaction Management | \`@Transactional\`, outbox | Avoid partial state changes | Explain rollback and outbox pattern |
| Redis Caching | RFQ cache, docs | Hot state and idempotency keys need quick access | Explain cache fallback and invalidation |
| CI/CD Pipelines | \`Jenkinsfile\`, GitHub Actions | Repeatable builds reduce release risk | Explain test, static checks, image build |
| Maven | root reactor | Standard enterprise Java build | Explain modules and \`-pl\` |
| Gradle comparison notes | \`docs/maven-vs-gradle.md\` | Teams choose based on ecosystem and speed | Explain why Maven is primary here |
| Jenkins | \`Jenkinsfile\` | Common bank CI tool | Explain stages |
| Unit Testing | common-domain, FIX, JWT, ring buffer tests | Fast feedback for domain behavior | Explain pure unit tests |
| JUnit 5 | tests | Modern Java testing | Explain assertions and lifecycle |
| Mockito | dependency via Spring Boot Test | Useful for service isolation | Explain where mocks would fit |
| Integration Testing | docs/Testcontainers dependency notes | Validates DB/Kafka/Redis boundaries | Explain when to add container tests |
| Contract Testing | \`contracts/rfq-created.yml\` | Keeps producer/consumer schemas aligned | Explain contract as shared API |
| Performance Testing | \`performance\` folder | Measures latency and throughput | Explain baseline and regression |
| JMeter | \`performance/jmeter\` | Common API load test tool | Explain test plan target |
| Gatling | \`performance/gatling\` | Code-based load testing | Explain scenario |
| Docker | \`docker-compose.yml\`, Dockerfiles template notes | Local dependencies and packaging | Explain services |
| Kubernetes | \`infra/k8s\` | Production deployment pattern | Explain deployment/service/probes |
| Linux for Developers | \`docs/production-support.md\` | Support requires shell fluency | Explain curl, grep, journalctl, top |
| Prometheus | \`infra/prometheus\` | Metrics scraping | Explain actuator prometheus endpoint |
| Grafana | \`infra/grafana\` | Dashboarding | Explain business metrics |
| OpenTelemetry | \`infra/otel\`, docs | Distributed tracing | Explain trace and correlation ID |
| ELK Stack | \`infra/elk\` | Log aggregation and search | Explain structured logs |
| Production Support | runbooks | Incidents happen after deploy | Explain triage loop |
| Incident Management | \`docs/incident-management.md\` | Coordinated response lowers impact | Explain severity and communication |
| System Design HLD | \`docs/hld.md\` | Architecture communication | Explain data flow |
| Low-Level Design LLD | \`docs/lld.md\` | Class and state design | Explain RFQ, OMS, risk |
| Scalability Patterns | \`docs/scalability-patterns.md\` | Growth needs partitioning and caching | Explain horizontal scaling |
| Resilience Patterns | \`docs/resilience-patterns.md\` | Services fail independently | Explain retries, DLQ, circuit breaker |
| Regulatory Concepts such as MiFID II | reporting and docs | Trades need traceability | Explain simulated audit/reporting |
| Trading Risk Controls | \`risk-service\` | Prevent bad or excessive trades | Explain limits, duplicate check, kill switch |
| Financial Markets Basics | \`docs/financial-markets-basics.md\` | Domain context | Explain bond/yield/spread |
| Credit Trading Domain | \`docs/credit-trading-domain.md\` | RFQ and bonds are domain-specific | Explain buy/sell, notional, quote |
| Quantitative Systems Integration | pricing strategy/docs | Quants supply models into services | Explain simplified clean price and DV01 |

## Run Locally

\`\`\`bash
mvn clean install
docker compose up -d
mvn spring-boot:run -pl api-gateway
mvn spring-boot:run -pl market-data-service
mvn spring-boot:run -pl rfq-service
mvn spring-boot:run -pl oms-service
mvn spring-boot:run -pl risk-service
mvn spring-boot:run -pl reporting-service
\`\`\`

Simple local mode uses H2 defaults and can run with no Docker dependencies:

\`\`\`bash
mvn spring-boot:run -pl api-gateway -Dspring-boot.run.profiles=local
\`\`\`

## Demo Users

- \`admin/password\` with \`ADMIN\`
- \`trader/password\` with \`TRADER\`
- \`risk/password\` with \`RISK_MANAGER\`
- \`support/password\` with \`SUPPORT\`
- \`readonly/password\` with \`READ_ONLY\`

## Example API Requests

\`\`\`bash
curl -X POST http://localhost:8080/api/v1/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"trader","password":"password"}'

curl http://localhost:8081/api/v1/instruments

curl -X POST http://localhost:8082/api/v1/rfqs \\
  -H 'Content-Type: application/json' \\
  -H 'X-Correlation-Id: demo-123' \\
  -d '{"clientId":"client-alpha","instrumentId":"bond-apple-2029","side":"BUY","notional":1000000,"currency":"USD"}'

curl -X POST http://localhost:8084/api/v1/risk/check \\
  -H 'Content-Type: application/json' \\
  -d '{"clientId":"client-alpha","instrumentId":"bond-apple-2029","orderNotional":1000000,"currency":"USD","idempotencyKey":"demo-1"}'
\`\`\`

Swagger UI is available at \`/swagger-ui.html\` on each service. Prometheus metrics are available at \`/actuator/prometheus\`.

## Tests

\`\`\`bash
mvn test
mvn clean test
\`\`\`

## Interview Explanation Guide

Start with the business flow: client requests a quote for a bond, trader quotes, client accepts, OMS creates an order, risk checks run, execution is simulated, and audit/reporting captures the trail. Then map the flow to engineering concepts: REST for commands, Kafka for workflow events, JPA/Flyway for durable state, Redis for hot active RFQs, Spring Security for protected APIs, and observability for support.

## Future Improvements

- Add real Testcontainers integration tests for PostgreSQL, Kafka, and Redis.
- Add service-to-service routing in the gateway using Spring Cloud Gateway.
- Replace the simple JWT implementation with an enterprise identity provider integration.
- Add schema registry and Avro/Protobuf event schemas.
- Add a real pricing library boundary for quantitative analytics.
- Add Dockerfiles per service and full Helm charts.
`);

const docs = {
  'docs/hld.md': `# High-Level Design

The platform is split by banking capability. Market data owns instruments and ticks. RFQ owns quote negotiation. OMS owns orders and executions. Risk owns limits and decisions. Reporting owns audit queries and regulatory-style exports. API Gateway owns authentication and protected facade APIs.

Data flow: market ticks enter market-data-service, RFQs are created in rfq-service, accepted quotes trigger order creation in oms-service, risk decisions validate orders, execution is simulated by OMS/FIX gateway, and audit/reporting surfaces lifecycle data.

Kafka topics: market-data.ticks, rfq.created, rfq.quoted, rfq.accepted, order.created, order.risk.checked, order.executed, risk.rejected, audit.events, incident.events. Each service includes correlation IDs so logs and events can be joined during support.

PostgreSQL is the runnable durable database. H2 is used as a simple local default. Redis caches active RFQs, market snapshots, reference data, client risk limits, and idempotency keys. The README and infra folder show Prometheus, Grafana, OpenTelemetry, and ELK support.
`,
  'docs/lld.md': `# Low-Level Design

RFQ lifecycle classes live in rfq-service. \`RfqEntity\` stores lifecycle state, \`QuoteEntity\` stores trader quote details, and \`RfqService\` coordinates transaction boundaries, cache updates, outbox writes, and Kafka publishing.

OMS uses the State pattern through \`OrderLifecycleStateMachine\`. Valid transitions are explicit: NEW to VALIDATED, VALIDATED to ACCEPTED or RISK_REJECTED, ACCEPTED to ROUTED, and ROUTED to EXECUTED.

Risk controls use the Strategy pattern. Each \`RiskRule\` evaluates one reason to reject. \`CompositeRiskEngine\` applies the rules without hard-coding individual checks into controllers.

Pricing uses \`PricingStrategy\` and \`CleanPricePricingStrategy\`. The formula is intentionally simplified and documented as an approximation, not production quant pricing.

Events use a Factory through \`DomainEventFactory\`. Persistence uses the Repository pattern through Spring Data JPA repositories. FIX parsing is an Adapter-style boundary that converts tag strings into typed accessors.
`,
  'docs/java-performance.md': `# Java Performance Notes

Heap stores objects such as RFQs, orders, cached snapshots, and event payloads. Thread stacks store method frames and local variables. Metaspace stores class metadata. GC roots include thread stacks, static fields, JNI references, and active class loaders.

Trading services care about allocation rate because frequent allocation creates GC pressure. Local experiments should start with measurements: JFR, Micrometer metrics, GC logs, and load tests. Example flags:

\`\`\`bash
-XX:+UseG1GC -Xms512m -Xmx512m -Xlog:gc*:file=gc.log:time,uptime,level,tags
-XX:+UseZGC -Xms1g -Xmx1g
\`\`\`

JMM basics: volatile provides visibility, synchronized creates mutual exclusion and happens-before edges, AtomicLong provides lock-free atomic increments, and safe publication prevents other threads from observing partially constructed objects.

False sharing can happen when independent hot fields share a cache line. Avoid premature tuning; first identify a real cache-line contention issue with profiling.
`,
  'docs/low-latency.md': `# Low Latency Notes

The low-latency lab includes a simple ring buffer, a file-backed journal, a virtual-thread example, and a JMM visibility example. It explains concepts used by LMAX Disruptor, Aeron, and Chronicle Queue without forcing fragile native or specialized dependencies into the main build.

Kafka is excellent for durable distributed streams and replay. Aeron is useful for specialized low-latency messaging where teams can operate the extra complexity. Chronicle Queue is useful for fast persisted event journals. Most banking services should start with clear design, batching, backpressure, and observability before adopting niche low-latency stacks.
`,
  'docs/maven-vs-gradle.md': `# Maven vs Gradle

This project uses Maven as the primary build tool because the requested commands are Maven-based and many bank Java estates standardize on Maven for deterministic multi-module builds.

Gradle can be faster and more programmable, especially for very large builds. Maven is simpler to inspect, easier to onboard for many enterprise teams, and integrates well with existing CI systems. The project intentionally does not include two competing build systems.
`,
  'docs/advanced-sql.md': `# Advanced SQL Examples

Window function:
\`\`\`sql
SELECT client_id, instrument_id, notional,
       SUM(notional) OVER (PARTITION BY client_id ORDER BY created_at) AS running_exposure
FROM orders;
\`\`\`

CTE:
\`\`\`sql
WITH rejected AS (
  SELECT client_id, COUNT(*) AS rejection_count
  FROM risk_decisions
  WHERE status = 'REJECTED'
  GROUP BY client_id
)
SELECT * FROM rejected ORDER BY rejection_count DESC;
\`\`\`

Explain analyze:
\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM market_data_ticks
WHERE instrument_id = 'bond-apple-2029'
ORDER BY received_at DESC LIMIT 1;
\`\`\`

Indexing: lifecycle queries should index client/status/time. Partitioning: high-volume tick and audit tables are candidates for time partitioning. Materialized views can accelerate regulatory reports when freshness requirements permit.
`,
  'docs/oracle-compatibility.md': `# Oracle Compatibility Notes

PostgreSQL is the runnable database. Oracle compatibility work usually involves identity syntax, date arithmetic, pagination, JSON functions, boolean representation, and sequence handling.

Use standard SQL where possible. Keep migrations reviewed per database. Avoid relying on H2 behavior as proof of PostgreSQL or Oracle compatibility.
`,
  'docs/production-support.md': `# Production Support Runbook

Useful commands:

\`\`\`bash
curl -s http://localhost:8082/actuator/health
curl -s http://localhost:8082/actuator/metrics
docker compose ps
docker compose logs -f kafka
ps aux | grep java
jcmd <pid> VM.flags
jcmd <pid> JFR.start name=banking settings=profile duration=60s filename=banking.jfr
grep 'correlationId=demo-123' app.log
\`\`\`

Common incidents: Kafka consumer lag, database slow query, Redis unavailable, high GC pause, order stuck pending, stale market data, risk service unavailable. Triage by impact, recent change, health checks, logs, metrics, dependencies, and mitigation.
`,
  'docs/incident-management.md': `# Incident Management

Severity model: P1 client-impacting trading outage, P2 degraded workflow, P3 isolated issue, P4 informational. Assign incident commander, communications owner, and technical lead.

Workflow: detect, declare, stabilize, investigate, mitigate, communicate, resolve, review. Capture timeline, correlation IDs, affected services, customer impact, and follow-up actions.
`,
  'docs/scalability-patterns.md': `# Scalability Patterns

Scale stateless REST services horizontally. Partition Kafka topics by aggregate ID where ordering matters. Use database indexes for lifecycle queries. Cache hot reference data and RFQs. Batch market data and reporting workloads. Use read replicas or materialized views for heavy reports.
`,
  'docs/resilience-patterns.md': `# Resilience Patterns

Use retries for transient failures, circuit breakers for repeated downstream failures, timeouts to prevent thread exhaustion, bulkheads to isolate pools, dead-letter topics for poison messages, idempotency keys for duplicate commands, and outbox records to coordinate DB state with event publication.
`,
  'docs/financial-markets-basics.md': `# Financial Markets Basics

A bond is debt issued by a company or government. Coupon is periodic interest. Maturity is when principal is repaid. Yield estimates return. Spread measures extra yield over a benchmark. Clean price excludes accrued interest; dirty price includes it. Notional is trade size. Buy/Sell is from the trader or client perspective depending on convention.
`,
  'docs/credit-trading-domain.md': `# Credit Trading Domain

Credit trading often uses RFQ workflows because corporate bonds may be less continuously liquid than equities. A client asks for a quote, a trader prices risk and liquidity, the quote may be negotiated, and accepted trades move into OMS, risk, execution, audit, and reporting.
`,
  'docs/regulatory-mifid-risk-controls.md': `# Regulatory and Risk Controls

MiFID II concepts represented here are educational: auditability, timestamped lifecycle events, explainable risk decisions, and report export. Risk controls include client limits, instrument restrictions, max notional, daily exposure, duplicate protection, and kill switch.
`,
  'docs/quantitative-systems-integration.md': `# Quantitative Systems Integration

The pricing strategy contains simplified clean price, yield/spread, notional, and DV01 calculations. In a real bank, quant libraries would be versioned, validated, independently controlled, and integrated behind stable service interfaces with model governance.
`,
  'docs/fix-protocol.md': `# FIX Protocol Simulation

This project parses a small FIX-like subset. Tag 35 is message type. 35=D means NewOrderSingle. 35=8 means ExecutionReport. 35=R means QuoteRequest. 35=S means Quote. Tag 11 is client order ID. Tag 55 is symbol. Tag 54 is side. Tag 38 is order quantity. Tag 44 is price.

The simulator does not connect to a real FIX engine or trading venue.
`
};

for (const [file, content] of Object.entries(docs)) {
  write(file, content);
}

write('docker-compose.yml', `
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: banking
      POSTGRES_USER: banking
      POSTGRES_PASSWORD: banking
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.7.1
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.7.1
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  prometheus:
    image: prom/prometheus:v2.55.0
    ports:
      - "9090:9090"
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:11.2.2
    ports:
      - "3000:3000"
    volumes:
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards:ro

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.15.3
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.15.3
    ports:
      - "5044:5044"
    volumes:
      - ./infra/elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro

  kibana:
    image: docker.elastic.co/kibana/kibana:8.15.3
    depends_on:
      - elasticsearch
    ports:
      - "5601:5601"

volumes:
  postgres-data:
`);

write('infra/prometheus/prometheus.yml', `
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: api-gateway
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ['host.docker.internal:8080']
  - job_name: banking-services
    metrics_path: /actuator/prometheus
    static_configs:
      - targets:
          - 'host.docker.internal:8081'
          - 'host.docker.internal:8082'
          - 'host.docker.internal:8083'
          - 'host.docker.internal:8084'
          - 'host.docker.internal:8086'
`);

write('infra/grafana/dashboards/banking-dashboard.json', `
{
  "title": "Banking Credit Trading Platform",
  "panels": [
    {
      "type": "timeseries",
      "title": "API Latency",
      "targets": [{"expr": "http_server_requests_seconds_count"}]
    },
    {
      "type": "stat",
      "title": "RFQs Created",
      "targets": [{"expr": "banking_rfqs_created_total"}]
    },
    {
      "type": "stat",
      "title": "Risk Rejections",
      "targets": [{"expr": "banking_risk_rejections_total"}]
    }
  ],
  "schemaVersion": 39,
  "version": 1
}
`);

write('infra/elk/logstash.conf', `
input {
  tcp {
    port => 5044
    codec => json_lines
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "banking-platform-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
`);

write('infra/otel/otel-collector-config.yml', `
receivers:
  otlp:
    protocols:
      grpc:
      http:

exporters:
  logging:
    verbosity: normal

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [logging]
`);

write('infra/k8s/api-gateway-deployment.yaml', `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: banking-credit-trading-platform/api-gateway:local
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
    - port: 80
      targetPort: 8080
`);

write('infra/k8s/service-template.yaml', `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: market-data-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: market-data-service
  template:
    metadata:
      labels:
        app: market-data-service
    spec:
      containers:
        - name: market-data-service
          image: banking-credit-trading-platform/market-data-service:local
          envFrom:
            - configMapRef:
                name: banking-platform-config
          ports:
            - containerPort: 8081
`);

write('infra/k8s/configmap.yaml', `
apiVersion: v1
kind: ConfigMap
metadata:
  name: banking-platform-config
data:
  KAFKA_BOOTSTRAP_SERVERS: kafka:9092
  REDIS_HOST: redis
  REDIS_PORT: "6379"
`);

write('Jenkinsfile', `
pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Build and Test') {
      steps { sh 'mvn -B clean test' }
    }
    stage('Package') {
      steps { sh 'mvn -B -DskipTests package' }
    }
    stage('Docker Images') {
      steps { echo 'Template: build service images here' }
    }
    stage('Kubernetes Deploy') {
      steps { echo 'Template: kubectl apply -f infra/k8s' }
    }
  }
}
`);

write('.github/workflows/ci.yml', `
name: CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven
      - run: mvn -B clean test
`);

write('contracts/rfq-created.yml', `
description: RFQ created event contract
name: rfq_created_event
topic: rfq.created
payload:
  eventType: rfq.created
  aggregateId: rfq-demo-1
  clientId: client-alpha
  instrumentId: bond-apple-2029
  side: BUY
  notional: 1000000
`);

write('performance/jmeter/banking-platform.jmx', `
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Banking Platform Smoke"/>
    <hashTree/>
  </hashTree>
</jmeterTestPlan>
`);

write('performance/gatling/src/test/scala/BankingSimulation.scala', `
import io.gatling.core.Predef._
import io.gatling.http.Predef._

class BankingSimulation extends Simulation {
  val httpProtocol = http.baseUrl("http://localhost:8081")
  val scn = scenario("Market data smoke")
    .exec(http("list instruments").get("/api/v1/instruments"))

  setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}
`);

write('docs/sample-market-feed.csv', `
# instrumentId,bid,ask,yieldPercent,spreadBps
bond-apple-2029,98.12,98.18,5.21,95
bond-bank-2031,96.30,96.42,5.87,145
`);

console.log(`Scaffolded ${serviceModules.length + 3} Maven modules in ${root}`);
