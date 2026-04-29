export const researchExperiments = [
  {
    id: 'neuroagent-core',
    title: 'NeuroAgent Core Implementation',
    desc: 'Developed the foundational NeuroAgent struct in Rust. Features independent voltage trace dynamics and local adjacency lists avoiding static matrices.',
    status: 'Completed',
    abstract: 'Traditional Artificial Neural Networks (ANNs) rely on fixed topologies and static matrices. This research shifts to a constructivist graph where each node is an autonomous NeuroAgent. The graph begins in a tabula rasa state and physically forms or prunes synapses based on sequential exposure.',
    keyIdea: 'Using a directed graph of autonomous agents maintaining internal voltage states (Leaky Integrate-and-Fire) and localized physical synapses, eliminating matrix multiplications in favor of structural plasticity.',
    futureWork: 'Optimizing structural allocation on embedded CPU hardware to maximize performance per Watt during graph expansion.'
  },
  {
    id: 'hebbian-fusion',
    title: 'Hebbian Fusion & Sequence Learning',
    desc: 'Mechanisms for topological neurogenesis driven by spike-timing-dependent plasticity (STDP). Sequential firing natively chunks micro-agents into unified macro-concepts.',
    status: 'Completed',
    abstract: 'This project introduces physical chunking inspired by Hebbian rules—"cells that fire together, wire together." In our Digital Nervous System, when sequential patterns fire repeatedly, the synaptic weights approach maximum strength, triggering neurogenesis of higher-order concepts.',
    keyIdea: 'Simulating child language acquisition structurally. When elements like "over" and "all" sequentially trigger, fusion is initiated to form a monolithic "overall" agent without human-guided labeling.',
    futureWork: 'Introducing lateral inhibition (Winner-Take-All dynamics) to refine sequence boundaries and resolve semantic conflicts structurally.'
  },
  {
    id: 'entropy-filter',
    title: 'Entropy Filter Mechanism',
    desc: 'Resolving the hyper-association flaw in continuous learning by evaluating promiscuity. Dynamically inhibits fusion of high-frequency nodes to prevent graph collapse.',
    status: 'Active',
    abstract: 'A naive continuous sequence learning network fatally hyper-associates common stop words (e.g., "the") with vast vocabularies. Our Entropy Filter chemically blocks these overused connections from consolidating, maintaining discrete structure.',
    keyIdea: 'Calculating the connection degree (promiscuity) of source NeuroAgents before Neocortical consolidation. If branching factor exceeds threshold \\(\\theta\\), fusion is rejected via inhibitory gating.',
    futureWork: 'Dynamic tuning of the \\(\\theta\\) threshold using simulated Dopamine gradients for context-aware permissiveness.'
  },
  {
    id: 'dual-memory',
    title: 'Dual-State Memory Consolidation',
    desc: 'Implementing hippocampal-neocortical simulated boundaries. Fragile synapses progressively solidify into rigid storage based on temporal recall validation.',
    status: 'Active',
    abstract: 'VISTARA implements two distinct physiological synapse states: Hippocampal (plastic, weak, fast-learning) and Neocortical (rigid, permanent). Short-term environmental signals establish transient connections that require validation before long-term storage.',
    keyIdea: 'Preventing temporary noise from distorting established knowledge bases (catastrophic forgetting). Only reinforced connections survive the consolidation phase to become permanent associative links.',
    futureWork: 'Simulated sleep cycles for offline rebinding of disconnected or contradictory Neocortical facts.'
  },
  {
    id: 'spatiotemporal-polychronization',
    title: 'Spatiotemporal Polychronization',
    desc: 'Sequence recognition executed strictly through timing delays rather than spatial mapping, yielding deterministic lightning storms across the grid.',
    status: 'Ongoing',
    abstract: 'Information is not stored as static weight vectors but as precise electrical delays utilizing localized calcium traces. Specific data streams trigger repeatable spatiotemporal storms natively recognizing sequential structures.',
    keyIdea: 'Utilizing time-of-flight between neurons to determine valid sequences over static pattern matching, drastically decreasing false positives.',
    futureWork: 'Scaling the simulated time-step loop to sub-millisecond precision for hardware-level latency testing.'
  },
  {
    id: 'dynamic-stream-segmentation',
    title: 'Dynamic Stream Segmentation',
    desc: 'Real-time structural cutting (The Knife of Knowledge) leveraging maximal reach predictions to parse ambiguous inputs without spatial delimiters.',
    status: 'Completed',
    abstract: 'Natural stimuli lack explicit structural delimiters. We employ a Predictive Error mechanism evaluating characters continuously until the sequence breaks known constraints, forcing an instant structural split natively.',
    keyIdea: 'Employing the Principle of Maximal Reach—if a known sequence exhibits potential to evolve into a longer one, cutting is suppressed. This solves complex overlapping ambiguity in raw data streams.',
    futureWork: 'Expanding the Knife of Knowledge into noisy, time-series data like spatial audio and continuous visual telemetry.'
  },
  {
    id: 'cpu-efficient-execution',
    title: 'Rust Strict Borrow Optimization',
    desc: 'Decoupling Sensory/Read from Plasticity/Write phases using Rust\'s borrow checker. Produces a highly sparse, GPU-independent execution model.',
    status: 'Completed',
    abstract: 'By exploiting Rust\'s strict ownership model natively, VISTARA separates read cycles from synaptic modifications. This inadvertent biomimicry matches the absolute refractory period observed in real neural firings.',
    keyIdea: 'Achieving safe, concurrent read/write locks across massive graphs naturally, making the architecture capable of full deployment on ARM-based mobile devices without a discrete GPU.',
    futureWork: 'Benchmarking on embedded microcontrollers to completely disconnect from cloud-centric deployment environments.'
  },
  {
    id: 'vistara-cognitive-society',
    title: 'Multi-Agent Cognitive Layer (VISTARA)',
    desc: 'Scaling the primitive NeuroAgents into specialized, higher-order elements capable of logical planning, uncertainty detection, and debate arbitration.',
    status: 'Active',
    abstract: 'Building atop the foundational Digital Nervous System (DNS), VISTARA introduces a Cognitive Orchestrator. This layer houses specialized Physics, Economics, and Planning agents, collaborating through a simulated debate system.',
    keyIdea: 'Utilizing the underlying NeuroAgent grid to store World Models, acting as the memory baseline for specialized task schedulers and alignment agents to reason, plan, and verify actions iteratively.',
    futureWork: 'Enhancing the Counterfactual Engine (PWS++) within the World Model structure for high-fidelity future-state simulations.'
  }
];
