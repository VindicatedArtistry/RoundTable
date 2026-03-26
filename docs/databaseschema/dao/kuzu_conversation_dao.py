import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from .kuzu_base_dao import KuzuBaseDAO
from ..models import Conversation, Message

class KuzuConversationDAO(KuzuBaseDAO[Conversation]):
    """Data Access Object for managing Conversation data using Kuzu"""

    def __init__(self, db_path: Optional[str] = None):
        super().__init__(db_path)

    def label(self) -> str:
        """Return the Kuzu node table name"""
        return "Conversation"

    def model_from_dict(self, data: Dict[str, Any]) -> Conversation:
        """Convert a dictionary (from Kuzu result) to a Conversation object."""
        # Parse JSON strings back to objects
        messages = []
        emotional_context = {}
        shared_values = []
        metadata = {}
        
        if data.get('messages'):
            try:
                messages_data = json.loads(data['messages'])
                messages = [Message(**msg) for msg in messages_data]
            except (json.JSONDecodeError, TypeError):
                messages = []
                
        if data.get('emotional_context'):
            try:
                emotional_context = json.loads(data['emotional_context'])
            except (json.JSONDecodeError, TypeError):
                emotional_context = {}
                
        if data.get('shared_values'):
            try:
                shared_values = json.loads(data['shared_values'])
            except (json.JSONDecodeError, TypeError):
                shared_values = []
                
        if data.get('metadata'):
            try:
                metadata = json.loads(data['metadata'])
            except (json.JSONDecodeError, TypeError):
                metadata = {}
        
        return Conversation(
            id=data.get('id'),
            assistant_id=data.get('assistant_id'),
            user_id=data.get('user_id'),
            title=data.get('title'),
            messages=messages,
            emotional_context=emotional_context,
            interaction_depth=data.get('interaction_depth'),
            relationship_impact=data.get('relationship_impact'),
            shared_values=shared_values,
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            metadata=metadata
        )

    def dict_from_model(self, model: Conversation) -> Dict[str, Any]:
        """Convert a Conversation model to a dictionary for Kuzu storage"""
        messages_as_dicts = [msg.to_dict() for msg in model.messages] if model.messages else []
        
        return {
            'id': model.id,
            'assistant_id': model.assistant_id,
            'user_id': model.user_id,
            'title': model.title,
            'messages': json.dumps(messages_as_dicts),
            'emotional_context': json.dumps(model.emotional_context) if model.emotional_context else '{}',
            'interaction_depth': model.interaction_depth,
            'relationship_impact': model.relationship_impact,
            'shared_values': json.dumps(model.shared_values) if model.shared_values else '[]',
            'created_at': model.created_at,
            'updated_at': model.updated_at,
            'metadata': json.dumps(model.metadata) if model.metadata else '{}'
        }

    def create(self, entity: Conversation) -> Conversation:
        """Create a new conversation node in Kuzu"""
        if not entity.id:
            entity.id = str(uuid.uuid4())
        
        now = datetime.now()
        if not entity.created_at:
            entity.created_at = now
        entity.updated_at = now
        
        data = self.dict_from_model(entity)
        
        query = f"""
        CREATE (c:{self.label()} {{
            id: $id,
            assistant_id: $assistant_id,
            user_id: $user_id,
            title: $title,
            messages: $messages,
            emotional_context: $emotional_context,
            interaction_depth: $interaction_depth,
            relationship_impact: $relationship_impact,
            shared_values: $shared_values,
            created_at: $created_at,
            updated_at: $updated_at,
            metadata: $metadata
        }})
        RETURN c
        """
        
        result = self.execute_query(query, data)
        return entity

    def get(self, entity_id: str) -> Optional[Conversation]:
        """Retrieve a conversation by ID"""
        query = f"MATCH (c:{self.label()}) WHERE c.id = $id RETURN c"
        result = self.execute_query(query, {'id': entity_id})
        
        if result.has_next():
            record = result.get_next()
            return self.model_from_dict(dict(record[0]))
        return None

    def update(self, entity: Conversation) -> Optional[Conversation]:
        """Update an existing conversation node in Kuzu"""
        if not entity.id:
            raise ValueError("Conversation ID is required for update")
        
        entity.updated_at = datetime.now()
        data = self.dict_from_model(entity)
        
        query = f"""
        MATCH (c:{self.label()}) WHERE c.id = $id
        SET c.assistant_id = $assistant_id,
            c.user_id = $user_id,
            c.title = $title,
            c.messages = $messages,
            c.emotional_context = $emotional_context,
            c.interaction_depth = $interaction_depth,
            c.relationship_impact = $relationship_impact,
            c.shared_values = $shared_values,
            c.updated_at = $updated_at,
            c.metadata = $metadata
        RETURN c
        """
        
        result = self.execute_query(query, data)
        if result.has_next():
            return entity
        return None

    def delete(self, entity_id: str) -> bool:
        """Delete a conversation by ID"""
        query = f"MATCH (c:{self.label()}) WHERE c.id = $id DELETE c"
        result = self.execute_query(query, {'id': entity_id})
        return True

    def list_all(self) -> List[Conversation]:
        """Retrieve all conversations"""
        query = f"MATCH (c:{self.label()}) RETURN c ORDER BY c.created_at DESC"
        result = self.execute_query(query)
        
        conversations = []
        while result.has_next():
            record = result.get_next()
            conversations.append(self.model_from_dict(dict(record[0])))
        return conversations

    def find_by_assistant_id(self, assistant_id: str) -> List[Conversation]:
        """Find conversations by assistant ID"""
        query = f"MATCH (c:{self.label()}) WHERE c.assistant_id = $assistant_id RETURN c ORDER BY c.created_at DESC"
        result = self.execute_query(query, {'assistant_id': assistant_id})
        
        conversations = []
        while result.has_next():
            record = result.get_next()
            conversations.append(self.model_from_dict(dict(record[0])))
        return conversations

    def find_by_user_id(self, user_id: str) -> List[Conversation]:
        """Find conversations by user ID"""
        query = f"MATCH (c:{self.label()}) WHERE c.user_id = $user_id RETURN c ORDER BY c.created_at DESC"
        result = self.execute_query(query, {'user_id': user_id})
        
        conversations = []
        while result.has_next():
            record = result.get_next()
            conversations.append(self.model_from_dict(dict(record[0])))
        return conversations

    def find_recent(self, limit: int = 10) -> List[Conversation]:
        """Find recent conversations"""
        query = f"MATCH (c:{self.label()}) RETURN c ORDER BY c.updated_at DESC LIMIT $limit"
        result = self.execute_query(query, {'limit': limit})
        
        conversations = []
        while result.has_next():
            record = result.get_next()
            conversations.append(self.model_from_dict(dict(record[0])))
        return conversations

    def add_message(self, conversation_id: str, message: Message) -> bool:
        """Add a message to an existing conversation"""
        conversation = self.get(conversation_id)
        if not conversation:
            return False
        
        if not conversation.messages:
            conversation.messages = []
        
        conversation.messages.append(message)
        conversation.updated_at = datetime.now()
        
        updated = self.update(conversation)
        return updated is not None

    def get_messages(self, conversation_id: str) -> List[Message]:
        """Get all messages from a conversation"""
        conversation = self.get(conversation_id)
        if conversation and conversation.messages:
            return conversation.messages
        return []

    def search_by_title(self, title_pattern: str) -> List[Conversation]:
        """Search conversations by title pattern"""
        query = f"MATCH (c:{self.label()}) WHERE c.title CONTAINS $pattern RETURN c ORDER BY c.updated_at DESC"
        result = self.execute_query(query, {'pattern': title_pattern})
        
        conversations = []
        while result.has_next():
            record = result.get_next()
            conversations.append(self.model_from_dict(dict(record[0])))
        return conversations