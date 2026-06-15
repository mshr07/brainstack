package com.example.banking.reporting.repository;

import com.example.banking.reporting.domain.IncidentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentRecordRepository extends JpaRepository<IncidentRecordEntity, String> {
}
