package com.example.banking.oms.repository;

import com.example.banking.oms.domain.OrderEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    Optional<OrderEntity> findByIdempotencyKey(String idempotencyKey);
}
