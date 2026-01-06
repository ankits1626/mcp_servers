# System Design Mastery Roadmap for Beginners

> "Every box you draw should solve a problem you've already proven exists."

## The Core Mindset Shift

The Google L7 interviewer's lesson: **Don't memorize patterns. Reason from constraints.**

| Wrong Approach | Right Approach |
|----------------|----------------|
| "Use Redis for caching" | "What's my cache hit rate? Is it worth the complexity?" |
| "Add a load balancer" | "At what QPS does one server fail?" |
| "Use Kafka for events" | "Do I need async processing? What's the volume?" |

---

## Phase 1: Foundations (Months 1-3)

### Goal: Understand the building blocks deeply

#### 1.1 Core Computer Science
**Topics:**
- Data structures (arrays, hash maps, trees, graphs, heaps)
- Time/space complexity analysis
- Networking basics (TCP/IP, HTTP, DNS, CDN)
- Operating systems (processes, threads, memory, I/O)

**Practical Project: Build a Simple Key-Value Store**
```
Tech Stack: Python or Go
Features:
- In-memory storage with hash map
- Basic CRUD operations via HTTP API
- Persistence to disk (append-only log)
- Simple LRU eviction

Key Learning: Why is this slow? Measure it. At what point does it break?
```

**Metrics to Track:**
- Requests/second on single machine
- Latency at p50, p95, p99
- Memory usage growth

#### 1.2 Database Fundamentals
**Topics:**
- SQL vs NoSQL trade-offs
- ACID properties (really understand them)
- Indexing (B-trees, hash indexes)
- Query optimization

**Practical Project: URL Shortener v1**
```
Tech Stack: Node.js/Express + PostgreSQL
Features:
- Generate short codes
- Redirect to original URL
- Track click counts
- Basic analytics

Constraints Exercise:
- Measure: How many writes/second can your DB handle?
- What happens when you hit 10,000 URLs?
- When does a single PostgreSQL instance fail?
```

---

## Phase 2: Distributed Basics (Months 4-6)

### Goal: Understand why distributed systems exist

#### 2.1 Caching
**Topics:**
- Cache-aside vs write-through vs write-behind
- Cache invalidation strategies
- TTL and eviction policies
- When NOT to cache

**Practical Project: Add Caching to URL Shortener**
```
Tech Stack: Redis + your URL shortener
Experiments:
1. Measure hit rate with different TTLs
2. What if URLs follow long-tail distribution?
3. Remove the cache - does the system still work?
4. At what hit rate does caching become worth it?

Key Learning: Cache only when you can PROVE it helps
```

#### 2.2 Load Balancing & Horizontal Scaling
**Topics:**
- Round-robin vs least connections vs consistent hashing
- Health checks and failover
- Session affinity trade-offs
- When horizontal scaling stops working

**Practical Project: Multi-Instance Deployment**
```
Tech Stack: Docker + Nginx + Your app
Features:
- Deploy 3 instances behind Nginx
- Implement health checks
- Test failover (kill one instance)
- Measure throughput improvement

Questions to Answer:
- 3x instances = 3x throughput? Why not?
- What becomes the bottleneck now?
```

#### 2.3 Message Queues
**Topics:**
- Sync vs async processing
- At-least-once vs exactly-once delivery
- Backpressure and rate limiting
- When queues add unnecessary complexity

**Practical Project: Async Analytics Pipeline**
```
Tech Stack: RabbitMQ or Redis Streams
Features:
- Queue click events from URL shortener
- Process analytics asynchronously
- Handle consumer failures
- Implement dead letter queue

Key Learning: What happens when consumer is slower than producer?
```

---

## Phase 3: Real Distributed Systems (Months 7-9)

### Goal: Understand failure modes and trade-offs

#### 3.1 CAP Theorem (Actually Understand It)
**Topics:**
- Consistency vs Availability trade-offs
- Network partitions in practice
- Strong vs eventual consistency
- When to choose what

**Practical Project: Distributed Counter**
```
Tech Stack: Go or Rust + gRPC
Build:
- Counter service running on 3 nodes
- Implement consensus (simplified Raft)
- Handle node failures
- Test split-brain scenarios

Failure Experiments:
- What happens when 1 node dies?
- What happens when network splits 2-1?
- Can you have strong consistency AND high availability?
```

#### 3.2 Database Replication & Sharding
**Topics:**
- Leader-follower replication
- Read replicas and replication lag
- Horizontal sharding strategies
- Consistent hashing (when it matters)

