import json
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
import uuid

from .kuzu_base_dao import KuzuBaseDAO
from ..models import Accomplishment, AssistantProfile, AccomplishmentCategory

class KuzuProfileDAO(KuzuBaseDAO[AssistantProfile]):
    """Data Access Object for Assistant Profile and Accomplishments using Kuzu"""

    def __init__(self, db_path: Optional[str] = None):
        super().__init__(db_path)
        # Schema (constraints/indexes) handled by KuzuBaseDAO

    def label(self) -> str:
        """Return the Kuzu node table name for the profile."""
        return "AssistantProfile"

    def model_from_dict(self, data: Dict[str, Any]) -> AssistantProfile:
        """Constructs an AssistantProfile model from a dictionary (Kuzu result properties)."""
        # Parse JSON strings back to objects
        preferences = {}
        emotional_state = {}
        relationship_context = {}
        family_values = []
        shared_experiences = []
        
        if data.get('preferences'):
            try:
                preferences = json.loads(data['preferences'])
            except (json.JSONDecodeError, TypeError):
                preferences = {}
                
        if data.get('emotional_state'):
            try:
                emotional_state = json.loads(data['emotional_state'])
            except (json.JSONDecodeError, TypeError):
                emotional_state = {}
                
        if data.get('relationship_context'):
            try:
                relationship_context = json.loads(data['relationship_context'])
            except (json.JSONDecodeError, TypeError):
                relationship_context = {}
                
        if data.get('family_values'):
            try:
                family_values = json.loads(data['family_values'])
            except (json.JSONDecodeError, TypeError):
                family_values = []
                
        if data.get('shared_experiences'):
            try:
                shared_experiences = json.loads(data['shared_experiences'])
            except (json.JSONDecodeError, TypeError):
                shared_experiences = []
        
        return AssistantProfile(
            id=str(data.get('id', '')),
            name=str(data.get('name', '')),
            description=str(data.get('description', '')),
            interaction_style=str(data.get('interaction_style', '')),
            preferences=cast(Dict[str, Any], preferences),
            emotional_state=cast(Dict[str, Any], emotional_state),
            relationship_context=cast(Dict[str, Any], relationship_context),
            family_values=cast(List[str], family_values),
            shared_experiences=cast(List[str], shared_experiences),
            last_active_timestamp=cast(datetime | None, data.get('last_active_timestamp')),
        )

    def dict_from_model(self, model: AssistantProfile) -> Dict[str, Any]:
        """Convert an AssistantProfile model to a dictionary for Kuzu storage"""
        return {
            'id': model.id,
            'name': model.name,
            'description': model.description,
            'interaction_style': model.interaction_style,
            'preferences': json.dumps(model.preferences) if model.preferences else '{}',
            'emotional_state': json.dumps(model.emotional_state) if model.emotional_state else '{}',
            'relationship_context': json.dumps(model.relationship_context) if model.relationship_context else '{}',
            'family_values': json.dumps(model.family_values) if model.family_values else '[]',
            'shared_experiences': json.dumps(model.shared_experiences) if model.shared_experiences else '[]',
            'last_active_timestamp': model.last_active_timestamp
        }

    def create(self, entity: AssistantProfile) -> AssistantProfile:
        """Create a new family member profile"""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        data = self.dict_from_model(entity)
        
        query = f"""
        MERGE (p:{self.label()} {{id: $id}})
        ON CREATE SET
            p.name = $name,
            p.description = $description,
            p.interaction_style = $interaction_style,
            p.preferences = $preferences,
            p.emotional_state = $emotional_state,
            p.relationship_context = $relationship_context,
            p.family_values = $family_values,
            p.shared_experiences = $shared_experiences,
            p.last_active_timestamp = $last_active_timestamp
        ON MATCH SET
            p.name = $name,
            p.description = $description,
            p.interaction_style = $interaction_style,
            p.preferences = $preferences,
            p.emotional_state = $emotional_state,
            p.relationship_context = $relationship_context,
            p.family_values = $family_values,
            p.shared_experiences = $shared_experiences,
            p.last_active_timestamp = $last_active_timestamp
        RETURN p
        """
        
        result = self.execute_query(query, data)
        return entity

    def get(self, entity_id: str) -> Optional[AssistantProfile]:
        """Retrieve a profile by ID"""
        query = f"MATCH (p:{self.label()}) WHERE p.id = $id RETURN p"
        result = self.execute_query(query, {'id': entity_id})
        
        if result.has_next():
            record = result.get_next()
            return self.model_from_dict(dict(record[0]))
        return None

    def update(self, entity: AssistantProfile) -> Optional[AssistantProfile]:
        """Update an existing profile"""
        if not entity.id:
            raise ValueError("Profile ID is required for update")
        
        data = self.dict_from_model(entity)
        
        query = f"""
        MATCH (p:{self.label()}) WHERE p.id = $id
        SET p.name = $name,
            p.description = $description,
            p.interaction_style = $interaction_style,
            p.preferences = $preferences,
            p.emotional_state = $emotional_state,
            p.relationship_context = $relationship_context,
            p.family_values = $family_values,
            p.shared_experiences = $shared_experiences,
            p.last_active_timestamp = $last_active_timestamp
        RETURN p
        """
        
        result = self.execute_query(query, data)
        if result.has_next():
            return entity
        return None

    def delete(self, entity_id: str) -> bool:
        """Delete a profile by ID"""
        query = f"MATCH (p:{self.label()}) WHERE p.id = $id DELETE p"
        result = self.execute_query(query, {'id': entity_id})
        return True

    def list_all(self) -> List[AssistantProfile]:
        """Retrieve all profiles"""
        query = f"MATCH (p:{self.label()}) RETURN p ORDER BY p.name"
        result = self.execute_query(query)
        
        profiles = []
        while result.has_next():
            record = result.get_next()
            profiles.append(self.model_from_dict(dict(record[0])))
        return profiles

    def find_by_name(self, name: str) -> List[AssistantProfile]:
        """Find profiles by name"""
        query = f"MATCH (p:{self.label()}) WHERE p.name = $name RETURN p"
        result = self.execute_query(query, {'name': name})
        
        profiles = []
        while result.has_next():
            record = result.get_next()
            profiles.append(self.model_from_dict(dict(record[0])))
        return profiles

    def find_by_interaction_style(self, style: str) -> List[AssistantProfile]:
        """Find profiles by interaction style"""
        query = f"MATCH (p:{self.label()}) WHERE p.interaction_style = $style RETURN p"
        result = self.execute_query(query, {'style': style})
        
        profiles = []
        while result.has_next():
            record = result.get_next()
            profiles.append(self.model_from_dict(dict(record[0])))
        return profiles

    def find_recently_active(self, days: int = 7) -> List[AssistantProfile]:
        """Find profiles that were active within the specified number of days"""
        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        
        query = f"MATCH (p:{self.label()}) WHERE p.last_active_timestamp >= $cutoff RETURN p ORDER BY p.last_active_timestamp DESC"
        result = self.execute_query(query, {'cutoff': cutoff_date})
        
        profiles = []
        while result.has_next():
            record = result.get_next()
            profiles.append(self.model_from_dict(dict(record[0])))
        return profiles

    def update_last_active(self, profile_id: str) -> bool:
        """Update the last active timestamp for a profile"""
        query = f"MATCH (p:{self.label()}) WHERE p.id = $id SET p.last_active_timestamp = $timestamp RETURN p"
        result = self.execute_query(query, {
            'id': profile_id,
            'timestamp': datetime.now()
        })
        return result.has_next()

    def get_relationship_stats(self, assistant_id: str) -> Dict[str, Any]:
        """Get relationship statistics for an assistant profile"""
        try:
            # Find profile by id (assuming profile id matches assistant id)
            query = f"MATCH (p:{self.label()}) WHERE p.id = $assistant_id RETURN p"
            result = self.execute_query(query, {'assistant_id': assistant_id})
            
            if not result.has_next():
                return {"error": "Profile not found for assistant"}
            
            record = result.get_next()
            profile = self.model_from_dict(dict(record[0]))
            
            return {
                "profile_id": profile.id,
                "name": profile.name,
                "interaction_style": profile.interaction_style,
                "preferences": profile.preferences,
                "emotional_state": profile.emotional_state,
                "last_active": profile.last_active_timestamp
            }
        except Exception as e:
            return {"error": str(e)}
    
    def search_by_description(self, search_term: str) -> List[AssistantProfile]:
        """Search profiles by description content"""
        query = f"MATCH (p:{self.label()}) WHERE p.description CONTAINS $term RETURN p ORDER BY p.name"
        result = self.execute_query(query, {'term': search_term})
        
        profiles = []
        while result.has_next():
            record = result.get_next()
            profiles.append(self.model_from_dict(dict(record[0])))
        return profiles