package com.adsage.platform.conversation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitMessageRequest(
        @NotBlank @Size(max = 4000) String question,
        @NotBlank @Size(max = 64) String clientTimezone,
        @Size(min = 2, max = 16) String locale) {}
