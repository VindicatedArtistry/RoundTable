# Removed sqlite3 import
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime # Import datetime

from .base_dao import BaseDAO
from ..models import Material # Relative import for the model

class MaterialDAO(BaseDAO[Material]):
    """Data Access Object for managing Material data"""

    def __init__(self):
        # Initialize using Neo4j BaseDAO constructor
        super().__init__()
        # Schema (constraints/indexes) handled by BaseDAO

    # Removed _create_tables and _get_connection
    # Removed local helper methods - use driver conversion

    def create(self, entity: Material) -> Material: # Match BaseDAO signature
        """Create a new material record"""
        # Use Cypher query via BaseDAO
        query = """
        MERGE (m:Material {id: $id})
        ON CREATE SET
            m.name = $name,
            m.category = $category,
            m.description = $description,
            m.properties = $properties,
            m.source_references = $source_references,
            m.metadata = $metadata,
            m.created_at = $created_at,
            m.updated_at = $updated_at
        ON MATCH SET
            m.name = $name,
            m.category = $category,
            m.description = $description,
            m.properties = $properties,
            m.source_references = $source_references,
            m.metadata = $metadata,
            m.updated_at = $updated_at
        RETURN m
        """

        if not entity.id:
            entity.id = str(uuid.uuid4())
        now = datetime.now()
        if not entity.created_at:
             entity.created_at = now
        entity.updated_at = now

        # Pass model fields directly to params
        params = {
            "id": entity.id,
            "name": entity.name,
            "category": entity.category,
            "description": entity.description,
            "properties": entity.properties, # Pass dict
            "source_references": entity.source_references, # Pass list
            "metadata": entity.metadata, # Pass dict
            "created_at": entity.created_at, # Pass datetime
            "updated_at": entity.updated_at # Pass datetime
        }

        self.execute_query(query, params)
        return entity

    def get(self, id: str) -> Optional[Material]:
        """Retrieve a material by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (m:Material {id: $id}) RETURN m"
        results = self.execute_query(query, {"id": id})
        if not results:
            return None

        node = results[0].get('m')
        if not node:
            return None

        # Construct model directly from node properties
        return Material(
            id=node.get('id'),
            name=node.get('name'),
            category=node.get('category'),
            description=node.get('description'),
            properties=node.get('properties', {}), # Driver returns dict
            source_references=node.get('source_references', []), # Driver returns list
            metadata=node.get('metadata', {}), # Driver returns dict
            created_at=node.get('created_at'), # Driver returns datetime
            updated_at=node.get('updated_at')  # Driver returns datetime
        )

    def update(self, entity: Material) -> Material: # Match BaseDAO signature
        """Update an existing material record"""
        # Ensure updated_at is set and is a float
        # Use Cypher query via BaseDAO
        query = """
        MATCH (m:Material {id: $id})
        SET
            m.name = $name,
            m.category = $category,
            m.description = $description,
            m.properties = $properties,
            m.source_references = $source_references,
            m.metadata = $metadata,
            m.updated_at = $updated_at
        RETURN m
        """

        entity.updated_at = datetime.now() # Update timestamp

        params = {
            "id": entity.id,
            "name": entity.name,
            "category": entity.category,
            "description": entity.description,
            "properties": entity.properties,
            "source_references": entity.source_references,
            "metadata": entity.metadata,
            "updated_at": entity.updated_at
        }

        results = self.execute_query(query, params)
        if not results:
             raise ValueError(f"Material with ID {entity.id} not found for update")
        return entity

    def delete(self, node_id: str) -> bool:
        """Delete a material by ID"""
        query = "MATCH (m:Material {id: $node_id}) DETACH DELETE m"
        try:
            self.execute_query(query, {"node_id": node_id})
            return True
        except ValueError as e:
            print(f"Error deleting material {node_id}: {e}")
        return False

    def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Material]:
        """List materials with optional filters (e.g., by category, name search)"""
        # Use Cypher query via BaseDAO
        base_query = "MATCH (m:Material)"
        filter_clauses = []
        params = {}

        if filters:
            if "category" in filters and filters["category"]:
                filter_clauses.append("m.category = $category")
                params["category"] = filters["category"]
            if "name_like" in filters and filters["name_like"]:
                filter_clauses.append("m.name CONTAINS $name_like")
                params["name_like"] = filters["name_like"]
            # Add other filters as needed...
            # Example: Filtering by a property value (assumes numeric)
            # if "min_strength" in filters:
            #      filter_clauses.append("m.properties.tensile_strength_mpa >= $min_strength")
            #      params["min_strength"] = filters["min_strength"]

        if filter_clauses:
            base_query += " WHERE " + " AND ".join(filter_clauses)

        base_query += " RETURN m ORDER BY m.name ASC"

        results = self.execute_query(base_query, params)
        materials = []
        for result in results:
            node = result.get('m')
            if node:
                materials.append(Material(
                    id=node.get('id'),
                    name=node.get('name'),
                    category=node.get('category'),
                    description=node.get('description'),
                    properties=node.get('properties', {}),
                    source_references=node.get('source_references', []),
                    metadata=node.get('metadata', {}),
                    created_at=node.get('created_at'),
                    updated_at=node.get('updated_at')
                ))
        return materials

    # Add specific search methods, e.g., find_by_property_range
    # def find_by_property(self, prop_name: str, min_val: Optional[Any] = None, max_val: Optional[Any] = None) -> List[Material]:
    #      # Requires more complex JSON query or separate properties table
    #      pass
