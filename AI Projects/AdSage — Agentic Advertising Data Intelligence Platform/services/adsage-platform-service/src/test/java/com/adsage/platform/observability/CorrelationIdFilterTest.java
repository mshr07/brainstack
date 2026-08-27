package com.adsage.platform.observability;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @Test
    void preservesSafeCallerRequestId() throws Exception {
        var request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.HEADER, "request-safe_1234");
        var response = new MockHttpServletResponse();
        FilterChain chain = (ignoredRequest, ignoredResponse) -> {};

        filter.doFilter(request, response, chain);

        assertThat(request.getAttribute(CorrelationIdFilter.ATTRIBUTE))
                .isEqualTo("request-safe_1234");
        assertThat(response.getHeader(CorrelationIdFilter.HEADER)).isEqualTo("request-safe_1234");
    }

    @Test
    void replacesLogInjectionCandidate() throws Exception {
        var request = new MockHttpServletRequest();
        request.addHeader(CorrelationIdFilter.HEADER, "bad\nforged-log-entry");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> {});

        assertThat(response.getHeader(CorrelationIdFilter.HEADER))
                .isNotBlank()
                .doesNotContain("\n")
                .isNotEqualTo("bad\nforged-log-entry");
    }
}
