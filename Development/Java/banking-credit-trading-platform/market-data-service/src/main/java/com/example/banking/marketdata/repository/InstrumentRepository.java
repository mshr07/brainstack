package com.example.banking.marketdata.repository;

import com.example.banking.marketdata.domain.InstrumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstrumentRepository extends JpaRepository<InstrumentEntity, String> {
    Page<InstrumentEntity> findByIssuerContainingIgnoreCase(String issuer, Pageable pageable);
}
