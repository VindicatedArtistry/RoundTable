import os
import logging
"""
Base Data Access Object for Neo4j operations.
Provides connection, schema initialization, and query execution utilities.
"""

from typing import TypeVar, Generic, Any, LiteralString, cast
from neo4j import GraphDatabase, Driver
from dotenv import load_dotenv

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

T = TypeVar('T')

class BaseDAO(Generic[T]):
    """Base Data Access Object for Neo4j operations"""
    _driver: Driver

    def __init__(self):
        _ = load_dotenv()
        logger.debug("Loading environment variables...")
        self._driver = self._create_driver()
        self.initialize_schema()

    def _create_driver(self) -> Driver:
        """Create a Neo4j driver instance with authentication"""
        uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        user = os.getenv('NEO4J_USER', 'neo4j')
        password = os.getenv('NEO4J_PASSWORD', 'password')

        logger.debug(f"Attempting to connect to Neo4j:")
        logger.debug(f"  URI: {uri}")
        logger.debug(f"  User: {user}")
        logger.debug(f"  Password: {'*' * len(password)}")

        try:
            driver = GraphDatabase.driver(uri, auth=(user, password))
            # Test the connection
            with driver.session() as session:
                result = session.run("RETURN 1")
                _ = result.single()
            logger.debug("Successfully connected to Neo4j")
            return driver
        except Exception as e:
            logger.error("Failed to connect to Neo4j: %s", str(e))
            logger.error("Please verify your Neo4j credentials in .env file")
            logger.error("Default password for new Neo4j installations is 'neo4j'")
            raise

    def close(self):
        """Close the Neo4j driver"""
        if self._driver:
            self._driver.close()

    def execute_query(
        self, query: LiteralString, params: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        """Execute a Cypher query and return the results"""
        from neo4j.exceptions import Neo4jError
        try:
            with self._driver.session() as session:
                result = session.run(query, params or {})
                return [dict(record) for record in result]
        except Neo4jError as e:
            logger.error("Neo4j query failed: %s", str(e))
            logger.error("Query: %s", query)
            logger.error("Params: %s", params)
            raise

    def initialize_schema(self):
        """Initialize Neo4j schema with constraints and indexes"""
        constraints = [
            (
                "CREATE CONSTRAINT assistant_id IF NOT EXISTS FOR (a:Assistant) "
                "REQUIRE a.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) "
                "REQUIRE p.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT conversation_id IF NOT EXISTS FOR (c:Conversation) "
                "REQUIRE c.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT task_id IF NOT EXISTS FOR (t:Task) "
                "REQUIRE t.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) "
                "REQUIRE s.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT experience_id IF NOT EXISTS FOR (e:Experience) "
                "REQUIRE e.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT insight_id IF NOT EXISTS FOR (i:Insight) "
                "REQUIRE i.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) "
                "REQUIRE c.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT material_id IF NOT EXISTS FOR (m:Material) "
                "REQUIRE m.id IS UNIQUE"
            ),
            (
                "CREATE CONSTRAINT message_id IF NOT EXISTS FOR (m:Message) "
                "REQUIRE m.id IS UNIQUE"
            ),
            "CREATE CONSTRAINT emotional_growth_id IF NOT EXISTS FOR (e:EmotionalGrowth) REQUIRE e.id IS UNIQUE"
        ]

        for constraint in constraints:
            try:
                _ = self.execute_query(cast(LiteralString, constraint), params=None)
            except Exception as e:
                print(f"Error creating constraint: {e}")

    # Removed _serialize_json, _deserialize_json, _serialize_datetime, _deserialize_datetime
    # The Neo4j driver (v5+) handles Python dict/list/datetime conversions automatically.

    def create(self, entity: T) -> T:
        """Create a new entity"""
        raise NotImplementedError

    def get(self, node_id: str) -> T | None:
        """Retrieve a record by ID"""
        query = cast(LiteralString, f"MATCH (n:{self.label()} {{id: $node_id}}) RETURN n")
        results = self.execute_query(query, {"node_id": node_id})
        if results:
            return self.model_from_dict(results[0]["n"])
        return None

    def update(self, entity: T) -> T:
        """Update an existing entity"""
        raise NotImplementedError

    def delete(self, node_id: str) -> bool:
        """Delete a record by ID"""
        query = cast(LiteralString, f"MATCH (n:{self.label()} {{id: $node_id}}) DETACH DELETE n")
        try:
            _ = self.execute_query(query, {"node_id": node_id})
            return True
        except Exception as e:
            logger.error("Failed to delete %s with id %s: %s", self.label(), node_id, str(e))
            return False

    def list(self, filters: dict[str, object] | None = None) -> list[T]:
        """List entities with optional filters"""
        raise NotImplementedError

    def label(self) -> str:
        """Return the label for the entity type (e.g., 'Assistant')"""
        raise NotImplementedError

    def model_from_dict(self, data: dict[str, object]) -> T:
        """Convert a dictionary (from Neo4j node) to the specific model type"""
        raise NotImplementedError
