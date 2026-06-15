package com.example.banking.observability;

public final class BusinessMetrics {
    public static final String RFQS_CREATED = "banking.rfqs.created";
    public static final String ORDERS_CREATED = "banking.orders.created";
    public static final String ORDERS_REJECTED = "banking.orders.rejected";
    public static final String RISK_REJECTION_COUNT = "banking.risk.rejections";
    public static final String CACHE_HIT_RATIO = "banking.cache.hit.ratio";

    private BusinessMetrics() {
    }
}
