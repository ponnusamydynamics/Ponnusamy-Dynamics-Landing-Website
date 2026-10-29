import { Project } from './types';
import { PROJECT_TEMPLATES } from './templates';

export const DEFAULT_SHOWCASE_PROJECTS: Project[] = [
  // -------------------------------------------------------------
  // 1. COLLABORATIONS & CLIENTS
  // -------------------------------------------------------------
  {
    id: 'clb-01',
    category: 'collaboration',
    projectId: 'CLB-01',
    title: 'TELEMETRY-ROUTER // DISTRIBUTED LOG INGESTION',
    status: 'Published',
    clientName: 'Apex Systems Inc.',
    clientRole: 'Lead Systems Architect & Contractor',
    clientPeriod: 'Q1 – Q3 2025',
    shortDesc: 'Zero-copy packet router utilizing Linux io_uring and memory-mapped ring buffers to resolve multi-datacenter bottlenecks. Ingests 500k events/sec per node with sub-2ms dispatch latency.',
    readme: PROJECT_TEMPLATES[0].content,
    tags: ['CLIENT', 'RUST', 'DISTRIBUTED', 'KAFKA', 'HIGH-THROUGHPUT', 'ZERO-COPY'],
    order: 1,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/telemetry-router',
    liveUrl: 'https://apexsystems.example.com',
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'clb-02',
    category: 'collaboration',
    projectId: 'CLB-02',
    title: 'AVIONICS-GROUND // REAL-TIME TELEMETRY CONSOLE',
    status: 'Published',
    clientName: 'Hyperloop Engineering Club',
    clientRole: 'Embedded Software Lead',
    clientPeriod: '2024 – 2025',
    shortDesc: 'Real-time vehicle telemetry and flight control console developed for the Hyperloop competition pod. Interfaces directly with dual-redundant CAN-bus gateways with 60 FPS WebGL HUD.',
    readme: PROJECT_TEMPLATES[1].content,
    tags: ['CLUB', 'C++', 'WEBSOCKET', 'TELEMETRY', 'CAN-BUS', 'WEBGL'],
    order: 2,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/avionics-ground',
    createdAt: '2024-11-10T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'clb-03',
    category: 'collaboration',
    projectId: 'CLB-03',
    title: 'NEURAL-INSPECT // EMBEDDED COMPUTER VISION PIPELINE',
    status: 'Published',
    clientName: 'Robotics Autonomy Lab',
    clientRole: 'Systems & ML Infrastructure Engineer',
    clientPeriod: 'Fall 2024',
    shortDesc: 'Hardware-accelerated edge inference pipeline for autonomous robotic defect inspection utilizing TensorRT and Vulkan compute kernels with sub-8ms bounding box extraction.',
    readme: `# NEURAL-INSPECT // Embedded Computer Vision Pipeline

> Hardware-accelerated inference substrate developed for the **Robotics Autonomy Lab** to process 120 FPS stereo camera streams with sub-8ms bounding box detection.

---

## Engagement Summary

- **Organization / Partner**: Robotics Autonomy Lab
- **Scope**: Edge Vision Inference & Vulkan Compute Acceleration
- **Timeline**: Fall 2024
- **Hardware Target**: NVIDIA Jetson Orin Nano & Custom Sensor Payload

---

## Technical Architecture

\`\`\`text
[Stereo Camera Ingress (MIPI CSI-2)]
                 │
      [DMA Zero-Copy Buffer]
                 │
   [TensorRT FP16 Quantized Backbone]
                 │
 ┌───────────────┴───────────────┐
 ▼                               ▼
[Bounding Box Extraction]    [Depth Disparity Map]
 └───────────────┬───────────────┘
                 ▼
[Autonomy Navigation Bus (eBPF IPC)]
\`\`\`

---

## Key Results

- **Inference Speed**: Sustained 120 FPS at 1080p resolution with FP16 quantization.
- **Latency**: P99 frame-to-actuation response time under 7.6ms.
- **Power Envelope**: Operates reliably under strict 15W edge power constraints.
`,
    tags: ['CLUB', 'TENSORRT', 'VULKAN', 'EDGE-AI', 'C++20'],
    order: 3,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/neural-inspect',
    createdAt: '2024-09-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },

  // -------------------------------------------------------------
  // 2. DEPLOYED LAUNCHES
  // -------------------------------------------------------------
  {
    id: 'lnch-01',
    category: 'launch',
    projectId: 'LNCH-01',
    title: 'SYS-CORE // HIGH-THROUGHPUT RUNTIME',
    status: 'In Dev',
    shortDesc: 'An asynchronous, zero-allocation runtime engine engineered for high-density systems coordination, SPMC lockless queues, and microsecond thread lane scheduling.',
    readme: PROJECT_TEMPLATES[2].content,
    tags: ['RUST', 'SYSTEMS', 'CONCURRENCY', 'ZERO-COPY', 'IO-URING'],
    order: 1,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/sys-core',
    liveUrl: 'https://syscore.dev',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'lnch-02',
    category: 'launch',
    projectId: 'LNCH-02',
    title: 'DYNTOP // LOCAL PROCESS PROFILER',
    status: 'Beta',
    shortDesc: 'Terminal-based telemetry visualizer designed for granular CPU micro-architecture inspections, cache line miss tracking, and memory layout auditing.',
    readme: PROJECT_TEMPLATES[3].content,
    tags: ['CLI', 'GO', 'TELEMETRY', 'DEVTOOLS', 'LINUX-PERF'],
    order: 2,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/dyntop',
    createdAt: '2025-08-15T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'lnch-03',
    category: 'launch',
    projectId: 'LNCH-03',
    title: 'MEM-TRACE // KERNEL MEMORY ARENA AUDITOR',
    status: 'Published',
    shortDesc: 'eBPF-driven memory allocator monitor tracking slab fragmentation, allocator leaks, and page fault latencies in real time without kernel recompilation.',
    readme: `# MEM-TRACE // Kernel Memory Arena Auditor

> eBPF-driven memory allocator monitor tracking slab fragmentation, allocator leaks, and page fault latencies in real time without kernel recompilation.

---

## Core Capabilities

- **Zero-Instrumentation Probing**: Attaches dynamic kprobes to \`kmalloc\` and \`vm_area_struct\` routines.
- **Slab Fragmentation Profiling**: Visualizes memory arena utilization across NUMA sockets.
- **Sub-1% Overhead**: Optimized ring buffer event emission ensures zero disruption to production workloads.

---

## Installation & Quickstart

\`\`\`bash
# Build kernel probe
cargo build --release --package mem-trace-ebpf

# Run live monitor with 1-second refresh
sudo mem-trace --interval 1s --top 10
\`\`\`
`,
    tags: ['EBPF', 'C', 'KERNEL', 'MEMORY', 'PERFORMANCE'],
    order: 3,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/mem-trace',
    createdAt: '2025-10-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },

  // -------------------------------------------------------------
  // 3. RESEARCH & DOCS
  // -------------------------------------------------------------
  {
    id: 'doc-01',
    category: 'doc',
    projectId: 'DOC-01',
    title: 'EVALUATING LOCKLESS ARENAS UNDER NON-UNIFORM MEMORY ACCESS',
    status: 'Published',
    docType: 'Research Paper',
    docReadingTime: '9 min read',
    docDate: 'September 2026',
    docContext: 'Systems Architecture // Cache Coherency & NUMA Topology',
    shortDesc: 'Empirical benchmark methodology evaluating throughput degradation and cache snooping across 64 hardware threads and 8 NUMA domains under high-frequency workloads.',
    readme: PROJECT_TEMPLATES[4].content,
    tags: ['RESEARCH', 'NUMA', 'CACHE-COHERENCE', 'SYSTEMS', 'BENCHMARKS'],
    order: 1,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    externalUrl: 'https://arxiv.org',
    githubUrl: 'https://github.com/ponnusamy-dynamics/numa-lockless-benchmark',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'doc-02',
    category: 'doc',
    projectId: 'DOC-02',
    title: 'RFC-01 // BINARY PROTOCOL FOR SUB-MILLISECOND SENSOR TELEMETRY',
    status: 'Published',
    docType: 'Technical Spec',
    docReadingTime: '6 min read',
    docDate: 'August 2026',
    docContext: 'Protocol Engineering // Network Serialization Standard',
    shortDesc: 'Fixed-header, little-endian binary frame format engineered for in-place struct mapping in C, Rust, and Zig across robotics and ground station telemetry buses.',
    readme: PROJECT_TEMPLATES[5].content,
    tags: ['RFC', 'PROTOCOL', 'NETWORKING', 'BINARY-SPEC', 'EMBEDDED'],
    order: 2,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    githubUrl: 'https://github.com/ponnusamy-dynamics/rfc-subms-telemetry',
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'doc-03',
    category: 'doc',
    projectId: 'DOC-03',
    title: 'WHITE PAPER // DETERMINISTIC SCHEDULING IN USERSPACE DAEMONS',
    status: 'Published',
    docType: 'Whitepaper',
    docReadingTime: '12 min read',
    docDate: 'July 2026',
    docContext: 'Operating Systems // Real-Time Userspace Task Scheduling',
    shortDesc: 'Comparative investigation into thread pinning, priority inheritance, and isolcpus for jitter-sensitive software pipelines and low-latency network routers.',
    readme: `# White Paper // Deterministic Scheduling in Userspace Daemons

**Author**: Rickjarren Ponnusamy  
**Date**: July 2026  
**Document Classification**: Systems Architecture White Paper  

---

## Abstract

Microsecond-sensitive distributed actors require predictable kernel-to-userspace scheduling guarantees. Standard Linux \`SCHED_OTHER\` introduces unpredictable context switch latencies under CPU contention. This whitepaper analyzes empirical jitter reductions achieved by combining core isolation (\`isolcpus\`), \`SCHED_FIFO\` real-time policies, and user-space ring buffer worker synchronization.

---

## Key Findings

1. **Jitter Bounds**: P99.99 execution variance dropped from 1,240 µs to 12 µs with isolated thread pinning.
2. **Context Switching**: Eliminating preemptive multitasking on pinned cores reduced L1 data cache eviction by 91%.
3. **Core Recommendations**: Explicit isolation lanes prevent scheduler drift during socket burst ingress.
`,
    tags: ['WHITEPAPER', 'SCHEDULING', 'REAL-TIME', 'LINUX-RT', 'JITTER'],
    order: 3,
    published: true,
    authorEmail: 'ponnusamy.rickjarren@gmail.com',
    externalUrl: 'https://arxiv.org',
    githubUrl: 'https://github.com/ponnusamy-dynamics/deterministic-scheduling',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
];
