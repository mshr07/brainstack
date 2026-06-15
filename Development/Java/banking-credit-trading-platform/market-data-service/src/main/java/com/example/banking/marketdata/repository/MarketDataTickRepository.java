package com.example.banking.marketdata.repository;

import com.example.banking.marketdata.domain.MarketDataTickEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketDataTickRepository extends JpaRepository<MarketDataTickEntity, Long> {
    Optional<MarketDataTickEntity> findFirstByInstrumentIdOrderByReceivedAtDesc(String instrumentId);
}
