package com.adsage.platform.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("adsage.security")
public record PlatformSecurityProperties(
        String issuer,
        String jwkSetUri,
        String audience,
        String devHmacSecret,
        List<String> allowedOrigins) {

    public PlatformSecurityProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
