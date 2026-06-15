package com.example.banking.oms.repository;

import com.example.banking.oms.domain.ExecutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionRepository extends JpaRepository<ExecutionEntity, String> {
}
