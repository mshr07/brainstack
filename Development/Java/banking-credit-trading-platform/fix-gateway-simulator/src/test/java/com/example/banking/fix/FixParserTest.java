package com.example.banking.fix;

import com.example.banking.fix.domain.FixParser;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FixParserTest {
    @Test
    void parsesNewOrderSingle() {
        var message = new FixParser().parse("8=FIX.4.4|35=D|11=abc|55=US037833AK68|54=1|38=1000000|44=99.875|");
        assertEquals("D", message.messageType());
        assertEquals("abc", message.required(11));
    }

    @Test
    void requiresMessageType() {
        assertThrows(IllegalArgumentException.class, () -> new FixParser().parse("8=FIX.4.4|11=abc|"));
    }
}
