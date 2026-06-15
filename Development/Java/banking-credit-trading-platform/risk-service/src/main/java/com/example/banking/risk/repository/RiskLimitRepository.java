package com.example.banking.risk.repository;

import com.example.banking.risk.domain.RiskLimitEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskLimitRepository extends JpaRepository<RiskLimitEntity, String> {
    Optional<RiskLimitEntity> findByClientId(String clientId);
}
