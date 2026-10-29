import { ProjectTemplate } from './types';

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // 1. COLLABORATIONS / CLIENTS TEMPLATES
  {
    name: 'Client Engineering // Systems Architecture',
    category: 'collaboration',
    description: 'Project developed for an external company, partner, or industry client',
    defaultTitle: 'TELEMETRY-ROUTER // DISTRIBUTED LOG INGESTION',
    defaultClientName: 'Apex Systems Inc.',
    defaultClientRole: 'Lead Systems Architect & Contractor',
    defaultTags: ['CLIENT', 'RUST', 'DISTRIBUTED', 'KAFKA', 'HIGH-THROUGHPUT'],
    content: `# TELEMETRY-ROUTER // Distributed Ingestion Subsystem

> Engineered for **Apex Systems Inc.** to resolve multi-datacenter log ingestion bottlenecks and guarantee zero message loss under burst traffic.

---

## Engagement Summary

- **Client / Partner**: Apex Systems Inc.
- **Role / Scope**: Lead Systems Architect & Infrastructure Contractor
- **Timeline**: Q1 – Q3 2025
- **Primary Deliverable**: Standalone edge-routing daemon processing 500k events/sec per node.

---

## Challenge & Problem Statement

The client experienced severe buffer overruns during upstream spikes, causing telemetry drops in downstream analytics clusters. Existing Java-based middleware introduced uncontrollable garbage collection pauses exceeding 180ms.

---

## Technical Solution

We engineered a Rust-based, zero-copy packet router utilizing Linux \`io_uring\` and memory-mapped ring buffers:

\`\`\`text
[Edge Client Fleet] ──► [UDP / TLS Ingress Socket]
                                 │
                     [Memory-Mapped Ring Buffer]
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
  [Stream Filter & Batcher]               [Cold Storage Replicator]
             │                                       │
             ▼                                       ▼
    (Kafka Ingestion)                         (S3 / Parquet)
\`\`\`

---

## Impact & Key Results

- **Latency Reduction**: P99 dispatch latency decreased from 194ms to 1.8ms.
- **Resource Footprint**: Memory usage reduced from 14 GB to 180 MB per node.
- **Zero Loss**: Sustained 48-hour soak testing with zero packet drop over 10 billion simulated messages.
`
  },
  {
    name: 'Club / Team Initiative // Collegiate Engineering',
    category: 'collaboration',
    description: 'Hardware, robotics, or software built for clubs, student teams, or open lab collectives',
    defaultTitle: 'AVIONICS-GROUND // REAL-TIME TELEMETRY CONSOLE',
    defaultClientName: 'Hyperloop Engineering Club',
    defaultClientRole: 'Embedded Software Lead',
    defaultTags: ['CLUB', 'C++', 'WEBSOCKET', 'TELEMETRY', 'CAN-BUS'],
    content: `# AVIONICS-GROUND // Real-Time Vehicle Telemetry Console

> Real-time flight tracking and sensor telemetry console developed for the **Hyperloop Engineering Club** competition pod.

---

## Team & Project Context

- **Organization / Club**: Hyperloop Engineering Team
- **Role**: Embedded Software Lead & Ground Station Architect
- **Timeline**: 2024 – 2025 Competition Cycle
- **System Stack**: C++20, WebSockets, Protobuf, React, WebGL

---

## Subsystem Architecture

The system connects directly to the vehicle's dual-redundant CAN bus via Ethernet gateway, deserializing sensor frames and streaming state updates to the mission control pit crew:

1. **CAN-Bus Gateway**: Ingests 1 kHz sensor frames (temperatures, chamber pressure, magnetic levitation gap).
2. **Safety Watchdog**: Hardware heartbeat validation with automatic emergency braking command triggers.
3. **Cockpit HUD**: 60 FPS WebGL visualization rendering velocity curves and thermal heatmaps.
`
  },

  // 2. LAUNCHES TEMPLATES (OWN REPOS & PROJECTS)
  {
    name: 'Launch // Systems R&D Substrate',
    category: 'launch',
    description: 'High-performance engine, low-level tooling, memory model, and benchmarks',
    defaultTitle: 'SYS-CORE // HIGH-THROUGHPUT RUNTIME',
    defaultStatus: 'In Dev',
    defaultTags: ['RUST', 'SYSTEMS', 'CONCURRENCY', 'ZERO-COPY'],
    content: `# SYS-CORE // High-Throughput Substrate

> An asynchronous, zero-allocation runtime engine engineered for high-density systems coordination and local execution pipelines.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: In Dev](https://img.shields.io/badge/Status-In_Dev-amber.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS-lightgrey.svg)]()

---

## Architecture Overview

SYS-CORE isolates process scheduling into dedicated ring-buffered execution lanes, circumventing lock contention across core boundaries.

\`\`\`text
┌─────────────────────────────────────────────────────────┐
│                    INGRESS PIPELINE                     │
└────────────────────────────┬────────────────────────────┘
                             │ (Lockless SPMC Queue)
             ┌───────────────┴───────────────┐
             ▼                               ▼
     ┌──────────────┐                 ┌──────────────┐
     │ LANE 00 CORE │                 │ LANE 01 CORE │
     │ Memory Arena │                 │ Memory Arena │
     └──────┬───────┘                 └──────┬───────┘
            └────────────────┬───────────────┘
                             ▼
                 [HARDWARE IO INTERFACE]
\`\`\`

---

## Technical Characteristics

- **Zero-Copy Serialization**: Packet buffers reside in pinned shared arenas.
- **Microsecond Latency**: P99 dispatch times < 14 microseconds under sustained 200k ops/sec load.
- **Fail-Safe Crash Isolation**: Memory-isolated worker threads prevent cascade failures.
`
  },
  {
    name: 'Launch // CLI & Developer Tool',
    category: 'launch',
    description: 'Command line interface, package installation, flags, and workflow automation',
    defaultTitle: 'DYNTOP // LOCAL PROCESS PROFILER',
    defaultStatus: 'Beta',
    defaultTags: ['CLI', 'GO', 'TELEMETRY', 'DEVTOOLS'],
    content: `# DYNTOP // Modern Terminal Process Profiler

> Terminal-based telemetry visualizer designed for granular CPU micro-architecture inspections and memory layout auditing.

---

## Installation

\`\`\`bash
# Via Homebrew
brew install ponnusamy-dynamics/tap/dyntop

# Via Cargo
cargo install dyntop
\`\`\`

---

## CLI Usage

\`\`\`bash
# Launch interactive terminal dashboard
dyntop

# Audit specific process ID with 250ms sampling rate
dyntop --pid 4102 --sample-rate 250ms
\`\`\`
`
  },

  // 3. RESEARCH & DOCS TEMPLATES
  {
    name: 'Doc // Research Paper & System Analysis',
    category: 'doc',
    description: 'Technical research paper, benchmark analysis, or algorithmic investigation',
    defaultTitle: 'EVALUATING LOCKLESS ARENAS UNDER NON-UNIFORM MEMORY ACCESS',
    defaultDocType: 'Research Paper',
    defaultDocReadingTime: '9 min read',
    defaultDocContext: 'Systems Architecture // Cache Coherency & NUMA Topology',
    defaultTags: ['RESEARCH', 'NUMA', 'CACHE-COHERENCE', 'SYSTEMS', 'BENCHMARKS'],
    content: `# Evaluating Lockless Arenas Under Non-Uniform Memory Access (NUMA)

**Author**: Rickjarren Ponnusamy  
**Date**: September 2026  
**Document Classification**: Research Paper // Experimental Systems R&D  
**Keywords**: Non-Uniform Memory Access, Cache Coherence, Memory Allocators, eBPF

---

## Abstract

Modern multi-socket server architectures exhibit significant latency disparities when accessing local versus remote memory nodes. In this paper, we evaluate the throughput degradation of standard lockless memory arenas when thread scheduling ignores NUMA node affinity. We present an empirical benchmark methodology evaluating three arena designs across 64 hardware threads and demonstrate that topology-aware memory striping reduces cross-interconnect snooping by 68%.

---

## 1. Introduction

As hardware architectures scale out core counts, memory bus saturation emerges as the predominant bottleneck in zero-copy stream processing. When a thread bound to Node 0 accesses memory allocated on Node 1, it incurs the round-trip latency of the interconnect link (QPI/UPI).

---

## 2. Experimental Methodology

We conducted our benchmark suite across dual-socket AMD EPYC 7763 processors (128 cores, 256 threads total) configured with 512 GB DDR4 memory across 8 NUMA domains:

- **Workload**: 100,000,000 allocate-write-free iterations per test run.
- **Chunk Sizes**: Varied from 64 bytes (cache line matching) to 64 KiB.
- **Profiling Tool**: Hardware performance counters via \`perf\` and custom eBPF probes.

---

## 3. Empirical Results

| Allocation Strategy | Mean Latency (ns) | Interconnect Bandwidth (GB/s) | L3 Cache Miss Rate |
| :--- | :--- | :--- | :--- |
| **Global Arena (Naive)** | 142.6 ns | 38.4 GB/s | 14.8% |
| **Per-Thread Arena (Unpinned)** | 89.2 ns | 22.1 GB/s | 9.3% |
| **NUMA-Local Pinned Arena (Proposed)** | **31.4 ns** | **4.2 GB/s** | **2.1%** |

---

## 4. Key Takeaways & Recommendations

1. Always bind ring buffer worker threads directly to the NUMA node where hardware NIC ring descriptors are mapped.
2. In multi-tenant environments, avoid shared atomics across socket boundaries; prefer core-local accumulation buffers with periodic epoch merges.
`
  },
  {
    name: 'Doc // Technical Specification / RFC',
    category: 'doc',
    description: 'System RFC, protocol design, or technical architecture specification',
    defaultTitle: 'RFC-01 // BINARY PROTOCOL FOR SUB-MILLISECOND SENSOR TELEMETRY',
    defaultDocType: 'Technical Spec',
    defaultDocReadingTime: '6 min read',
    defaultDocContext: 'Protocol Engineering // Network Serialization Standard',
    defaultTags: ['RFC', 'PROTOCOL', 'NETWORKING', 'BINARY-SPEC'],
    content: `# RFC-01: Binary Protocol for Sub-Millisecond Sensor Telemetry

**Status**: Published Specification  
**Author**: Rickjarren Ponnusamy  
**Revision**: 1.2  
**Target Systems**: Robotics, Ground Stations, Real-Time Telemetry  

---

## 1. Motivation

Textual formats (JSON, XML) incur unacceptable parsing and string allocation overhead in microsecond-sensitive telemetry loops. This specification defines a fixed-header, little-endian binary frame format engineered for in-place struct mapping in C, Rust, and Zig.

---

## 2. Wire Format Specification

\`\`\`text
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Magic 0x5044 (PD)       |    Version    |   Frame Type  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Sequence Number                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Timestamp High (Epoch s)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Timestamp Low (Nanosec)                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Payload Length        |           Checksum            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Payload Bytes ...                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
\`\`\`

---

## 3. Compliance & Conformance Tests

Compliant parsers MUST validate:
- Header Magic sequence matches \`0x5044\` in network byte order.
- CRC16 checksum computed across header and payload bytes matches frame trailer.
`
  }
];
