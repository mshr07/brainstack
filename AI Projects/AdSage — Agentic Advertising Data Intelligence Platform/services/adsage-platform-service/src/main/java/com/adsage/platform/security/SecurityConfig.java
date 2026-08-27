package com.adsage.platform.security;

import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        requests ->
                                requests.requestMatchers("/actuator/health", "/actuator/info")
                                        .permitAll()
                                        .requestMatchers("/v1/**")
                                        .hasAuthority("SCOPE_analysis:run")
                                        .anyRequest()
                                        .authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                .build();
    }

    @Bean
    JwtDecoder jwtDecoder(PlatformSecurityProperties properties) {
        NimbusJwtDecoder decoder;
        if (properties.devHmacSecret() != null && !properties.devHmacSecret().isBlank()) {
            if (properties.devHmacSecret().getBytes(StandardCharsets.UTF_8).length < 32) {
                throw new IllegalArgumentException("DEV_JWT_SECRET must contain at least 32 bytes");
            }
            var key =
                    new SecretKeySpec(
                            properties.devHmacSecret().getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256");
            decoder = NimbusJwtDecoder.withSecretKey(key).build();
        } else if (properties.jwkSetUri() != null && !properties.jwkSetUri().isBlank()) {
            decoder = NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUri()).build();
        } else {
            // Issuer discovery is the production default when an explicit JWK URI is not supplied.
            return JwtDecoders.fromIssuerLocation(properties.issuer());
        }

        var issuerValidator = JwtValidators.createDefaultWithIssuer(properties.issuer());
        var audienceValidator = new AudienceValidator(properties.audience());
        decoder.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(PlatformSecurityProperties properties) {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.allowedOrigins());
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(
                java.util.List.of(
                        "Authorization",
                        "Content-Type",
                        "Idempotency-Key",
                        "X-Request-Id",
                        "traceparent",
                        "tracestate"));
        configuration.setExposedHeaders(java.util.List.of("X-Request-Id"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
