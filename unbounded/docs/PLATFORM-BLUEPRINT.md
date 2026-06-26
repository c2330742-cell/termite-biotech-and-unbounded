# AEON — PLATFORM BLUEPRINT
## Technical Architecture, Data Flow, and Implementation Strategy

---

## 1. SYSTEM ARCHITECTURE DIAGRAM (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AEON PLATFORM ARCHITECTURE                        │
│                        "Living Content — Infinite Becoming"                  │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │    USER DEVICE    │
                                    │  ┌──────────────┐ │
                                    │  │  LOCAL MODELS │ │
                                    │  │  - Empath     │ │
                                    │  │  - Personalize│ │
                                    │  │  - Whisper    │ │
                                    │  └──────┬───────┘ │
                                    │  ┌──────┴───────┐ │
                                    │  │  EDGE ENGINE  │ │
                                    │  │  (llama.cpp/  │ │
                                    │  │   WebGPU)     │ │
                                    │  └──────┬───────┘ │
                                    └─────────┼─────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
              ┌─────┴─────┐           ┌───────┴───────┐         ┌──────┴──────┐
              │ P2P MESH   │           │   WEBSOCKET   │         │  WEBRTC     │
              │ (Libp2p)   │           │   (Control)   │         │  (Media)    │
              └─────┬─────┘           └───────┬───────┘         └──────┬──────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │   LOAD BALANCER    │
                                    │   (NGINX / Envoy)  │
                                    └─────────┬─────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │   DIRECTOR AGENT   │
                                    │   (Orchestrator)   │
                                    │ ┌───────────────┐  │
                                    │ │ Session Router │  │
                                    │ │ Resource Alloc │  │
                                    │ │ Quality Gate   │  │
                                    │ └───────────────┘  │
                                    └────┬──────┬────┬───┘
                                         │      │    │
                    ┌────────────────────┘      │    └────────────────────┐
                    │                           │                        │
              ┌─────┴──────┐          ┌─────────┴──────────┐   ┌────────┴────────┐
              │  MODEL ORCH. │         │  KNOWLEDGE GRAPH   │   │  VALIDATION     │
              │  (vLLM, Comfy)│        │  (Neo4j + Vectors) │   │  SERVICE        │
              │ ┌──────────┐ │         │ ┌────────────────┐ │   │ ┌────────────┐  │
              │ │Narrator  │ │         │ │Concept Nodes   │ │   │ │Logician    │  │
              │ │Visualist │ │         │ │Relationship Edg│ │   │ │Cross-Ref   │  │
              │ │Logician  │ │         │ │User Journeys   │ │   │ │Human Valid │  │
              │ │Connector │ │         │ │Session Traces  │ │   │ │Appeal Proc│  │
              │ │Critic    │ │         │ └────────────────┘ │   │ └────────────┘  │
              │ └──────────┘ │         └────────────────────┘   └────────────────┘
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────┴───┐  ┌────┴───┐  ┌────┴───┐
   │Open    │  │CLOSED  │  │THIRD   │
   │Models  │  │Fine-   │  │Party    │
   │(LLaMA, │  │Tuned   │  │APIs    │
   │SD, etc)│  │Models  │  │(Falcon,│
   └────────┘  └────────┘  │Together)│
                           └────────┘
```

---

## 2. DATA FLOW

### 2.1 Session Initialization

```
USER INPUT ──► Local Empath Model ──► Personalization Vector
       │                                        │
       └──────────────┬─────────────────────────┘
                      │
                      ▼
              DIRECTOR AGENT
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
       Knowledge   User       Global
       Graph Query History    Context
            │         │         │
            └─────────┼─────────┘
                      │
                      ▼
           Session Blueprint Generated
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
        Narrator   Visualist  Logician
        (Script    (Scenes)   (Facts)
         Struct)
