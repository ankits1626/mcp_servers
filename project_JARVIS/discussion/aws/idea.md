# JARVIS - AWS 10,000 AIdeas Competition Submission

## Competition Overview

- Competition: AWS Global 10,000 AIdeas Competition
- Timeline: December 5, 2025 to January 21, 2026
- Prizes: $250,000 in cash across 20 winner categories
- Track: Workplace Efficiency

## Team

- Team Name: Team JARVIS

## Elevator Pitch

JARVIS is a real-time AI assistant that listens to your conversations, connects your scattered knowledge from past meetings, articles, and LLM chats, and augments your thinking so you never miss a detail and stay fully present.

## The Problem

Professionals in meetings, interviews, and negotiations struggle with cognitive overload. They cannot listen, think, recall, and take notes simultaneously. Knowledge stays trapped in silos across LLM chats, articles, and past meetings, inaccessible when needed most. JARVIS solves this by passively listening, unifying scattered knowledge, and augmenting human thinking in real-time. The result is professionals who are more present, never miss details, and have perfect recall, turning every conversation into an opportunity rather than a cognitive juggling act.

## Who Benefits

Professionals in high-stakes conversations including salespeople on client calls, engineers in technical interviews, executives in negotiations, consultants in discovery sessions, and anyone who wants to communicate more effectively.

## Game Plan

### Phase 1 - Listen

Local audio capture streams to Amazon Transcribe Streaming via WebSocket for real-time, speaker-aware transcription. PCM audio in 100ms chunks ensures low latency with partial result stabilization.

### Phase 2 - Remember

Amazon Bedrock Knowledge Bases ingests scattered knowledge including past LLM conversations, Medium articles, YouTube transcripts, and meeting recordings stored in S3 with automatic semantic chunking and embeddings. This creates a unified, searchable memory layer.

### Phase 3 - Augment

During live conversations, Bedrock with Claude matches the real-time transcript against the knowledge base using RetrieveAndGenerate API, surfacing relevant context through a minimal desktop overlay without disrupting flow.

### Infrastructure

All compute runs serverless on Lambda with 1M free invocations per month, storage on S3 with 5GB free, and AI on Bedrock staying within AWS Free Tier plus credits. Region set to us-east-1 for maximum model availability.

### Development

Using Kiro spec-driven workflow with requirements.md, design.md, and tasks.md files plus agent hooks for automated testing. Rapid iteration through Bedrock Playground before code deployment.

## AWS AI Services

### Amazon Bedrock

The main service for accessing foundation models like Claude, Titan, Llama, and others. Includes Knowledge Bases for RAG which lets you connect your own data and retrieve relevant context automatically. This is the brain of JARVIS.

### Bedrock AgentCore

Service for building AI agents that can take actions, not just chat. Handles tool calling, memory management, session persistence, and orchestration. The coordination layer that lets the AI decide when to search knowledge, when to transcribe, and when to respond.

### Kiro

AWS agentic IDE for development. Required for this competition. Describe what you want to build and it generates requirements, design docs, and tasks, then writes code based on those specs. Used to build JARVIS, not part of the final product.

## AWS Free Tier Services

### Storage and Database

- Amazon S3 - 5GB free storage for knowledge documents, transcripts, and exports
- Amazon DynamoDB - 25GB storage plus 200M requests per month for session state and user metadata

### Compute and Orchestration

- AWS Lambda - 1M invocations and 400K GB-seconds per month for serverless processing
- Amazon EventBridge - 14M events per month for triggering workflows between services
- AWS Step Functions - 4000 state transitions per month for orchestrating multi-step flows

### API and Networking

- Amazon API Gateway - 1M REST API calls per month for web or mobile interface
- Amazon CloudFront - 1TB data transfer for content delivery

### Monitoring

- Amazon CloudWatch - 10 custom metrics, 10 alarms, 5GB log ingestion for monitoring and debugging

## Technical Architecture

### Recommended AWS Services

| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| Real-time transcription | Amazon Transcribe Streaming | WebSocket-based, 50-200ms chunks, partial result stabilization |
| Knowledge store | S3 plus Bedrock Knowledge Bases | Fully managed RAG with automatic chunking and embeddings |
| LLM reasoning | Amazon Bedrock with Claude | Contextual understanding and response generation |
| Orchestration | Lambda | Serverless compute within free tier |
| Vector search | OpenSearch Serverless or Neptune Analytics | GraphRAG for better accuracy with related content linking |

### Best Practices

- Region: Use us-east-1 for maximum Bedrock model availability
- Chunking: Use semantic chunking in Bedrock Knowledge Bases
- Audio: PCM format, 50-200ms chunks for low latency
- Cost: Set budget alerts before building using AWS Budgets
- Testing: Use Bedrock Playground for prompt iteration before writing code

## Competitor Landscape

| Solution | Approach | JARVIS Differentiator |
|----------|----------|----------------------|
| Otter.ai, Fireflies | Cloud transcription plus summaries | Unified cross-platform memory |
| Meetily | Local-first with Whisper plus Ollama | AWS-native with Bedrock RAG |
| Proactor AI | Global context perception | Knowledge ingestion from LLM chats, articles, and videos |

JARVIS unique angle: Not just meeting transcription but a unified memory layer that connects scattered knowledge from past LLM chats, Medium articles, YouTube, and meetings.

## Free Tier Strategy

- New accounts get $200 credits ($100 signup plus $100 from onboarding tasks)
- Lambda: 1M invocations plus 400K GB-seconds per month (always free)
- S3: 5GB standard storage (always free)
- Bedrock: No free tier so use credits wisely and test in Playground first
- Set up AWS Budgets immediately (also earns $20 credits)

## Competition Timeline

| Date | Milestone |
|------|-----------|
| Dec 5, 2025 | Competition starts |
| Jan 21, 2026 | Initial submissions due |
| Feb 11, 2026 | Top 1,000 semi-finalists announced |
| Mar 13, 2026 | Semi-finalists share prototype articles and community voting begins |
| Mar 20, 2026 | Top 300 advance |
| Apr 3, 2026 | AWS Experts select 50 finalists |
| Apr 17, 2026 | Finalists submit revised articles and final voting begins |
| Apr 30, 2026 | Winners announced |
| May-Sep 2026 | Winners showcased at AWS Summits worldwide |

## Requirements

- Teams of 1-4 people
- Must be 18 years or older
- Valid AWS Builder ID required
- Must use Kiro for development
- Stay within AWS Free Tier
- Original and unpublished work only
- Reside in an eligible country

## Resources

- Amazon Transcribe Streaming Docs: https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html
- Amazon Bedrock Knowledge Bases: https://aws.amazon.com/bedrock/knowledge-bases/
- Building Scalable RAG with Bedrock: https://aws.amazon.com/blogs/machine-learning/building-scalable-secure-and-reliable-rag-applications-using-amazon-bedrock-knowledge-bases/
- AWS Free Tier 2025 Changes: https://dev.to/ricky_rios/aws-free-tier-2025-what-changed-whats-included-and-how-to-use-it-7a6
- Using Bedrock for 10,000 AIdeas Competition: https://dev.to/aws/using-amazon-bedrock-with-aws-free-tier-for-the-10000-aideas-competition-554f
- Kiro IDE Docs: https://kiro.dev/docs/
- Competition Page: https://builder.aws.com/connect/events/10000aideas
