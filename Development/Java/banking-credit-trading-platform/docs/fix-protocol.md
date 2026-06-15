# FIX Protocol Simulation

This project parses a small FIX-like subset. Tag 35 is message type. 35=D means NewOrderSingle. 35=8 means ExecutionReport. 35=R means QuoteRequest. 35=S means Quote. Tag 11 is client order ID. Tag 55 is symbol. Tag 54 is side. Tag 38 is order quantity. Tag 44 is price.

The simulator does not connect to a real FIX engine or trading venue.