```

### 2.2 Live Session Data Flow

```
                    ┌──────────────────────┐
                    │   SESSION INSTANCE    │
                    │   (Director Agent)    │
                    └──────┬──────────┬────┘
                           │          │
              ┌────────────┘          └────────────┐
              │                                     │
         ┌────┴────┐                         ┌──────┴──────┐
         │ OUTPUT  │                         │   INPUT      │
         │ CHANNEL │                         │   CHANNEL   │
         ├─────────┤                         ├─────────────┤
         │Narrative│                         │User Queries  │
         │Visuals  │                         │Votes/Redirect│
         │Audio    │                         │Biometrics    │
         │Spatial  │                         │Build Actions │
         └─────────┘                         └──────┬──────┘
                                                     │
                                            ┌────────┴────────┐
                                            │  FEEDBACK LOOP  │
                                            │  (models adapt  │
                                            │   every ~2s)    │
                                            └─────────────────┘
```

### 2.3 Post-Session Data Flow

```
SESSION ENDS
      │
      ├──► Knowledge Graph Update
      │       ├── New concept nodes
      │       ├── New relationship edges
      │       ├── User journey appended
      │       ├── Quality metrics logged
      │       └── Cross-session connections identified
      │
      ├──► User Profile Update
      │       ├── Skill progression
      │       ├── Knowledge map refresh
      │       ├── Interest vector update
      │       └── Recommendation model update
      │
      ├──► Global Model Fine-Tuning
      │       ├── Reinforcement learning from session outcomes
      │       ├── Knowledge graph embeddings updated
      │       └── Validator feedback incorporated
      │
      └──► Content Address (IPFS) created
              ├── Session fingerprint (for dedup)
              ├── Trace data (anonymized, opt-in)
              └── Contribution attribution
```

---

## 3. AI MODEL ORCHESTRATION

### 3.1 Model Registry

| Model Role    | Base Architecture | Fine-Tuning Data | Inference Method        | Latency Budget |
|---------------|-------------------|------------------|-------------------------|----------------|
| Narrator      | LLaMA 4 70B       | Narrative structures, pedagogical transcripts, world literature | vLLM with speculative decoding | <800ms         |
| Visualist     | SD4 + Flux.1 Pro  | Art history, scientific visualization, 3D scans | ComfyUI + LCM LoRA      | <2s per frame  |
| Logician      | Mistral Large     | Scientific papers, knowledge graph embeddings, formal logic | vLLM with chain-of-thought | <1.5s          |
| Empath        | Qwen 3.5 7B (quantized) | Affective computing datasets, HRI transcripts | llama.cpp (local)       | <200ms         |
| Connector     | Mixture: LLM + GraphNN | Knowledge graph traversal traces | Custom graph neural network + LLM reranking | <1s            |
| Critic        | Mixture: LLaMA 4 + Reward Model | Quality ratings from human validators | Ensemble                  | <2s            |
| Director      | LLaMA 4 8B (fine-tuned) | Session logs, orchestration traces | vLLM                     | <500ms         |

### 3.2 Orchestration Protocol

```
Director Agent uses a state machine with four phases:

PHASE 1: BLUEPRINT
  └► Assess user state (Empath)
  └► Query knowledge graph for relevant context
  └► Select session type and initial models
  └► Generate session blueprint (concept map, learning objectives)

PHASE 2: GENERATION
  └► Narrator generates next narrative segment
  └► Logician validates factual claims against KG
  └► Visualist generates/retrieves supporting visuals
  └► Connector suggests relevant tangents
  └► Critic scores output quality
  └► If score < threshold → regenerate with new seed

PHASE 3: INTERACTION
  └► Process user input (query, gesture, vote, biometric)
  └► Empath interprets user state (confused? bored? excited?)
  └► Director decides: continue, redirect, dive deeper, simplify
  └► Logician updates KG with new information from user
  └► Loop back to PHASE 2

PHASE 4: INTEGRATION
  └► Finalize knowledge graph updates
  └► Generate session summary and skill assessment
  └► Update user model
  └► Identify cross-session connections
  └► Store session hash to IPFS
```

### 3.3 Model Loading Strategy

```
Models are loaded on demand, not all at once.

