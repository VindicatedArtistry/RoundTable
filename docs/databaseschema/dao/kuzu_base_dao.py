import logging
import os
from typing import TypeVar, Generic, Any, Dict, List, Optional, ClassVar
from pathlib import Path
import kuzu
from dotenv import load_dotenv

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

T = TypeVar('T')

class KuzuBaseDAO(Generic[T]):
    """Base Data Access Object for Kuzu operations"""
    # Class-level database instances to avoid lock conflicts
    _databases: ClassVar[Dict[str, kuzu.Database]] = {}
    _connections: ClassVar[Dict[str, kuzu.Connection]] = {}
    
    _db: kuzu.Database
    _conn: kuzu.Connection

    def __init__(self, db_path: Optional[str] = None):
        _ = load_dotenv()
        logger.debug("Loading environment variables for Kuzu...")
        
        # Use provided path or default from environment
        if db_path is None:
            db_path = os.getenv('KUZU_DB_PATH', 'data/kuzu_db')
        
        self.db_path = Path(db_path)
        db_path_str = str(self.db_path)
        
        # Use singleton pattern for database connections
        if db_path_str not in self._databases:
            self._databases[db_path_str] = self._create_database()
            self._connections[db_path_str] = self._create_connection(self._databases[db_path_str])
        
        self._db = self._databases[db_path_str]
        self._conn = self._connections[db_path_str]
        self.initialize_schema()

    def _create_database(self) -> kuzu.Database:
        """Create a Kuzu database instance"""
        try:
            # Ensure the directory exists
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            
            logger.debug(f"Creating Kuzu database at: {self.db_path}")
            db = kuzu.Database(str(self.db_path))
            logger.debug("Successfully created Kuzu database")
            return db
        except Exception as e:
            logger.error(f"Failed to create Kuzu database: {e}")
            raise

    def _create_connection(self, database: kuzu.Database) -> kuzu.Connection:
        """Create a Kuzu connection instance"""
        try:
            conn = kuzu.Connection(database)
            logger.debug("Successfully connected to Kuzu database")
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to Kuzu database: {e}")
            raise

    def close(self):
        """Close the Kuzu connection"""
        if hasattr(self, '_conn'):
            # Kuzu connections are automatically managed
            logger.debug("Kuzu connection closed")

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> kuzu.QueryResult:
        """Execute a Cypher query with optional parameters"""
        try:
            logger.debug(f"Executing Kuzu query: {query}")
            if parameters:
                logger.debug(f"With parameters: {parameters}")
                # Kuzu uses different parameter binding syntax
                result = self._conn.execute(query, parameters)
            else:
                result = self._conn.execute(query)
            return result
        except Exception as e:
            logger.error(f"Kuzu query failed: {e}")
            logger.error(f"Query: {query}")
            if parameters:
                logger.error(f"Parameters: {parameters}")
            raise

    def initialize_schema(self):
        """Initialize Kuzu schema with node tables and relationships"""
        try:
            logger.debug("Initializing Kuzu schema...")
            
            # Create Assistant node table
            self.execute_query("""
                CREATE NODE TABLE IF NOT EXISTS Assistant(
                    id STRING,
                    name STRING,
                    description STRING,
                    personality_traits STRING,
                    emotional_state STRING,
                    relationship_bonds STRING,
                    family_role STRING,
                    learning_history STRING,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    model_id STRING,
                    parameters STRING,
                    is_active BOOLEAN,
                    last_interaction TIMESTAMP,
                    interaction_preferences STRING,
                    PRIMARY KEY(id)
                )
            """)
            
            # Create Conversation node table
            self.execute_query("""
                CREATE NODE TABLE IF NOT EXISTS Conversation(
                    id STRING,
                    assistant_id STRING,
                    user_id STRING,
                    title STRING,
                    messages STRING,
                    emotional_context STRING,
                    interaction_depth DOUBLE,
                    relationship_impact DOUBLE,
                    shared_values STRING,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    metadata STRING,
                    PRIMARY KEY(id)
                )
            """)
            
            # Create AssistantProfile node table
            self.execute_query("""
                CREATE NODE TABLE IF NOT EXISTS AssistantProfile(
                    id STRING,
                    name STRING,
                    description STRING,
                    interaction_style STRING,
                    preferences STRING,
                    emotional_state STRING,
                    relationship_context STRING,
                    family_values STRING,
                    shared_experiences STRING,
                    last_active_timestamp TIMESTAMP,
                    PRIMARY KEY(id)
                )
            """)
            
            # Create relationships
            self.execute_query("""
                CREATE REL TABLE IF NOT EXISTS HAS_CONVERSATION(
                    FROM Assistant TO Conversation
                )
            """)
            
            self.execute_query("""
                CREATE REL TABLE IF NOT EXISTS HAS_PROFILE(
                    FROM Assistant TO AssistantProfile
                )
            """)
            
            logger.debug("Kuzu schema initialization complete")
            
        except Exception as e:
            logger.error(f"Error initializing Kuzu schema: {e}")
            # Don't raise here to allow the DAO to continue working

    def label(self) -> str:
        """Return the node table name - to be overridden by subclasses"""
        raise NotImplementedError("Subclasses must implement label()")

    def model_from_dict(self, data: Dict[str, Any]) -> T:
        """Convert a dictionary (from Kuzu result) to the specific model type"""
        raise NotImplementedError("Subclasses must implement model_from_dict()")

    def dict_from_model(self, model: T) -> Dict[str, Any]:
        """Convert a model instance to a dictionary for Kuzu storage"""
        # Default implementation using model's __dict__
        if hasattr(model, '__dict__'):
            return {k: v for k, v in model.__dict__.items() if v is not None}
        else:
            raise NotImplementedError("Subclasses must implement dict_from_model() or model must have __dict__")