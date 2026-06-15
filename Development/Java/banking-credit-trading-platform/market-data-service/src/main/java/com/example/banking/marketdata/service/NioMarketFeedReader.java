package com.example.banking.marketdata.service;

import com.example.banking.marketdata.api.MarketDataRequest;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class NioMarketFeedReader {
    public List<MarketDataRequest> readCsvFeed(Path path) throws IOException {
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocateDirect(16 * 1024);
            StringBuilder text = new StringBuilder();
            while (channel.read(buffer) != -1) {
                buffer.flip();
                text.append(StandardCharsets.UTF_8.decode(buffer));
                buffer.clear();
            }
            List<MarketDataRequest> ticks = new ArrayList<>();
            for (String line : text.toString().split("\\R")) {
                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                String[] parts = line.split(",");
                ticks.add(new MarketDataRequest(parts[0].trim(), new BigDecimal(parts[1].trim()),
                        new BigDecimal(parts[2].trim()), new BigDecimal(parts[3].trim()), new BigDecimal(parts[4].trim())));
            }
            return ticks;
        }
    }
}