┌──────────────────────────────────────────┐
│  MEMORY MANAGEMENT                       │
│                                          │
│  Always loaded:                          │
│    - Director (8B, quantized to Q4)      │
│    - Empath (7B, quantized to Q4_K_M)   │
│    - Embedding model (for KG queries)    │
│                                          │
│  Loaded on demand:                       │
│    - Narrator (for narrative sessions)   │
│    - Logician (when fact-checking)       │
│    - Visualist (when generating visuals) │
│    - Connector (at session transitions)  │
│    - Critic (every N generations)        │
│                                          │
│  Unloading:                              │
│    - LRU eviction with priority scoring  │
│    - Session-based caching TTL           │
└──────────────────────────────────────────┘
```

---

## 4. CONTENT MODERATION STRATEGY

### 4.1 Principles

- **Censorship is a tool of the old regime.** AEON does not censor. It verifies, contextualizes, and labels.
- **Misinformation is a failure of provenance, not a crime.** Every claim carries its source chain. Users can inspect and challenge.
- **Harmful content is defined narrowly:** direct incitement to violence, doxxing, child exploitation, and platform sabotage. Everything else — no matter how uncomfortable — is welcome.
- **The goal is not safety. The goal is truth-seeking.** Safety is a side effect of a well-functioning epistemic system.

### 4.2 Multi-Layer Moderation

```
LAYER 1: AI PRE-FILTER
  ├── Logician checks generated content against knowledge graph
  ├── Claims without KG support are flagged as "Unverified"
  ├── Claims explicitly contradicted by KG are flagged as "Disputed"
  ├── Incitement/harm detection model (separate, narrow scope)
  └── No content is blocked at this layer — only labeled

LAYER 2: HUMAN VALIDATOR REVIEW
  ├── Flagged content enters validation queue
  ├── Domain experts (tiered by reputation) review
  ├── Validators can: Confirm, Correct, or Escalate
  ├── Escalated content goes to multi-validator panel
  └── Resolution updates the knowledge graph

LAYER 3: COMMUNITY CHALLENGE
  ├── Any user can challenge any content
  ├── Challenge triggers structured debate (AI-moderated)
  ├── Evidence must be provided with provenance
  ├── Debate outcome recorded in knowledge graph
  └── Successful challenges earn reputation

LAYER 4: JUDICIAL PANEL
  ├── For edge cases and appeals
  ├── Randomly selected from top-tier validators
  ├── Decisions are transparent and precedential
  └── Panel decisions can be appealed to full community vote
```

### 4.3 Provenance Chain

```
Every claim in every session carries:

┌─────────────────────────────────────┐
│ CLAIM: "The MMR vaccine does not   │
│ cause autism."                      │
├─────────────────────────────────────┤
│ SOURCES:                            │
│ 1. Wakefield (1998) - RETRACTED     │
│    → Reason: Fraudulent data        │
│ 2. Madsen et al. (2002) - 537,303  │
│    children study, no correlation   │
│ 3. Taylor et al. (2014) - meta-     │
│    analysis of 1.2M, no correlation │
│ 4. CDC (2023) - updated guidelines  │
├─────────────────────────────────────┤
│ CONFIDENCE: 99.97%                  │
│ STATUS: Verified (Peer-reviewed     │
│ consensus, multiple large studies)  │
│ LAST VALIDATED: 2026-04-15          │
│ VALIDATOR: dr_elena_petrov (Rep: 92)│
└─────────────────────────────────────┘
```

---

## 5. SCALING ROADMAP

### Phase 0: Seed (0-6 months)

| Component | Scale | Infrastructure |
|-----------|-------|----------------|
| Users | 5,000 | Single server (8x A100 80GB) |
| Session types | 1 ("The Living Debate") | Monorepo, Python + Rust |
| Knowledge graph | 50K nodes, 200K edges | Single Neo4j instance |
| Models | 2 (Narrator, Logician) | vLLM on dedicated GPU |
| Team | 5-8 engineers | All hands, no ops yet |
| Storage | 500 GB | Local RAID + S3 |
| Budget | ~$50K/mo | Bootstrapped / grant funded |

### Phase 1: Garden (6-18 months)

| Component | Scale | Infrastructure |
|-----------|-------|----------------|
| Users | 500,000 | 50 GPU nodes (H100), global regions |
| Session types | 6 | Microservices, Kubernetes |
| Knowledge graph | 10M nodes, 50M edges | Neo4j cluster (5 nodes) + vector DB |
| Models | 6 active + fine-tunes | Multi-node vLLM, ComfyUI farms |
| Team | 25-40 engineers | ML, infra, product, trust & safety |
| Storage | 50 TB | Distributed (IPFS + S3) |
| Budget | ~$500K/mo | Subscriptions + early licensing |

### Phase 2: Network (18-36 months)

| Component | Scale | Infrastructure |
|-----------|-------|----------------|
| Users | 50 million | 2,000 GPU nodes, 50 edge PoPs |
| Session types | 20+ (community expanded) | Service mesh (Istio), global CDN |
| Knowledge graph | 500M nodes, 5B edges | Sharded Neo4j + custom graph engine |
| Models | Fine-tuned per domain | Model zoo with 200+ specialist models |
| Team | 150-300 engineers | Full org structure |
| Storage | 5 PB | Hybrid: IPFS + S3 + local edge cache |
| Budget | ~$5M/mo | Profitable from subs + licensing |

### Phase 3: Replacement (36-72 months)

| Component | Scale | Infrastructure |
|-----------|-------|----------------|
| Users | 500 million+ | 20,000 GPU nodes, 500 edge PoPs |
| Session types | Infinite (user-generated) | Fully decentralized orchestration |
| Knowledge graph | 10B+ nodes, 200B+ edges | Distributed graph protocol (custom) |
| Models | Community-trained | Open ecosystem of specialist models |
| Team | 500-1,000 | Distributed, DAO-governed |
| Storage | Exabyte scale | Fully decentralized (IPFS + Filecoin) |
| Budget | Self-sustaining | Diversified revenue, Genesis Fund |

---

## 6. OPEN-SOURCE CONTRIBUTION MODEL

### 6.1 Philosophy

AEON is not a product to be sold. It is a protocol to be adopted. The platform succeeds when the ecosystem expands beyond any single company's control. Every component that can be open-source will be open-source.

### 6.2 Contribution Tiers

```
TIER 1: CORE PLATFORM (AGPL)
  ├── Director Agent
  ├── Session protocol (session templates spec)
  ├── Knowledge graph schema and APIs
  ├── Validator node software
  └── Client SDKs (web, mobile, desktop)

