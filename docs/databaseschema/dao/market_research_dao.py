# Removed sqlite3, Path imports
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from .base_dao import BaseDAO # Use Neo4j BaseDAO
from ..models import MarketResearch

class MarketResearchDAO(BaseDAO[MarketResearch]): # Ensure inheritance
    """Data Access Object for managing Market Research data using Neo4j"""

    def __init__(self):
        # Initialize using Neo4j BaseDAO constructor
        super().__init__()
        # Schema (constraints/indexes) handled by BaseDAO

    # Removed _create_tables and _get_connection
    # Removed local helper methods - use driver conversion

    def create(self, entity: MarketResearch) -> MarketResearch: # Match BaseDAO signature
        """Create a new market research record"""
        # Use Cypher query via BaseDAO
        query = """
        MERGE (mr:MarketResearch {id: $id})
        ON CREATE SET
            mr.title = $title,
            mr.summary = $summary,
            mr.research_date = $research_date,
            mr.related_project_ids = $related_project_ids,
            mr.related_material_ids = $related_material_ids,
            mr.sources = $sources,
            mr.keywords = $keywords,
            mr.data = $data,
            mr.metadata = $metadata,
            mr.created_at = $created_at,
            mr.updated_at = $updated_at
        ON MATCH SET
            mr.title = $title,
            mr.summary = $summary,
            mr.research_date = $research_date,
            mr.related_project_ids = $related_project_ids,
            mr.related_material_ids = $related_material_ids,
            mr.sources = $sources,
            mr.keywords = $keywords,
            mr.data = $data,
            mr.metadata = $metadata,
            mr.updated_at = $updated_at
        RETURN mr
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
            "title": entity.title,
            "summary": entity.summary,
            "research_date": entity.research_date, # Pass datetime or None
            "related_project_ids": entity.related_project_ids, # Pass list
            "related_material_ids": entity.related_material_ids, # Pass list
            "sources": entity.sources, # Pass list
            "keywords": entity.keywords, # Pass list
            "data": entity.data, # Pass dict
            "metadata": entity.metadata, # Pass dict
            "created_at": entity.created_at, # Pass datetime
            "updated_at": entity.updated_at # Pass datetime
        }

        self.execute_query(query, params)
        return entity

    def get(self, id: str) -> Optional[MarketResearch]:
        """Retrieve a market research record by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (mr:MarketResearch {id: $id}) RETURN mr"
        results = self.execute_query(query, {"id": id})
        if not results:
            return None

        node = results[0].get('mr')
        if not node:
            return None

        # Construct model directly from node properties
        return MarketResearch(
            id=node.get('id'),
            title=node.get('title'),
            summary=node.get('summary'),
            research_date=node.get('research_date'), # Driver returns datetime or None
            related_project_ids=node.get('related_project_ids', []),
            related_material_ids=node.get('related_material_ids', []),
            sources=node.get('sources', []),
            keywords=node.get('keywords', []),
            data=node.get('data', {}),
            metadata=node.get('metadata', {}),
            created_at=node.get('created_at'), # Driver returns datetime
            updated_at=node.get('updated_at')  # Driver returns datetime
        )

    def update(self, entity: MarketResearch) -> MarketResearch: # Match BaseDAO signature
        """Update an existing market research record"""
        # Use Cypher query via BaseDAO
        query = """
        MATCH (mr:MarketResearch {id: $id})
        SET
            mr.title = $title,
            mr.summary = $summary,
            mr.research_date = $research_date,
            mr.related_project_ids = $related_project_ids,
            mr.related_material_ids = $related_material_ids,
            mr.sources = $sources,
            mr.keywords = $keywords,
            mr.data = $data,
            mr.metadata = $metadata,
            mr.updated_at = $updated_at
        RETURN mr
        """

        entity.updated_at = datetime.now() # Update timestamp

        params = {
            "id": entity.id,
            "title": entity.title,
            "summary": entity.summary,
            "research_date": entity.research_date,
            "related_project_ids": entity.related_project_ids,
            "related_material_ids": entity.related_material_ids,
            "sources": entity.sources,
            "keywords": entity.keywords,
            "data": entity.data,
            "metadata": entity.metadata,
            "updated_at": entity.updated_at
        }

        results = self.execute_query(query, params)
        if not results:
             raise ValueError(f"MarketResearch with ID {entity.id} not found for update")
        return entity

    def delete(self, id: str) -> bool:
        """Delete a market research record by ID"""
        # Use Cypher query via BaseDAO
        query = "MATCH (mr:MarketResearch {id: $id}) DETACH DELETE mr"
        try:
             self.execute_query(query, {"id": id})
             return True
        except Exception as e:
             print(f"Error deleting market research {id}: {e}")
             return False

    def list(self, filters: Optional[Dict[str, Any]] = None) -> List[MarketResearch]:
        """List market research records with optional filters"""
        # Use Cypher query via BaseDAO
        base_query = "MATCH (mr:MarketResearch)"
        where_clauses = []
        params = {}

        if filters:
            if "keyword" in filters and filters["keyword"]:
                 # Check if keyword is IN the list property
                 where_clauses.append("$keyword IN mr.keywords")
                 params["keyword"] = filters["keyword"]
            if "project_id" in filters and filters["project_id"]:
                 where_clauses.append("$project_id IN mr.related_project_ids")
                 params["project_id"] = filters["project_id"]
            if "material_id" in filters and filters["material_id"]:
                 where_clauses.append("$material_id IN mr.related_material_ids")
                 params["material_id"] = filters["material_id"]
            # Add date range filters...
            if "start_date" in filters and filters["start_date"]:
                 where_clauses.append("mr.research_date >= $start_date")
                 params["start_date"] = filters["start_date"] # Pass datetime
            if "end_date" in filters and filters["end_date"]:
                 where_clauses.append("mr.research_date <= $end_date")
                 params["end_date"] = filters["end_date"] # Pass datetime

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)

        base_query += " RETURN mr ORDER BY mr.research_date DESC, mr.updated_at DESC"

        results = self.execute_query(base_query, params)
        records = []
        for result in results:
            node = result.get('mr')
            if node:
                 records.append(MarketResearch(
                     id=node.get('id'),
                     title=node.get('title'),
                     summary=node.get('summary'),
                     research_date=node.get('research_date'),
                     related_project_ids=node.get('related_project_ids', []),
                     related_material_ids=node.get('related_material_ids', []),
                     sources=node.get('sources', []),
                     keywords=node.get('keywords', []),
                     data=node.get('data', {}),
                     metadata=node.get('metadata', {}),
                     created_at=node.get('created_at'),
                     updated_at=node.get('updated_at')
                 ))
        return records

    # Add specific search methods (e.g., search_by_keyword more efficiently if using FTS)
    # def search_summary_keywords(...) -> List[MarketResearch]: ...
