from __future__ import annotations
import uuid
from datetime import datetime
import logging
from typing import Any, cast
from typing_extensions import override

from .base_dao import BaseDAO # Use Neo4j BaseDAO
from ..models import SoftwareProject

class SoftwareProjectDAO(BaseDAO[SoftwareProject]): # Ensure inheritance
    """Data Access Object for managing Software Project data using Neo4j"""

    def __init__(self):
        # Initialize using Neo4j BaseDAO constructor
        super().__init__()
        # Schema (constraints/indexes) handled by BaseDAO

    @override
    def create(self, entity: SoftwareProject) -> SoftwareProject:
        """Create a new software project record"""
        # Use Cypher query via BaseDAO
        query = """
        MERGE (sp:SoftwareProject {id: $id})
        ON CREATE SET
            sp.name = $name,
            sp.description = $description,
            sp.parent_project_id = $parent_project_id,
            sp.status = $status,
            sp.version = $version,
            sp.repository_url = $repository_url,
            sp.issue_tracker_url = $issue_tracker_url,
            sp.target_platform = $target_platform,
            sp.deployment_status = $deployment_status,
            sp.start_date = $start_date,
            sp.target_release_date = $target_release_date,
            sp.actual_release_date = $actual_release_date,
            sp.team_members = $team_members,
            sp.metadata = $metadata,
            sp.created_at = $created_at,
            sp.updated_at = $updated_at
        ON MATCH SET
            sp.name = $name,
            sp.description = $description,
            sp.parent_project_id = $parent_project_id,
            sp.status = $status,
            sp.version = $version,
            sp.repository_url = $repository_url,
            sp.issue_tracker_url = $issue_tracker_url,
            sp.target_platform = $target_platform,
            sp.deployment_status = $deployment_status,
            sp.start_date = $start_date,
            sp.target_release_date = $target_release_date,
            sp.actual_release_date = $actual_release_date,
            sp.team_members = $team_members,
            sp.metadata = $metadata,
            sp.updated_at = $updated_at
        RETURN sp
        """

        if not entity.id:
            entity.id = str(uuid.uuid4())
        now = datetime.now()
        if not entity.created_at:
             entity.created_at = now
        entity.updated_at = entity.updated_at or datetime.now()

        # Pass model fields directly to params
        params = {
            "id": entity.id,
            "name": entity.name,
            "description": entity.description,
            "parent_project_id": entity.parent_project_id,
            "status": entity.status,
            "version": entity.version,
            "repository_url": entity.repository_url,
            "issue_tracker_url": entity.issue_tracker_url,
            "target_platform": entity.target_platform,
            "deployment_status": entity.deployment_status,
            "start_date": entity.start_date,
            "target_release_date": entity.target_release_date,
            "actual_release_date": entity.actual_release_date,
            "team_members": entity.team_members,
            "metadata": entity.metadata,
            "created_at": entity.created_at,
            "updated_at": entity.updated_at
        }

        _ = self.execute_query(query, params)
        return entity

    @override
    def get(self, node_id: str) -> SoftwareProject | None:
        """Retrieve a software project by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (sp:SoftwareProject {id: $node_id}) RETURN sp"
        results = self.execute_query(query, {"node_id": node_id})
        if results:
            # Use model_from_dict instead of direct unpacking
            node_data = results[0].get("sp")
            if node_data:
                # Assuming node_data is dict[str, Any] or similar
                return self.model_from_dict(cast(dict[str, Any], node_data))
        return None

    @override
    def model_from_dict(self, data: dict[str, Any]) -> SoftwareProject:
        """Convert a dictionary (from Neo4j node) to a SoftwareProject object"""
        # Neo4j often returns nested properties; adjust access accordingly
        # Provide defaults for fields that expect non-optional types in the model
        # Use cast to inform the type checker about expected types
        return SoftwareProject(
            id=cast(str, data.get('id', '')), # Assuming ID should ideally not be None here, but providing default
            name=cast(str, data.get('name', '')),
            description=cast(str, data.get('description', '')),
            parent_project_id=cast(str | None, data.get('parent_project_id')), # Optional in model
            status=cast(str, data.get('status', 'Unknown')), # Provide default status
            version=cast(str, data.get('version', '0.0.0')), # Provide default version
            repository_url=cast(str | None, data.get('repository_url')), # Optional in model
            issue_tracker_url=cast(str | None, data.get('issue_tracker_url')), # Optional in model
            target_platform=cast(str | None, data.get('target_platform')), # Optional in model
            deployment_status=cast(str | None, data.get('deployment_status')),
            start_date=cast(datetime | None, data.get('start_date')),
            target_release_date=cast(datetime | None, data.get('target_release_date')),
            actual_release_date=cast(datetime | None, data.get('actual_release_date')),
            team_members=cast(list[str], data.get('team_members', [])), # Assuming list[str]
            metadata=cast(dict[str, Any], data.get('metadata', {})),
            created_at=cast(datetime | None, data.get('created_at')),
            updated_at=cast(datetime | None, data.get('updated_at'))
        )

    @override
    def update(self, entity: SoftwareProject) -> SoftwareProject:
        """Update an existing software project record"""
        if not entity.id:
            # Raise ValueError if ID is missing, as update requires an ID
            raise ValueError("Cannot update SoftwareProject without an ID.")

        # Use Cypher query via BaseDAO
        query = """
        MATCH (sp:SoftwareProject {id: $id})
        SET
            sp.name = $name,
            sp.description = $description,
            sp.parent_project_id = $parent_project_id,
            sp.status = $status,
            sp.version = $version,
            sp.repository_url = $repository_url,
            sp.issue_tracker_url = $issue_tracker_url,
            sp.target_platform = $target_platform,
            sp.deployment_status = $deployment_status,
            sp.start_date = $start_date,
            sp.target_release_date = $target_release_date,
            sp.actual_release_date = $actual_release_date,
            sp.team_members = $team_members,
            sp.metadata = $metadata,
            sp.updated_at = $updated_at
        RETURN sp
        """

        entity.updated_at = datetime.now() # Update timestamp

        params = {
            "id": entity.id,
            "name": entity.name,
            "description": entity.description,
            "parent_project_id": entity.parent_project_id,
            "status": entity.status,
            "version": entity.version,
            "repository_url": entity.repository_url,
            "issue_tracker_url": entity.issue_tracker_url,
            "target_platform": entity.target_platform,
            "deployment_status": entity.deployment_status,
            "start_date": entity.start_date,
            "target_release_date": entity.target_release_date,
            "actual_release_date": entity.actual_release_date,
            "team_members": entity.team_members,
            "metadata": entity.metadata,
            "updated_at": entity.updated_at
        }

        results = self.execute_query(query, params)

        if not results:
            # Log that the update didn't return expected results, but return the entity
            # as the signature requires SoftwareProject, not SoftwareProject | None.
            logging.warning(f"Update query for SoftwareProject {entity.id} did not return results. Returning original entity.")
            # Potentially consider raising an exception here if confirmation is critical.

        # Even if results are empty, return the entity to match the signature
        return entity

    @override
    def delete(self, node_id: str) -> bool:
        """Delete a software project node by its ID"""
        query = "MATCH (sp:SoftwareProject {id: $node_id}) DETACH DELETE sp"
        try:
            _ = self.execute_query(query, {"node_id": node_id}) # Assign result to _
            return True
        except ValueError as e:
            logging.error(f"Error deleting software project {node_id}: {e}")
            return False

    @override
    def list(self, filters: dict[str, Any] | None = None) -> list[SoftwareProject]:
        """List software projects with optional filters"""
        # Base query
        base_query = "MATCH (sp:SoftwareProject)"
        where_clauses: list[str] = []
        query_params: dict[str, Any] = {}

        if filters: # filters is Optional[dict[str, Any]]
            for key, value in filters.items():
                # Basic filtering example, needs refinement based on model fields
                if value is not None:
                    param_name = f"filter_{key}"
                    where_clauses.append(f"sp.{key} = ${param_name}")
                    query_params[param_name] = value

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)

        base_query += " RETURN sp ORDER BY sp.updated_at DESC"

        results = self.execute_query(base_query, query_params)
        projects: list[SoftwareProject] = [] # Explicitly type the list
        for result in results:
            node = result.get('sp')
            if node:
                # Cast node before passing to model_from_dict
                projects.append(self.model_from_dict(cast(dict[str, Any], node)))
        return projects
