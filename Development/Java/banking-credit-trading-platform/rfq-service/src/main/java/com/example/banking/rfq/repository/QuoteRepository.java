package com.example.banking.rfq.repository;

import com.example.banking.rfq.domain.QuoteEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuoteRepository extends JpaRepository<QuoteEntity, String> {
    Optional<QuoteEntity> findFirstByRfqIdOrderByCreatedAtDesc(String rfqId);
}
