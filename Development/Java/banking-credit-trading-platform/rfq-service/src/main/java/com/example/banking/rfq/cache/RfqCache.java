package com.example.banking.rfq.cache;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RfqCache {
    private static final Logger log = LoggerFactory.getLogger(RfqCache.class);
    private final Map<String, String> localCache = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;

    public RfqCache(ObjectProvider<StringRedisTemplate> redisTemplate) {
        this.redisTemplate = redisTemplate.getIfAvailable();
    }

    public void putActive(String rfqId, String status) {
        localCache.put(rfqId, status);
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set("rfq:active:" + rfqId, status);
            } catch (RuntimeException ex) {
                log.warn("Redis unavailable; retained active RFQ in local cache");
            }
        }
    }

    public Optional<String> get(String rfqId) {
        if (redisTemplate != null) {
            try {
                String value = redisTemplate.opsForValue().get("rfq:active:" + rfqId);
                if (value != null) {
                    log.info("cache hit for rfq {}", rfqId);
                    return Optional.of(value);
                }
            } catch (RuntimeException ex) {
                log.warn("Redis unavailable on cache get");
            }
        }
        return Optional.ofNullable(localCache.get(rfqId));
    }
}
