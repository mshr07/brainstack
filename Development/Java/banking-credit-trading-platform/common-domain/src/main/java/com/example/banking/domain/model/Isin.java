package com.example.banking.domain.model;

import java.util.Locale;
import java.util.regex.Pattern;

public record Isin(String value) {
    private static final Pattern ISIN_PATTERN = Pattern.compile("[A-Z]{2}[A-Z0-9]{9}[0-9]");

    public Isin {
        if (value == null || !ISIN_PATTERN.matcher(value.toUpperCase(Locale.ROOT)).matches()) {
            throw new IllegalArgumentException("Invalid ISIN: " + value);
        }
        value = value.toUpperCase(Locale.ROOT);
    }
}
