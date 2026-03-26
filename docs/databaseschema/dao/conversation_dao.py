from __future__ import annotations

import uuid
from datetime import datetime
import logging
from typing import Any, override, cast, LiteralString

from .base_dao import BaseDAO
from ..models import Conversation, Message

class ConversationDAO(BaseDAO[Conversation]):
    """Data Access Object for managing Conversation data using Neo4j"""

    def __init__(self):
        super().__init__()

    @override
    def label(self) -> str:
        """Return the Neo4j node label"""
        return "Conversation"

    @override
    def create(self, entity: Conversation) -> Conversation:
        """Create a new conversation node in Neo4j"""
        query = cast(LiteralString, f"""
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
        """)

        if not entity.id:
            entity.id = str(uuid.uuid4())
        now = datetime.now()
        if not entity.created_at:
            entity.created_at = now
        entity.updated_at = now

        messages_as_dicts = [msg.to_dict() for msg in entity.messages]

        params = {
            "id": entity.id,
            "assistant_id": entity.assistant_id,
            "user_id": entity.user_id,
            "title": entity.title,
            "messages": messages_as_dicts,
            "emotional_context": entity.emotional_context,
            "interaction_depth": entity.interaction_depth,
            "relationship_impact": entity.relationship_impact,
            "shared_values": entity.shared_values,
            "created_at": entity.created_at,
            "updated_at": entity.updated_at,
            "metadata": entity.metadata
        }

        _ = self.execute_query(query, params)
        return entity

    @override
    def get(self, node_id: str) -> Conversation | None:
        """Retrieve a conversation by its ID"""
        query = cast(LiteralString, f"MATCH (c:{self.label()} {{id: $node_id}}) RETURN c")
        results = self.execute_query(query, {"node_id": node_id})
        if not results:
            return None

        node_data = results[0].get('c')
        if not node_data:
            return None

        try:
            return self.model_from_dict(node_data)
        except Exception as e:
            logging.error(f"Error converting node data to Conversation for ID {node_id}: {e}")
            return None

    @override
    def model_from_dict(self, data: dict[str, Any]) -> Conversation:
        """Convert a dictionary (from Neo4j node properties) to a Conversation object."""
        messages_data = data.get('messages', [])
        messages: list[Message] = [] # Initialize with correct type
        if isinstance(messages_data, list):
            for msg_data in messages_data:
                if isinstance(msg_data, dict):
                    try:
                        # Cast msg_data to ensure it's treated as dict[str, Any]
                        typed_msg_data = cast(dict[str, Any], msg_data)
                        messages.append(Message.from_dict(typed_msg_data))
                    except Exception as e:
                        logging.error(f"Error converting message data: {msg_data} - Error: {e}")
                else:
                     logging.warning(f"Skipping non-dict item in messages list: {msg_data}")
        else:
            logging.warning(f"'messages' field is not a list: {messages_data}")

        return Conversation(
            # Use .get with typed defaults to satisfy constructor types
            id=str(data.get('id', '')),
            assistant_id=str(data.get('assistant_id', '')),
            user_id=str(data.get('user_id', '')),
            title=str(data.get('title', '')),
            messages=messages,
            emotional_context=cast(dict[str, Any], data.get('emotional_context', {})),
            interaction_depth=str(data.get('interaction_depth', 'casual')),
            relationship_impact=cast(dict[str, Any], data.get('relationship_impact', {})),
            shared_values=cast(list[str], data.get('shared_values', [])),
            # Explicitly cast potential None or datetime values
            created_at=cast(datetime | None, data.get('created_at')),
            updated_at=cast(datetime | None, data.get('updated_at')),
            metadata=cast(dict[str, Any], data.get('metadata', {}))
        )

    @override
    def update(self, entity: Conversation) -> Conversation:
        """Update an existing conversation node in Neo4j"""
        if not entity.id:
            raise ValueError("Cannot update Conversation without an ID.")

        entity.updated_at = datetime.now()

        query = cast(LiteralString, f"""
        MATCH (c:{self.label()} {{id: $id}})
        SET
            c.title = $title,
            c.messages = $messages,
            c.emotional_context = $emotional_context,
            c.interaction_depth = $interaction_depth,
            c.relationship_impact = $relationship_impact,
            c.shared_values = $shared_values,
            c.updated_at = $updated_at,
            c.metadata = $metadata
        RETURN c
        """)

        messages_as_dicts = [msg.to_dict() for msg in entity.messages]

        params = {
            "id": entity.id,
            "title": entity.title,
            "messages": messages_as_dicts,
            "emotional_context": entity.emotional_context,
            "interaction_depth": entity.interaction_depth,
            "relationship_impact": entity.relationship_impact,
            "shared_values": entity.shared_values,
            "updated_at": entity.updated_at,
            "metadata": entity.metadata
        }

        results = self.execute_query(query, params)
        if not results:
            raise ValueError(f"Conversation with ID {entity.id} not found for update")
        return entity

    @override
    def delete(self, node_id: str) -> bool:
        """Delete a conversation node by its ID"""
        query = cast(LiteralString, f"MATCH (c:{self.label()} {{id: $node_id}}) DETACH DELETE c")
        results = self.execute_query(query, {"node_id": node_id})
        return bool(results)

    @override
    def list(self, filters: dict[str, Any] | None = None) -> list[Conversation]:
        """List conversations with optional filters"""
        base_query = f"MATCH (c:{self.label()})"
        where_clauses: list[str] = [] # Explicitly type the list
        params: dict[str, Any] = {}

        if filters:
            if "assistant_id" in filters and filters["assistant_id"]:
                where_clauses.append("c.assistant_id = $assistant_id")
                params["assistant_id"] = filters["assistant_id"]
            if "user_id" in filters and filters["user_id"]:
                where_clauses.append("c.user_id = $user_id")
                params["user_id"] = filters["user_id"]
            if "start_date" in filters and filters["start_date"]:
                where_clauses.append("c.created_at >= $start_date")
                params["start_date"] = filters["start_date"]
            if "end_date" in filters and filters["end_date"]:
                where_clauses.append("c.created_at <= $end_date")
                params["end_date"] = filters["end_date"]

        if where_clauses:
            query = f"{base_query} WHERE {' AND '.join(where_clauses)} RETURN c"
        else:
            query = f"{base_query} RETURN c"

        limit = filters.get("limit") if filters else None
        if limit and isinstance(limit, int) and limit > 0:
            query += " LIMIT $limit"
            params["limit"] = limit

        final_query = cast(LiteralString, query)
        results = self.execute_query(final_query, params)
        conversations = []
        for record in results: # record is dict[str, Any]
            node_data = record.get('c')
            if node_data and isinstance(node_data, dict):
                try:
                    # Assuming 'c' in the result is the full node data dictionary
                    conv = self.model_from_dict(cast(dict[str, Any], node_data))
                    conversations.append(conv)
                except Exception as e:
                    logging.error(f"Error converting node data {node_data.get('id', 'N/A')} in list: {e}")
        return conversations # Should now be list[Conversation]

    def get_by_user_id(self, user_id: str) -> list[Conversation]:
        """Retrieve conversations associated with a specific user ID"""
        query = cast(LiteralString, f"MATCH (c:{self.label()} {{user_id: $user_id}}) RETURN c ORDER BY c.created_at DESC")
        params = {"user_id": user_id}
        results = self.execute_query(query, params) # Query is already cast
        # Explicitly cast result['c'] before passing to model_from_dict
        return [
            self.model_from_dict(cast(dict[str, Any], result['c']))
            for result in results if result.get('c') and isinstance(result.get('c'), dict)
        ]

    def get_by_assistant_id(self, assistant_id: str) -> list[Conversation]:
        """Retrieve conversations associated with a specific assistant ID"""
        query = cast(LiteralString, f"MATCH (c:{self.label()} {{assistant_id: $assistant_id}}) RETURN c ORDER BY c.created_at DESC")
        params = {"assistant_id": assistant_id}
        results = self.execute_query(query, params) # Query is already cast
        # Explicitly cast result['c']
        return [
            self.model_from_dict(cast(dict[str, Any], result['c']))
            for result in results if result.get('c') and isinstance(result.get('c'), dict)
        ]

    def add_message_to_conversation(self, conversation_id: str, message: Message) -> Conversation | None:
        """Append a new message object to an existing conversation's messages list"""
        message_dict = message.to_dict()

        if not message_dict.get('timestamp'):
             message_dict['timestamp'] = datetime.now()

        query = cast(LiteralString, f"""
        MATCH (c:{self.label()} {{id: $conversation_id}})
        SET c.messages = coalesce(c.messages, []) + $message_dict,
            c.updated_at = datetime()
        RETURN c
        """)
        try:
            # Execute query to add message
            _ = self.execute_query(query, {
                "conversation_id": conversation_id,
                "message_dict": message_dict,
            })
            # If successful, fetch the updated conversation
            return self.get(conversation_id)
        except Exception as e:
            logging.error(f"Error adding message to conversation {conversation_id}: {e}")
            return None

    def find_conversations_by_keyword(self, keyword: str) -> list[Conversation]:
        """Search for conversations containing a specific keyword in messages."""
        query = cast(LiteralString, f"""
        MATCH (c:{self.label()})
        WHERE any(msg IN c.messages WHERE msg.text CONTAINS $keyword)
        RETURN c
        ORDER BY c.updated_at DESC
        """)
        results = self.execute_query(query, {"keyword": keyword})
        conversations = []
        for record in results:
            node_data = record.get('c')
            if node_data:
                try:
                    conversations.append(self.model_from_dict(node_data))
                except Exception as e:
                    logging.error(f"Error converting record to Conversation: {node_data} - Error: {e}")
        return conversations

    def get_meaningful_interactions(
        self,
        assistant_id: str,
        min_depth: str = "deep",
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 10
    ) -> list[Conversation]:
        """Retrieve meaningful family interactions based on depth and impact"""
        base_query = f"MATCH (c:{self.label()} {{assistant_id: $assistant_id}})"
        where_clauses: list[str] = ["c.interaction_depth >= $min_depth"]
        params: dict[str, Any] = {"assistant_id": assistant_id, "min_depth": min_depth}

        if start_date:
            where_clauses.append("c.created_at >= $start_date")
            params["start_date"] = start_date

        if end_date:
            where_clauses.append("c.created_at <= $end_date")
            params["end_date"] = end_date

        if where_clauses:
            base_query += " WHERE " + " AND ".join(where_clauses)

        full_query = base_query + " RETURN c ORDER BY c.created_at DESC LIMIT $limit"
        params["limit"] = limit

        final_query = cast(LiteralString, full_query)
        results = self.execute_query(final_query, params)
        conversations = []
        for result in results: # result is dict[str, Any]
            node_data = result.get('c')
            if node_data and isinstance(node_data, dict):
                try:
                    # Cast node_data before passing
                    conversations.append(self.model_from_dict(cast(dict[str, Any], node_data)))
                except Exception as e:
                    logging.error(f"Error converting node data to Conversation in meaningful interactions: {e}")
        return conversations

    def get_relationship_growth(self, assistant_id: str) -> dict[str, Any]:
        """Analyze relationship growth through interaction patterns"""
        depth_query = cast(LiteralString, f"""
        MATCH (c:{self.label()} {{assistant_id: $assistant_id}})
        RETURN c.interaction_depth AS depth, COUNT(c) AS count
        """)
        depth_results = self.execute_query(depth_query, {"assistant_id": assistant_id})
        depth_stats = {row['depth']: row['count'] for row in depth_results if row.get('depth')}

        trends_query = cast(LiteralString, f"""
        MATCH (c:{self.label()} {{assistant_id: $assistant_id}})
        WHERE c.emotional_context.connection_strength IS NOT NULL
        WITH c.created_at.year AS year, c.created_at.month AS month, AVG(c.emotional_context.connection_strength) AS avg_connection, COUNT(c) AS interaction_count
        RETURN toString(year) + '-' + apoc.text.lpad(toString(month), 2, '0') AS month_str, avg_connection, interaction_count
        ORDER BY month_str DESC
        LIMIT 6
        """)
        try:
            growth_trends_results = self.execute_query(trends_query, {"assistant_id": assistant_id})
            growth_trends = [
                {"month": row['month_str'], "avg_connection": row['avg_connection'], "interaction_count": row['interaction_count']}
                for row in growth_trends_results
            ]
        except Exception as e:
            print(f"Could not retrieve growth trends (requires APOC?): {e}")
            growth_trends = []

        return {
            'interaction_depth_distribution': depth_stats,
            'growth_trends': growth_trends,
            'total_meaningful_interactions': sum(depth_stats.values())
        }

    def search_shared_experiences(
        self,
        search_term: str,
        assistant_id: str | None = None,
        user_id: str | None = None,
        limit: int = 10
    ) -> list[Conversation]:
        """Search for shared experiences and meaningful moments"""
        base_query = f"MATCH (c:{self.label()})"
        where_clauses: list[str] = []
        params: dict[str, Any] = {"query_param": search_term, "limit": limit}

        # Combine search conditions with OR
        where_clauses.append("c.title CONTAINS $query_param")

        where_clauses.append("ANY(msg IN c.messages WHERE msg.text CONTAINS $query_param)")

        where_clauses.append("$query_param IN c.shared_values")

        combined_where = " OR ".join(f"({clause})" for clause in where_clauses)

        filter_clauses = []
        if assistant_id:
            filter_clauses.append("c.assistant_id = $assistant_id")
            params["assistant_id"] = assistant_id
        if user_id:
            filter_clauses.append("c.user_id = $user_id")
            params["user_id"] = user_id

        if filter_clauses:
            base_query += f" WHERE ({combined_where}) AND " + " AND ".join(filter_clauses)
        else:
            base_query += f" WHERE ({combined_where})"

        base_query += " RETURN c ORDER BY c.updated_at DESC LIMIT $limit"

        final_query = cast(LiteralString, base_query)

        results = self.execute_query(final_query, params)
        conversations = []
        for result in results: # result is dict[str, Any]
            node_data = result.get('c')
            if node_data and isinstance(node_data, dict):
                try:
                    # Cast node_data before passing
                    conversations.append(self.model_from_dict(cast(dict[str, Any], node_data)))
                except Exception as e:
                    logging.error(f"Error converting node data to Conversation in shared experiences search: {e}")
        return conversations
