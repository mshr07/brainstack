package com.adsage.platform.web;

import com.adsage.platform.observability.CorrelationIdFilter;
import com.adsage.platform.orchestration.AiOrchestratorUnavailableException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
final class ApiExceptionHandler {

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    ProblemDetail invalidRequest(HttpServletRequest request) {
        return problem(
                HttpStatus.BAD_REQUEST,
                "Invalid request",
                "The request did not satisfy the published contract.",
                request);
    }

    @ExceptionHandler(AiOrchestratorUnavailableException.class)
    ProblemDetail orchestratorUnavailable(HttpServletRequest request) {
        return problem(
                HttpStatus.BAD_GATEWAY,
                "Analysis temporarily unavailable",
                "The analysis service did not complete the request. Retry with the same idempotency key.",
                request);
    }

    private ProblemDetail problem(
            HttpStatus status, String title, String detail, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setType(URI.create("https://adsage.example/problems/" + status.value()));
        problem.setProperty("requestId", request.getAttribute(CorrelationIdFilter.ATTRIBUTE));
        return problem;
    }
}
