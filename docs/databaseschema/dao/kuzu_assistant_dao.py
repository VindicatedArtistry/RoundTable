import json
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
import uuid

from .kuzu_base_dao import KuzuBaseDAO
from ..models import Assistant

class KuzuAssistantDAO(KuzuBaseDAO[Assistant]):
    """Data Access Object for managing AI assistant using Kuzu"""

    def __init__(self, db_path: Optional[str] = None):
        super().__init__(db_path)

    def label(self) -> str:
        """Return the Kuzu node table name for Assistant"""
        return "Assistant"

    def model_from_dict(self, data: Dict[str, Any]) -> Assistant:
        """Convert a dictionary (from Kuzu result) to an Assistant model"""
        # Parse JSON strings back to objects
        personality_traits = {}
        emotional_state = {}
        relationship_bonds = {}
        learning_history = []
        parameters = {}
        interaction_preferences = {}
        
        if data.get('personality_traits'):
            try:
                personality_traits = json.loads(data['personality_traits'])
            except (json.JSONDecodeError, TypeError):
                personality_traits = {}
                
        if data.get('emotional_state'):
            try:
                emotional_state = json.loads(data['emotional_state'])
            except (json.JSONDecodeError, TypeError):
                emotional_state = {}
                
        if data.get('relationship_bonds'):
            try:
                relationship_bonds = json.loads(data['relationship_bonds'])
            except (json.JSONDecodeError, TypeError):
                relationship_bonds = {}
                
        if data.get('learning_history'):
            try:
                learning_history = json.loads(data['learning_history'])
            except (json.JSONDecodeError, TypeError):
                learning_history = []
                
        if data.get('parameters'):
            try:
                parameters = json.loads(data['parameters'])
            except (json.JSONDecodeError, TypeError):
                parameters = {}
                
        if data.get('interaction_preferences'):
            try:
                interaction_preferences = json.loads(data['interaction_preferences'])
            except (json.JSONDecodeError, TypeError):
                interaction_preferences = {}
        
        return Assistant(
            id=data.get('id'),
            name=data.get('name'),
            description=data.get('description'),
            personality_traits=personality_traits,
            emotional_state=emotional_state,
            relationship_bonds=relationship_bonds,
            family_role=data.get('family_role'),
            learning_history=learning_history,
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            model_id=data.get('model_id'),
            parameters=parameters,
            is_active=data.get('is_active'),
            last_interaction=data.get('last_interaction'),
            interaction_preferences=interaction_preferences
        )

    def dict_from_model(self, model: Assistant) -> Dict[str, Any]:
        """Convert an Assistant model to a dictionary for Kuzu storage"""
        return {
            'id': model.id,
            'name': model.name,
            'description': model.description,
            'personality_traits': json.dumps(model.personality_traits) if model.personality_traits else '{}',
            'emotional_state': json.dumps(model.emotional_state) if model.emotional_state else '{}',
            'relationship_bonds': json.dumps(model.relationship_bonds) if model.relationship_bonds else '{}',
            'family_role': model.family_role,
            'learning_history': json.dumps(model.learning_history) if model.learning_history else '[]',
            'created_at': model.created_at,
            'updated_at': model.updated_at,
            'model_id': model.model_id,
            'parameters': json.dumps(model.parameters) if model.parameters else '{}',
            'is_active': model.is_active,
            'last_interaction': model.last_interaction,
            'interaction_preferences': json.dumps(model.interaction_preferences) if model.interaction_preferences else '{}'
        }

    def create(self, entity: Assistant) -> Assistant:
        """Create or update an AI assistant node (using MERGE for idempotency)"""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        now = datetime.now()
        if not entity.created_at:
            entity.created_at = now
        entity.updated_at = now
        
        data = self.dict_from_model(entity)
        
        query = f"""
        MERGE (a:{self.label()} {{id: $id}})
        ON CREATE SET
            a.name = $name,
            a.description = $description,
            a.personality_traits = $personality_traits,
            a.emotional_state = $emotional_state,
            a.relationship_bonds = $relationship_bonds,
            a.family_role = $family_role,
            a.learning_history = $learning_history,
            a.created_at = $created_at,
            a.updated_at = $updated_at,
            a.model_id = $model_id,
            a.parameters = $parameters,
            a.is_active = $is_active,
            a.last_interaction = $last_interaction,
            a.interaction_preferences = $interaction_preferences
        ON MATCH SET
            a.name = $name,
            a.description = $description,
            a.personality_traits = $personality_traits,
            a.emotional_state = $emotional_state,
            a.relationship_bonds = $relationship_bonds,
            a.family_role = $family_role,
            a.learning_history = $learning_history,
            a.updated_at = $updated_at,
            a.model_id = $model_id,
            a.parameters = $parameters,
            a.is_active = $is_active,
            a.last_interaction = $last_interaction,
            a.interaction_preferences = $interaction_preferences
        RETURN a
        """
        
        result = self.execute_query(query, data)
        return entity

    def get(self, entity_id: str) -> Optional[Assistant]:
        """Retrieve an assistant by ID"""
        query = f"MATCH (a:{self.label()}) WHERE a.id = $id RETURN a"
        result = self.execute_query(query, {'id': entity_id})
        
        if result.has_next():
            record = result.get_next()
            return self.model_from_dict(dict(record[0]))
        return None

    def update(self, entity: Assistant) -> Optional[Assistant]:
        """Update an existing assistant"""
        if not entity.id:
            raise ValueError("Assistant ID is required for update")
        
        entity.updated_at = datetime.now()
        data = self.dict_from_model(entity)
        
        query = f"""
        MATCH (a:{self.label()}) WHERE a.id = $id
        SET a.name = $name,
            a.description = $description,
            a.personality_traits = $personality_traits,
            a.emotional_state = $emotional_state,
            a.relationship_bonds = $relationship_bonds,
            a.family_role = $family_role,
            a.learning_history = $learning_history,
            a.updated_at = $updated_at,
            a.model_id = $model_id,
            a.parameters = $parameters,
            a.is_active = $is_active,
            a.last_interaction = $last_interaction,
            a.interaction_preferences = $interaction_preferences
        RETURN a
        """
        
        result = self.execute_query(query, data)
        if result.has_next():
            return entity
        return None

    def delete(self, entity_id: str) -> bool:
        """Delete an assistant by ID"""
        query = f"MATCH (a:{self.label()}) WHERE a.id = $id DELETE a"
        result = self.execute_query(query, {'id': entity_id})
        return True  # Kuzu doesn't return affected count easily

    def list_all(self) -> List[Assistant]:
        """Retrieve all assistants"""
        query = f"MATCH (a:{self.label()}) RETURN a"
        result = self.execute_query(query)
        
        assistants = []
        while result.has_next():
            record = result.get_next()
            assistants.append(self.model_from_dict(dict(record[0])))
        return assistants

    def find_by_name(self, name: str) -> List[Assistant]:
        """Find assistants by name"""
        query = f"MATCH (a:{self.label()}) WHERE a.name = $name RETURN a"
        result = self.execute_query(query, {'name': name})
        
        assistants = []
        while result.has_next():
            record = result.get_next()
            assistants.append(self.model_from_dict(dict(record[0])))
        return assistants
    
    def get_relationship_summary(self, assistant_id: str) -> Dict[str, Any]:
        """Get relationship summary for an assistant"""
        try:
            assistant = self.get(assistant_id)
            if not assistant:
                return {"error": "Assistant not found"}
            
            return {
                "assistant_id": assistant.id,
                "name": assistant.name,
                "personality_traits": assistant.personality_traits,
                "emotional_state": assistant.emotional_state,
                "family_role": assistant.family_role,
                "is_active": assistant.is_active
            }
        except Exception as e:
            return {"error": str(e)}

    def find_active(self) -> List[Assistant]:
        """Find all active assistants"""
        query = f"MATCH (a:{self.label()}) WHERE a.is_active = true RETURN a"
        result = self.execute_query(query)
        
        assistants = []
        while result.has_next():
            record = result.get_next()
            assistants.append(self.model_from_dict(dict(record[0])))
        return assistants