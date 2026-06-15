package com.example.banking.latency;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FileBackedEventJournal implements AutoCloseable {
    private final FileChannel channel;

    public FileBackedEventJournal(Path path) throws IOException {
        this.channel = FileChannel.open(path, StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.APPEND);
    }

    public void append(String event) throws IOException {
        byte[] bytes = (event + System.lineSeparator()).getBytes(StandardCharsets.UTF_8);
        channel.write(ByteBuffer.wrap(bytes));
    }

    @Override
    public void close() throws IOException {
        channel.close();
    }
}
