package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.RfqEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqRepository extends JpaRepository<RfqEntity, String> {
}