**Practical Project: Sharded URL Shortener**
```
Tech Stack: PostgreSQL + Custom sharding logic
Features:
- Shard by URL hash across 3 DBs
- Handle resharding (add 4th shard)
- Implement read replicas
- Measure replication lag

Key Questions:
- What happens during resharding?
- How do you handle cross-shard queries?
- When does sharding become worth the complexity?
```

#### 3.3 Observability
**Topics:**
- Metrics, logs, traces (the three pillars)
- Alerting on meaningful signals
- Debugging distributed failures
- SLOs and error budgets

**Practical Project: Full Observability Stack**
```
Tech Stack: Prometheus + Grafana + Jaeger
Implement:
- Request latency histograms
- Error rate tracking
- Distributed tracing across services
- Meaningful alerts (not noise)

Key Learning: "If you can't measure it, you can't improve it"
```

---

## Phase 4: Real-World Systems (Months 10-12)

### Goal: Design complete systems from constraints

#### 4.1 Design Practice with Numbers
For each system, start with:
1. How many users?
2. Read/write ratio?
3. Data size and growth rate?
4. Latency requirements?
5. Availability requirements?

**Systems to Design:**
| System | Key Challenge | Start Simple |
|--------|--------------|--------------|
| Chat App | Real-time delivery | WebSocket + single server |
| Feed System | Fan-out vs fan-in | Pull-based first |
| Rate Limiter | Distributed state | In-memory first |
| Search | Indexing at scale | SQLite FTS first |
| File Storage | Large blob handling | Local filesystem first |

#### 4.2 Capstone Project: Simplified Twitter Clone
```
Tech Stack:
- Backend: Go or Node.js
- Database: PostgreSQL (start here, shard later)
- Cache: Redis (add when proven necessary)
- Queue: RabbitMQ (for async tasks)
- Search: Elasticsearch (for tweet search)
- Deployment: Kubernetes

Features (in order):
1. User registration/login
2. Post tweets
3. Follow users
4. Home timeline (start with fan-out-on-read)
5. Search tweets
6. Notifications

Evolution:
- Start: Single server, single DB
- Measure: Where are the bottlenecks?
- Scale: Add components ONLY when numbers force you

Document Every Decision:
- "Added cache because DB latency hit 200ms at 1000 QPS"
- "Switched to fan-out-on-write because read latency was unacceptable"
```

---

## The Practice Regime

### Daily (30 min)
- Read one system design blog post
- Ask: "What would I do differently? Why?"

### Weekly (2-3 hours)
- Pick one component from your project
- Remove it mentally - does the system still work?
- If yes, you didn't need it
- If no, document WHY it's necessary with numbers

### Monthly
- Mock interview with a friend
- Present your project's architecture
- Defend every box on the whiteboard

---

## Key Resources

### Books
1. **"Designing Data-Intensive Applications"** by Martin Kleppmann (Bible of distributed systems)
2. **"System Design Interview"** by Alex Xu (Good patterns, but remember to question them)
3. **"Database Internals"** by Alex Petrov (Deep understanding)

### Blogs & Papers
- [High Scalability](http://highscalability.com/) - Real-world architectures
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/) (Free online)
- [The Morning Paper](https://blog.acolyer.org/) - Academic papers explained

### YouTube Channels
- System Design Interview (mock interviews)
- Hussein Nasser (deep dives on DB and networking)
- MIT 6.824 Distributed Systems (free lectures)

---

## The Questions to Always Ask

Before adding ANY component:

1. **What problem does this solve?** (Be specific)
2. **What's the simplest solution that could work?**
3. **At what scale does the simple solution break?**
4. **What new failure modes does this component introduce?**
5. **How will I detect when it fails?**
6. **Can I prove with numbers that I need this?**

---

## Summary: The Path to L7-Level Thinking

```
Level 1: "I know the patterns" (Most candidates)
         ↓
Level 2: "I know WHEN to use patterns" (Good candidates)
         ↓
Level 3: "I start with the simplest thing and let constraints force complexity" (Senior engineers)
         ↓
Level 4: "I can reason about trade-offs in real-time with numbers" (Staff+ engineers)
```

**The secret:** Don't collect architectures. Collect constraints and the reasoning that leads to solutions.

---

## Your First Week Action Items

1. [ ] Set up a simple HTTP server (any language)
2. [ ] Add PostgreSQL, implement basic CRUD
3. [ ] Measure: How many requests/second can you handle?
4. [ ] Find the bottleneck with actual measurements
5. [ ] Document your findings

Start simple. Measure everything. Let the numbers guide you.

---

*"The best answer completely depends on the actual numbers you're working with, and whether you can defend the math."*
