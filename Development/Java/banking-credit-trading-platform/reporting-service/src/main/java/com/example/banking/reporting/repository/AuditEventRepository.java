package com.example.banking.reporting.repository;

import com.example.banking.reporting.domain.AuditEventEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, String> {
    Page<AuditEventEntity> findByEventTypeContainingIgnoreCase(String eventType, Pageable pageable);
}
