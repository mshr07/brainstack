package com.adsage.platform.orchestration;

import java.util.regex.Pattern;

public record RequestContext(String requestId, String traceparent) {

    private static final Pattern W3C_TRACEPARENT =
            Pattern.compile("00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]");

    public RequestContext {
        traceparent =
                traceparent != null && W3C_TRACEPARENT.matcher(traceparent).matches()
                        ? traceparent
                        : null;
    }
}
