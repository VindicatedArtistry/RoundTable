# Removed sqlite3 import
from typing import List, Optional, Dict, Any
# Removed Path import (not needed for Neo4j DAO)
import uuid
from datetime import datetime

from .base_dao import BaseDAO # Import Neo4j BaseDAO
# Removed json import
from ..models import Specification # Relative import for the model

class SpecificationDAO(BaseDAO[Specification]): # Inherit from BaseDAO
    """Data Access Object for managing Engineering Specification data using Neo4j"""

    def __init__(self):
        # Initialize using Neo4j BaseDAO constructor
        super().__init__()
        # Schema initialization (constraints/indexes) is handled by BaseDAO

    # Removed _create_tables, _get_connection, and helper methods
    # These are now handled by BaseDAO or the Neo4j driver directly

    def create(self, entity: Specification) -> Specification: # Match BaseDAO signature
        """Create a new specification record"""
        # ID generation moved here
        if not entity.id:
            entity.id = str(uuid.uuid4())
        # Use Cypher query via BaseDAO
        query = """
        MERGE (s:Specification {id: $id})
        ON CREATE SET
            s.project_id = $project_id,
            s.name = $name,
            s.version = $version,
            s.description = $description,
            s.requirements = $requirements,
            s.linked_materials = $linked_materials,
            s.metadata = $metadata,
            s.created_at = $created_at,
            s.updated_at = $updated_at
        ON MATCH SET
            s.project_id = $project_id,
            s.name = $name,
            s.version = $version,
            s.description = $description,
            s.requirements = $requirements,
            s.linked_materials = $linked_materials,
            s.metadata = $metadata,
            s.updated_at = $updated_at
        RETURN s
        """

        # ID generation is now handled within the if block below
        if not entity.created_at:
             entity.created_at = datetime.now()
        entity.updated_at = datetime.now()

        # Pass model fields directly to params
        params = {
            "id": entity.id,
            "project_id": entity.project_id,
            "name": entity.name,
            "version": entity.version,
            "description": entity.description,
            "requirements": entity.requirements, # Pass list directly
            "linked_materials": entity.linked_materials, # Pass list directly
            "metadata": entity.metadata, # Pass dict directly
            "created_at": entity.created_at, # Pass datetime directly
            "updated_at": entity.updated_at # Pass datetime directly
        }

        self.execute_query(query, params)
        return entity

    def get(self, id: str) -> Optional[Specification]:
        """Retrieve a specification by ID using Cypher"""
        query = "MATCH (s:Specification {id: $id}) RETURN s"
        results = self.execute_query(query, {"id": id})
        if not results:
            return None

        node = results[0].get('s')
        if not node:
            return None

        # Construct model directly from node properties (driver handles types)
        return Specification(
            id=node.get('id'),
            project_id=node.get('project_id'),
            name=node.get('name'),
            version=node.get('version'),
            description=node.get('description'),
            requirements=node.get('requirements', []), # Default to empty list
            linked_materials=node.get('linked_materials', []), # Default to empty list
            metadata=node.get('metadata', {}), # Default to empty dict
            created_at=node.get('created_at'), # Driver returns datetime
            updated_at=node.get('updated_at')  # Driver returns datetime
        )

    def update(self, entity: Specification) -> Specification: # Match BaseDAO signature
        """Update an existing specification record"""
        # Ensure updated_at is set and is a float
        # Assign datetime object to model
        # Use Cypher query via BaseDAO
        query = """
        MATCH (s:Specification {id: $id})
        SET
            s.project_id = $project_id,
            s.name = $name,
            s.version = $version,
            s.description = $description,
            s.requirements = $requirements,
            s.linked_materials = $linked_materials,
            s.metadata = $metadata,
            s.updated_at = $updated_at
        RETURN s
        """

        entity.updated_at = datetime.now() # Update timestamp

        # Pass model fields directly to params
        params = {
            "id": entity.id,
            "project_id": entity.project_id,
            "name": entity.name,
            "version": entity.version,
            "description": entity.description,
            "requirements": entity.requirements,
            "linked_materials": entity.linked_materials,
            "metadata": entity.metadata,
            "updated_at": entity.updated_at
        }

        results = self.execute_query(query, params)
        if not results:
             raise ValueError(f"Specification with ID {entity.id} not found for update")
        return entity

    def delete(self, id: str) -> bool:
        """Delete a specification by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (s:Specification {id: $id}) DETACH DELETE s"
        try:
             # execute_query returns list of dicts, not rowcount directly
             # We might need a way to check if delete was successful,
             # but for now, just execute. Assume success if no exception.
             self.execute_query(query, {"id": id})
             return True
        except Exception as e:
             # Log error properly using BaseDAO logger if available, or print
             print(f"Error deleting specification {id}: {e}")
             return False

    def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Specification]:
        """List specifications with optional filters (e.g., by project_id)"""
        # Use Cypher query via BaseDAO
        base_query = "MATCH (s:Specification)"
        where_clauses = []
        params = {}

        if filters:
            if "project_id" in filters and filters["project_id"]:
                 where_clauses.append("s.project_id = $project_id")
                 params["project_id"] = filters["project_id"]
            if "name_like" in filters and filters["name_like"]:
                 where_clauses.append("s.name CONTAINS $name_like")
                 params["name_like"] = filters["name_like"]
            # Add other filters as needed...

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)

        base_query += " RETURN s ORDER BY s.project_id, s.name, s.version DESC"

        results = self.execute_query(base_query, params)
        specifications = []
        for result in results:
            node = result.get('s')
            if node:
                 # Construct model directly from node properties
                 specifications.append(Specification(
                     id=node.get('id'),
                     project_id=node.get('project_id'),
                     name=node.get('name'),
                     version=node.get('version'),
                     description=node.get('description'),
                     requirements=node.get('requirements', []),
                     linked_materials=node.get('linked_materials', []),
                     metadata=node.get('metadata', {}),
                     created_at=node.get('created_at'),
                     updated_at=node.get('updated_at')
                 ))
        return specifications

    # Method specifically to list specs for a given project might be useful
    def list_by_project(self, project_id: str) -> List[Specification]:
        """Retrieve all specifications linked to a specific project"""
        return self.list(filters={"project_id": project_id})