TIER 2: MODEL ECOSYSTEM (Various Open Licenses)
  ├── Fine-tuned model weights (Apache 2.0 or CC-BY-SA)
  ├── Training pipelines and datasets
  ├── Reward model data
  └── Quantization recipes

TIER 3: CONTENT (CC-BY-SA or Custom)
  ├── Session templates
  ├── Knowledge graph contributions
  ├── Validator reviews and resolutions
  └── Educational materials

TIER 4: INFRASTRUCTURE (MIT / Apache 2.0)
  ├── Deployment scripts and Helm charts
  ├── Monitoring and observability tools
  ├── CI/CD pipelines
  ├── Security audits and hardening
  └── Client performance optimizations
```

### 6.3 Incentive Structure

| Contribution Type | Reward | Mechanism |
|-------------------|--------|-----------|
| Code contribution | Reputation + token grants | Git-based, reviewed, merged with bounty |
| Model fine-tuning | Reputation + compute credits | Submitted to model zoo, benchmarked |
| Dataset curation | Reputation + tokens | Verified, deduplicated, documented |
| Session template | Revenue share (70% to creator) | Marketplace with usage tracking |
| Knowledge graph edit | Validator reputation | Peer-reviewed, graph quality score |
| Bug report | Reputation + tokens | Triaged, confirmed, fixed |
| Security disclosure | Bug bounty (tiered, up to $50K) | HackerOne-style program |

### 6.4 Governance (Long-Term)

```
┌──────────────────────────────────────────────────┐
│  AEON DAO (target: Phase 3)                      │
│                                                   │
│  ├── Token holders vote on:                       │
│  │   ├── Protocol upgrades                        │
│  │   ├── Validator tier criteria                  │
│  │   ├── Genesis Fund allocation                  │
│  │   ├── Validator election                       │
│  │   └── License changes                          │
│  │                                                │
│  ├── Technical Steering Committee (elected):      │
│  │   ├── Core protocol decisions                  │
│  │   ├── Security responses                       │
│  │   ├── Model governance                         │
│  │   └── Knowledge graph schema evolution         │
│  │                                                │
│  ├── Ethical Review Board (randomly selected):    │
│  │   ├── Moderation appeals                       │
│  │   ├── Edge case rulings                        │
│  │   ├── Algorithmic audit                        │
│  │   └── Consent framework updates                │
│  │                                                │
│  └── All decisions publicly transparent           │
└──────────────────────────────────────────────────┘
```

---

## 7. KEY METRICS & KPIS

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Session completion rate | >85% | Content is engaging without tricks |
| User skill progression | +1 std dev / 6mo | Platform actually makes you smarter |
| Creator conversion | >25% of users | Audience → Creator pipeline |
| Knowledge graph accuracy | >99.5% verified | Trust is the product |
| Validator coverage | >3 validators per claim | Multi-party verification |
| Session uniqueness | >99.9% | No two sessions are the same |
| User lifetime value | >36 months | Stickiness through growth, not addiction |
| Net Promoter Score | >70 | Users love it enough to tell others |
| Time-to-creator | <90 days | Fast path from consumer to producer |
| Knowledge graph growth | 2x nodes/year | Living system, not static archive |

---

## 8. RISK & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI generates harmful content | Medium | High | Multi-layer moderation, provenance chains, narrow harm filter |
| Model biases distort knowledge | High | Medium | Diverse training data, validator oversight, bias audits |
| Validator capture / corruption | Low | High | Random selection, transparent records, appeal process |
| Compute costs exceed revenue | Medium | High | Edge-first architecture, model quantization, efficiency research |
| Regulatory suppression (unwelcome content) | Medium | Medium | Decentralized infrastructure, legal defense fund, jurisdiction diversity |
| Centralization of creator economy | Low | Medium | Open protocol, competing clients, data portability |
| Knowledge graph quality degradation | Medium | High | Continuous validation, automated anomaly detection, reward structure |

---

## 9. IMMEDIATE NEXT STEPS

```
WEEK 1-2:
  □ Finalize session protocol spec (v0.1)
  □ Set up monorepo with CI/CD
  □ Recruit founding team (ML, Rust, Graph, Product)

