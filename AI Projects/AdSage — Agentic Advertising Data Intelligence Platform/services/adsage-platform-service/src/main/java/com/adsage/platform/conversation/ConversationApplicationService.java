package com.adsage.platform.conversation;

import com.adsage.platform.orchestration.RequestContext;
import java.util.UUID;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public interface ConversationApplicationService {

    RunAccepted submit(
            UUID conversationId,
            SubmitMessageRequest message,
            String idempotencyKey,
            JwtAuthenticationToken principal,
            RequestContext requestContext);
}
