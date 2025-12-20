"""
Simple script to run the Self-Healing RAG system and test it with example queries.
This script initializes the system and runs some demo queries.
"""

import asyncio
from self_healing_rag import autorag_with_diff, startup_event, embedder, base_index, base_chunks

async def main():
    """Initialize and test the RAG system."""
    print("=" * 70)
    print("Initializing Self-Healing RAG System...")
    print("=" * 70)
    
    # Initialize the system
    await startup_event()
    
    print("\n" + "=" * 70)
    print("System Ready! Running Demo Queries...")
    print("=" * 70 + "\n")
    
    # Demo queries
    demo_queries = [
        {
            "query": "What is quantum computing?",
            "threshold": 0.5
        },
        {
            "query": "What are the latest AI regulations in Europe?",
            "threshold": 0.5
        },
        {
            "query": "How does OAuth authentication work?",
            "threshold": 0.5
        }
    ]
    
    for i, demo in enumerate(demo_queries, 1):
        print(f"\n{'=' * 70}")
        print(f"Demo Query {i}: {demo['query']}")
        print(f"{'=' * 70}\n")
        
        result = autorag_with_diff(
            query=demo['query'],
            threshold=demo['threshold'],
            k=5,
            use_healing=True
        )
        
        print(f"Trust Score (before): {result['score_before']:.3f}")
        print(f"Trust Score (after): {result['score_after']:.3f}")
        print(f"Healing Triggered: {'Yes ' if result['healing_triggered'] else 'No'}")
        print(f"Healing Successful: {'Yes ' if result['healing_successful'] else 'No'}")
        print(f"\nSources Used:")
        for source in result['sources_used']:
            print(f"  • {source}")
        
        print(f"\n{'─' * 70}")
        print("BEFORE (Base Knowledge Only):")
        print(f"{'─' * 70}")
        print(result['before_answer'])
        
        print(f"\n{'─' * 70}")
        print("AFTER (With Self-Healing):")
        print(f"{'─' * 70}")
        print(result['after_answer'])
        print("\n")
    
    print("\n" + "=" * 70)
    print("Demo Complete!")
    print("=" * 70)
    print("\nTo run as a FastAPI server, use:")
    print("  python self_healing_rag.py")
    print("\nOr:")
    print("  uvicorn self_healing_rag:app --reload --host 0.0.0.0 --port 8000")
    print("\nThen visit:")
    print("  http://localhost:8000/docs  (Interactive API documentation)")
    print("  http://localhost:8000/      (API information)")

if __name__ == "__main__":
    asyncio.run(main())

