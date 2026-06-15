package com.example.banking.risk.repository;

import com.example.banking.risk.domain.RiskDecisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskDecisionRepository extends JpaRepository<RiskDecisionEntity, String> {
}
