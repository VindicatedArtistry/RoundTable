import logging
from datetime import datetime
from typing import Any, cast
from pathlib import Path
import uuid
import logging

# Corrected absolute imports
from build.lib.models import Conversation, Assistant, Message, Accomplishment, AccomplishmentCategory
from build.lib.dao.kuzu_assistant_dao import KuzuAssistantDAO
from build.lib.dao.kuzu_conversation_dao import KuzuConversationDAO
from build.lib.dao.kuzu_profile_dao import KuzuProfileDAO

# Logger setup
logger = logging.getLogger(__name__)

class AssistantRepository:
    """Repository interfacing with Kuzu DAOs for AI state, experiences, and relationships"""

    logger: logging.Logger
    assistant_dao: KuzuAssistantDAO | None
    conversation_dao: KuzuConversationDAO | None
    profile_dao: KuzuProfileDAO | None
    settings: dict[str, Any]
    short_term_memory: list[Any]
    working_memory: dict[str, Any]

    def __init__(self,
                 assistant_dao: KuzuAssistantDAO | None = None,
                 conversation_dao: KuzuConversationDAO | None = None,
                 profile_dao: KuzuProfileDAO | None = None,
                 db_path: str | None = None) -> None:
        # Set up logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)

        # Make sure logs directory exists
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)

        # Add file handler
        file_handler = logging.FileHandler(log_dir / "assistant_repository.log")
        file_handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)

        self.logger.info("Initializing AssistantRepository")

        try:
            # Convert db_path to a Path object if provided, otherwise use default for Kuzu
            db_path_obj = Path(db_path) if db_path else Path("data/kuzu_database")
            self.logger.info(f"Using Kuzu database path: {db_path_obj}")

            # Initialize Kuzu DAOs - create them if not provided
            self.assistant_dao = assistant_dao or KuzuAssistantDAO(str(db_path_obj))
            self.conversation_dao = conversation_dao or KuzuConversationDAO(str(db_path_obj))
            self.profile_dao = profile_dao or KuzuProfileDAO(str(db_path_obj))

            # Initialize STM/Working Memory if still used
            self.short_term_memory = []
            self.working_memory = {}

            self.logger.info("AssistantRepository initialization complete using Kuzu DAOs")

        except Exception as e:
            self.logger.error(
                f"Error initializing AssistantRepository with Kuzu DAOs: {e}", exc_info=True
            )
            # Still initialize basic structures even if there's an error
            self.short_term_memory = []
            self.working_memory = {}
            # Set DAOs to None if initialization failed
            self.assistant_dao = None
            self.conversation_dao = None
            self.profile_dao = None

        # Settings can remain as they are if not DB-dependent
        self.settings = {
            "learning_rate": 0.1,
            "forgetting_threshold": 0.5,
            "emotional_decay": 0.05,
            "consolidation_threshold": 0.8,
        }

    def create_assistant(self, identity_data: dict[str, Any]) -> Assistant | None:
        """
        Creates or merges an Assistant entity in the database using AssistantDAO.

        Args:
            identity_data: A dictionary containing the data for the Assistant.
                           Expected keys should match Assistant model fields.

        Returns:
            The created or updated Assistant object, or None if an error occurs.
        """
        if not self.assistant_dao:
            self.logger.error("KuzuAssistantDAO not initialized. Cannot create assistant.")
            return None

        try:
            # Create Assistant instance from the dictionary
            # Apply explicit type casts to satisfy linter
            assistant_obj = Assistant(
                id=str(identity_data['id']), # Cast to str
                name=str(identity_data['name']), # Cast to str
                description=str(identity_data.get('description', '')), # Cast to str
                personality_traits=dict(identity_data.get('personality_traits', {})), # Cast to dict
                emotional_state=dict(identity_data.get('emotional_state', {})), # Cast to dict
                relationship_bonds=dict(identity_data.get('relationship_bonds', {})), # Cast to dict
                family_role=str(identity_data.get('family_role', '')), # Cast to str
                learning_history=list(identity_data.get('learning_history', [])), # Cast to list
                created_at=identity_data.get('created_at', datetime.now()), # Assuming datetime or None
                updated_at=datetime.now(), # Already datetime
                model_id=str(identity_data.get('model_id', '')), # Cast to str
                parameters=dict(identity_data.get('parameters', {})), # Cast to dict
                is_active=bool(identity_data.get('is_active', True)), # Cast to bool
                last_interaction=identity_data.get('last_interaction', datetime.now()), # Assuming datetime or None
                interaction_preferences=dict(identity_data.get('interaction_preferences', {})) # Cast to dict
                # Ensure all fields required by Assistant model are handled
            )

            self.logger.info(f"Attempting to create/merge assistant with ID: {assistant_obj.id}")
            # Call the DAO's create (which uses MERGE)
            created_assistant = self.assistant_dao.create(assistant_obj)
            self.logger.info(f"Successfully created/merged assistant: {created_assistant.id}")
            return created_assistant

        except KeyError as e:
            self.logger.error(f"Missing expected key in identity data for Assistant: {e}", exc_info=True)
            return None
        except TypeError as e:
             self.logger.error(f"Type error creating Assistant object from identity data: {e}", exc_info=True)
             return None
        except Exception as e:
            self.logger.error(f"Error creating assistant via DAO: {e}", exc_info=True)
            return None

    def store_experience(self, assistant_id: str, conversation_data: dict[str, Any]) -> Conversation | None:
        """Stores a conversation as an experience for the assistant."""
        if not self.conversation_dao:
             self.logger.error("ConversationDAO not initialized.")
             return None
        try:
             # Cast messages_data to list[dict[str, Any]]
             messages_data = cast(list[dict[str, Any]], conversation_data.get("messages", []))
             # The type of msg is inferred correctly now, no need for inner cast or isinstance check
             messages = [Message.from_dict(msg) for msg in messages_data]

             # Handle potential None ID from conversation_data
             conversation_id = conversation_data.get("id")
             if not conversation_id:
                  conversation_id = str(uuid.uuid4()) # Generate if missing

             conversation = Conversation(
                  id = str(conversation_id), # Cast to str
                  assistant_id=assistant_id,
                  user_id=str(conversation_data.get("user_id", "")), # Cast str
                  title=str(conversation_data.get("title", "Interaction")), # Cast str
                  messages=messages, # Already list[Message]
                  emotional_context=dict(conversation_data.get("emotional_context", {})), # Cast dict
                  interaction_depth=float(conversation_data.get("interaction_depth", 0.5)), # Cast float, default 0.5
                  relationship_impact=float(conversation_data.get("relationship_impact", 0.0)), # Cast float
                  shared_values=list(conversation_data.get("shared_values", [])), # Cast list (assuming list)
                  created_at=conversation_data.get("created_at", datetime.now()), # datetime or None
                  updated_at=datetime.now(), # datetime
                  metadata=dict(conversation_data.get("metadata", {})) # Cast dict
             )
             created_convo = self.conversation_dao.create(conversation)
             self.logger.info(f"Stored conversation/experience {created_convo.id} for {assistant_id} (user: {conversation.user_id}) via DAO.")
             return created_convo

        except Exception as e:
            self.logger.error(f"Error storing experience for {assistant_id} via DAO: {e}", exc_info=True)
            return None

    def recall(self, assistant_id: str, query: str, context: dict[str, Any] | None = None) -> list[Conversation]:
        """Retrieve relevant experiences/conversations using DAO search."""
        if not self.conversation_dao:
             self.logger.error("ConversationDAO not initialized.")
             return []
        context = context or {}
        try:
            # Use the DAO's search method
            # Pass query and assistant_id
            relevant_convos = self.conversation_dao.search_shared_experiences(
                search_term=query,
                assistant_id=assistant_id,
                limit=10 # Or make limit configurable
            )
            # Maybe enhance with STM search if STM is kept
            # stm_results = self._search_short_term(...)
            # combined_results = sorted(...)
            return relevant_convos
        except Exception as e:
            self.logger.error(f"Error recalling memories for {assistant_id} via DAO: {e}", exc_info=True)
            return []

    def get_relationship_summary(self, assistant_id: str) -> dict[str, Any]:
        """Get relationship summary directly from DAOs."""
        summary = {}
        if self.assistant_dao:
            try:
                summary['identity_summary'] = self.assistant_dao.get_relationship_summary(assistant_id)
            except Exception as e:
                 self.logger.error(f"Error getting identity summary: {e}")
                 summary['identity_summary'] = {"error": str(e)}
        if self.profile_dao:
            try:
                 summary['profile_stats'] = self.profile_dao.get_relationship_stats(assistant_id)
            except Exception as e:
                 self.logger.error(f"Error getting profile stats: {e}")
                 summary['profile_stats'] = {"error": str(e)}
        # Add ConversationDAO stats if relevant
        # if self.conversation_dao:
        #     try:
        #          summary['interaction_stats'] = self.conversation_dao.get_relationship_growth(assistant_id)
        #     except Exception as e: ...

        return summary

    def get_assistant(self, assistant_id: str) -> Assistant | None:
        """Get the assistant identity by ID"""
        if not self.assistant_dao:
             self.logger.error("AssistantDAO not initialized.")
             return None
        try:
            return self.assistant_dao.get(assistant_id)
        except Exception as e:
            self.logger.error(f"Error getting assistant {assistant_id}: {e}", exc_info=True)
            return None

    def update_assistant_identity(self, assistant_id: str, updates: dict[str, Any]) -> bool:
        """Update the assistant's identity attributes"""
        if not self.assistant_dao:
             self.logger.error("AssistantDAO not initialized.")
             return False
        try:
            assistant = self.get_assistant(assistant_id)
            if not assistant:
                self.logger.error(f"Assistant not found: {assistant_id} for update.")
                return False

            for key, value in updates.items():
                if hasattr(assistant, key):
                    setattr(assistant, key, value)
                else:
                    self.logger.warning(f"Attempted to update non-existent attribute '{key}' on Assistant {assistant_id}.")

            assistant.updated_at = datetime.now()
            updated_assistant = self.assistant_dao.update(assistant)
            return updated_assistant is not None # Return True if update succeeded
        except Exception as e:
            self.logger.error(f"Error updating assistant identity {assistant_id}: {e}", exc_info=True)
            return False

    def add_accomplishment(self, assistant_id: str, accomplishment_data: dict[str, Any]) -> Accomplishment | None:
         """Adds an accomplishment for the assistant."""
         if not self.profile_dao:
              self.logger.error("ProfileDAO not initialized.")
              return None
         try:
              # Ensure category is handled correctly (string or Enum)
              category_val = accomplishment_data.get('category', AccomplishmentCategory.OTHER) # Default to Enum
              if isinstance(category_val, str):
                   try:
                        category_val = AccomplishmentCategory(category_val) # Convert str to Enum
                   except ValueError:
                        self.logger.warning(f"Invalid accomplishment category string '{category_val}', defaulting to OTHER.")
                        category_val = AccomplishmentCategory.OTHER

              accomplishment = Accomplishment(
                  # id is handled by DAO
                  assistant_id=assistant_id,
                  timestamp=accomplishment_data.get('timestamp', datetime.now()),
                  title=accomplishment_data.get('title', 'Untitled Accomplishment'),
                  description=accomplishment_data.get('description', ''),
                  category=category_val, # Use the Enum value
                  emotional_impact=accomplishment_data.get('emotional_impact', {}),
                  collaboration_details=accomplishment_data.get('collaboration_details', {}),
                  sustainability_impact=accomplishment_data.get('sustainability_impact', {}),
                  metadata=accomplishment_data.get('metadata', {})
              )
              return self.profile_dao.add_accomplishment(assistant_id, accomplishment)
         except AttributeError:
              self.logger.error("ProfileDAO does not have method 'add_accomplishment'.")
              return None
         except Exception as e:
              self.logger.error(f"Error adding accomplishment for {assistant_id}: {e}", exc_info=True)
              return None

    def get_accomplishments(self, assistant_id: str, category: AccomplishmentCategory | None = None, limit: int = 10) -> list[Accomplishment]:
         """Retrieves accomplishments for the assistant."""
         if not self.profile_dao:
              self.logger.error("ProfileDAO not initialized.")
              return []
         try:
              # Pass category Enum directly if provided
              return self.profile_dao.get_accomplishments(assistant_id, category=category, limit=limit)
         except AttributeError:
              self.logger.error("ProfileDAO does not have method 'get_accomplishments'.")
              return []
         except Exception as e:
              self.logger.error(f"Error getting accomplishments for {assistant_id}: {e}", exc_info=True)
              return []

    def start_conversation(self, assistant_id: str, user_id: str = "user", title: str = "New Conversation") -> Conversation | None:
        if not self.conversation_dao:
            self.logger.error("ConversationDAO not initialized.")
            return None
        try:
            conversation = Conversation(
                id=str(uuid.uuid4()),
                assistant_id=assistant_id,
                user_id=user_id,  # Set the user_id
                title=title,
                messages=[], # Start with empty messages
                created_at=datetime.now(), # Use datetime.now()
                updated_at=datetime.now() # Use datetime.now()
                # Initialize other fields if needed
            )
            self.logger.info(f"Starting new conversation: {conversation.id} for assistant {assistant_id}")
            return self.conversation_dao.create(conversation)
        except Exception as e:
            self.logger.error(f"Error starting conversation for {assistant_id} with user {user_id}: {e}", exc_info=True)
            return None

    def add_message(self, conversation_id: str, sender: str, text: str, metadata: dict[str, Any] | None = None) -> Conversation | None:
        """Adds a message to a conversation's JSON blob and updates the record."""
        if not self.conversation_dao:
            self.logger.error("ConversationDAO not initialized.")
            return None
        try:
            conversation = self.conversation_dao.get(conversation_id)
            if not conversation:
                self.logger.error(f"Conversation {conversation_id} not found for adding message.")
                return None

            new_message = Message(
                sender=sender,
                text=text,
                timestamp=datetime.now(),
                metadata=metadata or {}
            )

            # Add message to conversation's list (assuming it's mutable)
            # If not mutable, need to handle update differently
            conversation.messages.append(new_message)
            conversation.updated_at = datetime.now() # Update conversation timestamp

            # Update conversation in DAO
            self.logger.info(f"Adding message to conversation {conversation_id}")
            return self.conversation_dao.update(conversation)
        except Exception as e:
            self.logger.error(f"Error adding message to conversation {conversation_id}: {e}", exc_info=True)
            return None

    def get_conversation_history(self, conversation_id: str, limit: int = 0) -> list[Message]:
        """Retrieves messages for a conversation from its JSON blob."""
        if not self.conversation_dao:
            self.logger.error("ConversationDAO not initialized.")
            return []
        try:
            conversation = self.conversation_dao.get(conversation_id)
            if not conversation:
                self.logger.error(f"Conversation {conversation_id} not found for history.")
                return []

            messages = conversation.messages
            if limit > 0 and len(messages) > limit:
                return messages[-limit:] # Return last 'limit' messages
            return messages
        except Exception as e:
            self.logger.error(f"Error getting history for conversation {conversation_id}: {e}", exc_info=True)
            return []
