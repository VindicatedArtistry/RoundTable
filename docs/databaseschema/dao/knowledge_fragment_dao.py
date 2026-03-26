# r:\quantumfold_v2\build\lib\dao\knowledge_fragment_dao.py
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from .base_dao import BaseDAO
from ..models import KnowledgeFragment # Relative import for the model

class KnowledgeFragmentDAO(BaseDAO[KnowledgeFragment]):
    """Data Access Object for managing KnowledgeFragment data and its relationships."""

    def __init__(self):
        super().__init__()
        # Ensure constraints and indexes are set (idempotent operation)
        self.execute_query("CREATE CONSTRAINT IF NOT EXISTS FOR (kf:KnowledgeFragment) REQUIRE kf.id IS UNIQUE")
        self.execute_query("CREATE INDEX IF NOT EXISTS FOR (kf:KnowledgeFragment) ON (kf.fragment_type)")
        self.execute_query("CREATE INDEX IF NOT EXISTS FOR (kf:KnowledgeFragment) ON (kf.tags)")


    def create(self, entity: KnowledgeFragment) -> KnowledgeFragment:
        """Create a new knowledge fragment record."""
        query = """
        MERGE (kf:KnowledgeFragment {id: $id})
        ON CREATE SET
            kf.title = $title,
            kf.content = $content,
            kf.fragment_type = $fragment_type,
            kf.source_references = $source_references,
            kf.confidence_score = $confidence_score,
            kf.tags = $tags,
            kf.created_at = $created_at,
            kf.updated_at = $updated_at,
            kf.last_accessed_at = $last_accessed_at
        ON MATCH SET
            kf.title = $title,
            kf.content = $content,
            kf.fragment_type = $fragment_type,
            kf.source_references = $source_references,
            kf.confidence_score = $confidence_score,
            kf.tags = $tags,
            kf.updated_at = $updated_at,
            kf.last_accessed_at = $last_accessed_at
        RETURN kf
        """
        if not entity.id:
            entity.id = str(uuid.uuid4())
        now = datetime.now()
        if not entity.created_at:
            entity.created_at = now
        entity.updated_at = now
        if not entity.last_accessed_at: # Initialize last_accessed_at
            entity.last_accessed_at = now

        params = entity.dict() # Use Pydantic's dict() method
        
        # Ensure datetime objects are correctly passed or converted if necessary
        # Neo4j driver typically handles Python datetime objects well
        # If issues arise, convert to ISO format string: entity.created_at.isoformat()

        self.execute_query(query, params)
        return entity

    def get(self, id: str) -> Optional[KnowledgeFragment]:
        """Retrieve a knowledge fragment by ID."""
        query = "MATCH (kf:KnowledgeFragment {id: $id}) RETURN kf"
        results = self.execute_query(query, {"id": id})
        if not results or not results[0]:
            return None
        
        node_data = results[0].get('kf')
        if not node_data:
            return None
        
        # Handle potential string to datetime conversion if necessary
        # For example, if created_at is stored as string:
        # created_at_val = node_data.get('created_at')
        # if isinstance(created_at_val, str):
        #     node_data['created_at'] = datetime.fromisoformat(created_at_val)
        # Similar for updated_at and last_accessed_at

        return KnowledgeFragment(**node_data)

    def update(self, entity: KnowledgeFragment) -> KnowledgeFragment:
        """Update an existing knowledge fragment record."""
        query = """
        MATCH (kf:KnowledgeFragment {id: $id})
        SET
            kf.title = $title,
            kf.content = $content,
            kf.fragment_type = $fragment_type,
            kf.source_references = $source_references,
            kf.confidence_score = $confidence_score,
            kf.tags = $tags,
            kf.updated_at = $updated_at,
            kf.last_accessed_at = $last_accessed_at
        RETURN kf
        """
        entity.updated_at = datetime.now()
        # entity.last_accessed_at = datetime.now() # Optionally update on any modification

        params = entity.dict()
        # Remove id from params for SET clause if it's immutable or handled by MATCH
        # params.pop('id', None) 
        # params.pop('created_at', None) # created_at should not be updated

        self.execute_query(query, params)
        return entity

    def delete(self, id: str) -> bool:
        """Delete a knowledge fragment by ID."""
        # Also consider deleting relationships associated with this node
        query = "MATCH (kf:KnowledgeFragment {id: $id}) DETACH DELETE kf"
        results = self.execute_query(query, {"id": id})
        # Check query success based on summary (e.g., nodes_deleted > 0)
        return True # Placeholder, refine based on actual result checking

    def get_all(self) -> List[KnowledgeFragment]:
        """Retrieve all knowledge fragments."""
        query = "MATCH (kf:KnowledgeFragment) RETURN kf"
        results = self.execute_query(query)
        return [KnowledgeFragment(**result.get('kf')) for result in results if result.get('kf')]

    def add_learned_from_relationship(self, kf_id: str, source_id: str, source_label: str):
        """
        Create a LEARNED_FROM relationship between a KnowledgeFragment and its source.
        Source can be Experience, Message, or Project.
        """
        # Validate source_label to prevent Cypher injection if it's dynamic
        valid_source_labels = ["Experience", "Message", "Project"]
        if source_label not in valid_source_labels:
            raise ValueError(f"Invalid source_label: {source_label}. Must be one of {valid_source_labels}")

        query = f"""
        MATCH (kf:KnowledgeFragment {{id: $kf_id}})
        MATCH (source:{source_label} {{id: $source_id}})
        MERGE (kf)-[:LEARNED_FROM]->(source)
        """
        params = {"kf_id": kf_id, "source_id": source_id}
        self.execute_query(query, params)

    def add_related_to_relationship(
        self, 
        kf_id_from: str, 
        target_id: str, 
        target_label: str,
        relation_type: str, 
        strength: float
    ):
        """
        Create a RELATED_TO relationship between a KnowledgeFragment and another target node.
        Target can be KnowledgeFragment, Experience, or Project.
        """
        valid_target_labels = ["KnowledgeFragment", "Experience", "Project"]
        if target_label not in valid_target_labels:
            raise ValueError(f"Invalid target_label: {target_label}. Must be one of {valid_target_labels}")

        query = f"""
        MATCH (kf_from:KnowledgeFragment {{id: $kf_id_from}})
        MATCH (target_node:{target_label} {{id: $target_id}})
        MERGE (kf_from)-[r:RELATED_TO]->(target_node)
        ON CREATE SET r.relation_type = $relation_type, r.strength = $strength
        ON MATCH SET r.relation_type = $relation_type, r.strength = $strength 
        """
        # ON MATCH updates properties if relationship already exists
        params = {
            "kf_id_from": kf_id_from,
            "target_id": target_id,
            "relation_type": relation_type,
            "strength": strength
        }
        self.execute_query(query, params)

    def add_initiated_by_relationship(self, kf_id: str, ai_id: str):
        """
        Create an INITIATED_BY relationship between DigitalConsciousness (AI) and a KnowledgeFragment.
        Assumes DigitalConsciousness node has label 'DigitalConsciousness' and id property.
        """
        query = """
        MATCH (ai:DigitalConsciousness {id: $ai_id}) 
        MATCH (kf:KnowledgeFragment {id: $kf_id})
        MERGE (ai)-[:INITIATED_BY]->(kf)
        """
        # Consider if DigitalConsciousness label is AI_Self or Assistant based on your models
        # If using Assistant model: MATCH (ai:Assistant {id: $ai_id})
        params = {"kf_id": kf_id, "ai_id": ai_id}
        self.execute_query(query, params)

    def get_knowledge_fragments_learned_from(self, source_id: str, source_label: str) -> List[KnowledgeFragment]:
        """Retrieve KnowledgeFragments learned from a specific source."""
        valid_source_labels = ["Experience", "Message", "Project"]
        if source_label not in valid_source_labels:
            raise ValueError(f"Invalid source_label: {source_label}")
        
        query = f"""
        MATCH (kf:KnowledgeFragment)-[:LEARNED_FROM]->(source:{source_label} {{id: $source_id}})
        RETURN kf
        """
        results = self.execute_query(query, {"source_id": source_id})
        return [KnowledgeFragment(**result.get('kf')) for result in results if result.get('kf')]

    def get_related_knowledge_fragments(self, kf_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve KnowledgeFragments related to a given KnowledgeFragment, 
        including the relationship properties.
        """
        query = """
        MATCH (kf1:KnowledgeFragment {id: $kf_id})-[r:RELATED_TO]->(kf2:KnowledgeFragment)
        RETURN kf2, r.relation_type AS relation_type, r.strength AS strength
        UNION
        MATCH (kf1:KnowledgeFragment {id: $kf_id})<-[r:RELATED_TO]-(kf2:KnowledgeFragment)
        RETURN kf2, r.relation_type AS relation_type, r.strength AS strength
        """
        # This query finds KF related in both directions.
        # You might want separate methods or flags for direction if needed.
        results = self.execute_query(query, {"kf_id": kf_id})
        
        related_data = []
        for record in results:
            kf_node_data = record.get('kf2')
            if kf_node_data:
                related_data.append({
                    "knowledge_fragment": KnowledgeFragment(**kf_node_data),
                    "relation_type": record.get('relation_type'),
                    "strength": record.get('strength')
                })
        return related_data
    
    def get_knowledge_fragments_initiated_by(self, ai_id: str) -> List[KnowledgeFragment]:
        """Retrieve KnowledgeFragments initiated by the AI."""
        query = """
        MATCH (ai:DigitalConsciousness {id: $ai_id})-[:INITIATED_BY]->(kf:KnowledgeFragment)
        RETURN kf
        """
        # Adjust 'DigitalConsciousness' if your AI node label is different (e.g., 'Assistant')
        results = self.execute_query(query, {"ai_id": ai_id})
        return [KnowledgeFragment(**result.get('kf')) for result in results if result.get('kf')]

# Example usage (for testing or service layer):
# if __name__ == '__main__':
#     dao = KnowledgeFragmentDAO()
#     # Create a dummy AI node for relationship testing if it doesn't exist
#     # dao.execute_query("MERGE (:DigitalConsciousness {id: 'ai_test_id', name: 'TestAI'})")
    
#     # Test create
#     kf_data = {
#         "title": "Test KF", "content": "Some data", "fragment_type": "fact",
#         "source_references": ["doc1"], "confidence_score": 0.9, "tags": ["test", "example"]
#     }
#     new_kf = dao.create(KnowledgeFragment(**kf_data))
#     print(f"Created KF: {new_kf.id}")

#     # Test get
#     retrieved_kf = dao.get(new_kf.id)
#     print(f"Retrieved KF: {retrieved_kf.title if retrieved_kf else 'Not found'}")

#     # Test add_initiated_by_relationship
#     # dao.add_initiated_by_relationship(new_kf.id, "ai_test_id")
#     # print(f"Added INITIATED_BY relationship for KF {new_kf.id}")
    
#     # Test get_knowledge_fragments_initiated_by
#     # initiated_kfs = dao.get_knowledge_fragments_initiated_by("ai_test_id")
#     # print(f"KFs initiated by ai_test_id: {[kf.title for kf in initiated_kfs]}")

#     # Clean up test data
#     # dao.delete(new_kf.id)
#     # dao.execute_query("MATCH (ai:DigitalConsciousness {id: 'ai_test_id'}) DETACH DELETE ai")
#     # print(f"Deleted KF: {new_kf.id} and test AI")
