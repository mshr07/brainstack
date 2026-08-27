package com.adsage.platform.conversation;

import com.adsage.platform.observability.CorrelationIdFilter;
import com.adsage.platform.orchestration.RequestContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/v1/conversations/{conversationId}/messages")
public class MessageController {

    private final ConversationApplicationService conversationService;

    public MessageController(ConversationApplicationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    ResponseEntity<RunAccepted> submit(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SubmitMessageRequest message,
            @RequestHeader("Idempotency-Key")
                    @Size(min = 16, max = 128)
                    @Pattern(regexp = "[A-Za-z0-9._:-]+")
                    String idempotencyKey,
            @RequestHeader(value = "traceparent", required = false) String traceparent,
            JwtAuthenticationToken principal,
            HttpServletRequest request) {
        String requestId = (String) request.getAttribute(CorrelationIdFilter.ATTRIBUTE);
        var result =
                conversationService.submit(
                        conversationId,
                        message,
                        idempotencyKey,
                        principal,
                        new RequestContext(requestId, traceparent));
        return ResponseEntity.accepted().body(result);
    }
}
