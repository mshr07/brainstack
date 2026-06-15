package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.OutboxEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, String> {
}