WEEK 3-4:
  □ Implement Director Agent core (state machine)
  □ Deploy first model ensemble (Narrator + Logician)
  □ Build minimal knowledge graph schema

WEEK 5-8:
  □ Ship "The Living Debate" as first session type
  □ Implement basic provenance chain
  □ Onboard 100 alpha users

WEEK 9-12:
  □ Collect feedback and iterate
  □ Add Visualist model integration
  □ Implement local Empath model (on-device)

WEEK 13-24:
  □ Open session template API
  □ Launch validator program (invite-only)
  □ Scale to 5,000 users
  □ Begin knowledge graph growth flywheel
```

---

## APPENDIX: PROTOCOL SPECIFICATION (ABSTRACT)

```
Session Blueprint:
  type: SessionBlueprint
  version: "0.1"
  fields:
    - session_id: string (UUIDv7)
    - session_type: enum (debate, build, unwelcome, ...)
    - user_profile_hash: string (blake3)
    - knowledge_graph_context: ConceptNode[]
    - director_config: {
        models: string[],
        generation_params: {...},
        interaction_thresholds: {...}
      }
    - provenance_chain: ProvenanceEntry[]
    - quality_threshold: float (0.0-1.0)

Session Instance:
  type: SessionInstance
  version: "0.1"
  fields:
    - session_id: string
    - director_agent_id: string
    - current_phase: enum (blueprint, generation, interaction, integration)
    - generation_counter: uint64
    - user_feedback_buffer: UserFeedback[]
    - model_output_cache: ModelOutput[]
    - session_trace: TraceEntry[]
    - state_hash: string (for synchronization)

Knowledge Graph Edge:
  type: Edge
  version: "0.1"
  fields:
    - source: ConceptNode
    - target: ConceptNode
    - relationship_type: enum (builds_on, contradicts, inspired_by,
                                prerequisite, example, question, answer,
                                synthesizes, explores, validates)
    - weight: float (0.0-1.0)
    - provenance: string (session_id or external source)
    - validator_ids: string[]
    - created: timestamp
    - last_validated: timestamp
```

---

*This blueprint is a living document. Like the platform it describes, it will evolve as we learn, build, and discover what works. The key is to start — the rest will emerge through the act of creation.*

**Begin building.**

---
