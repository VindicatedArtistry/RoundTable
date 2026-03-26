# Removed sqlite3, Path imports
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from .base_dao import BaseDAO # Use Neo4j BaseDAO
from ..models import Project

class ProjectDAO(BaseDAO[Project]): # Ensure inheritance
    """Data Access Object for managing Project data using Neo4j"""

    def __init__(self):
        # Initialize using Neo4j BaseDAO constructor
        super().__init__()
        # Schema (constraints/indexes) handled by BaseDAO

    # Removed _create_tables and _get_connection


    def create(self, entity: Project) -> Project: # Match BaseDAO signature
        """Create a new project record"""
        # Use Cypher query via BaseDAO
        query = """
        MERGE (p:Project {id: $id})
        ON CREATE SET
            p.name = $name,
            p.description = $description,
            p.status = $status,
            p.start_date = $start_date,
            p.target_date = $target_date,
            p.completion_date = $completion_date,
            p.team_members = $team_members,
            p.metadata = $metadata,
            p.created_at = $created_at,
            p.updated_at = $updated_at
        ON MATCH SET
            p.name = $name,
            p.description = $description,
            p.status = $status,
            p.start_date = $start_date,
            p.target_date = $target_date,
            p.completion_date = $completion_date,
            p.team_members = $team_members,
            p.metadata = $metadata,
            p.updated_at = $updated_at
        RETURN p
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
            "description": entity.description,
            "status": entity.status,
            "start_date": entity.start_date, # Pass datetime or None
            "target_date": entity.target_date, # Pass datetime or None
            "completion_date": entity.completion_date, # Pass datetime or None
            "team_members": entity.team_members, # Pass list
            "metadata": entity.metadata, # Pass dict
            "created_at": entity.created_at, # Pass datetime
            "updated_at": entity.updated_at # Pass datetime
        }

        self.execute_query(query, params)
        return entity

    def get(self, id: str) -> Optional[Project]:
        """Retrieve a project by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (p:Project {id: $id}) RETURN p"
        results = self.execute_query(query, {"id": id})
        if not results:
            return None

        node = results[0].get('p')
        if not node:
            return None

        # Construct model directly from node properties
        return Project(
            id=node.get('id'),
            name=node.get('name'),
            description=node.get('description'),
            status=node.get('status'),
            start_date=node.get('start_date'), # Driver returns datetime or None
            target_date=node.get('target_date'), # Driver returns datetime or None
            completion_date=node.get('completion_date'), # Driver returns datetime or None
            team_members=node.get('team_members', []), # Driver returns list
            metadata=node.get('metadata', {}), # Driver returns dict
            created_at=node.get('created_at'), # Driver returns datetime
            updated_at=node.get('updated_at')  # Driver returns datetime
        )

    def update(self, entity: Project) -> Project: # Match BaseDAO signature
        """Update an existing project record"""
        # Use Cypher query via BaseDAO
        query = """
        MATCH (p:Project {id: $id})
        SET
            p.name = $name,
            p.description = $description,
            p.status = $status,
            p.start_date = $start_date,
            p.target_date = $target_date,
            p.completion_date = $completion_date,
            p.team_members = $team_members,
            p.metadata = $metadata,
            p.updated_at = $updated_at
        RETURN p
        """

        entity.updated_at = datetime.now() # Update timestamp

        # Pass model fields directly to params
        params = {
            "id": entity.id,
            "name": entity.name,
            "description": entity.description,
            "status": entity.status,
            "start_date": entity.start_date,
            "target_date": entity.target_date,
            "completion_date": entity.completion_date,
            "team_members": entity.team_members,
            "metadata": entity.metadata,
            "updated_at": entity.updated_at
        }

        results = self.execute_query(query, params)
        if not results:
             raise ValueError(f"Project with ID {entity.id} not found for update")
        return entity

    def delete(self, id: str) -> bool:
        """Delete a project by ID"""
        # Consider related data deletion (e.g., specifications) if needed
        # Use Cypher query via BaseDAO
        # Note: DETACH DELETE removes node and relationships
        query = "MATCH (p:Project {id: $id}) DETACH DELETE p"
        try:
             self.execute_query(query, {"id": id})
             return True
        except Exception as e:
             print(f"Error deleting project {id}: {e}")
             return False

    def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Project]:
        """List projects with optional filters"""
        # Use Cypher query via BaseDAO
        base_query = "MATCH (p:Project)"
        where_clauses = []
        params = {}

        if filters:
            if "status" in filters and filters["status"]:
                 where_clauses.append("p.status = $status")
                 params["status"] = filters["status"]
            if "team_member" in filters and filters["team_member"]:
                 # Check if a team member ID is IN the list property
                 where_clauses.append("$team_member IN p.team_members")
                 params["team_member"] = filters["team_member"]
            # Add other filters as needed...

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)

        base_query += " RETURN p ORDER BY p.updated_at DESC"

        results = self.execute_query(base_query, params)
        projects = []
        for result in results:
            node = result.get('p')
            if node:
                 # Construct model directly from node properties
                 projects.append(Project(
                     id=node.get('id'),
                     name=node.get('name'),
                     description=node.get('description'),
                     status=node.get('status'),
                     start_date=node.get('start_date'),
                     target_date=node.get('target_date'),
                     completion_date=node.get('completion_date'),
                     team_members=node.get('team_members', []),
                     metadata=node.get('metadata', {}),
                     created_at=node.get('created_at'),
                     updated_at=node.get('updated_at')
                 ))
        return projects

    # Add specific search methods if needed, e.g., find_by_name, find_by_status...
