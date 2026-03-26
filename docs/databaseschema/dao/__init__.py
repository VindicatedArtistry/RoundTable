# r:\quantumfold_v2\build\lib\dao\__init__.py
"""Data Access Object (DAO) layer for the application."""

from .base_dao import BaseDAO
from .assistant_dao import AssistantDAO
from .conversation_dao import ConversationDAO
from .profile_dao import ProfileDAO # Assuming ProfileDAO exists or will be added
from .project_dao import ProjectDAO
from .material_dao import MaterialDAO
from .specification_dao import SpecificationDAO
from .market_research_dao import MarketResearchDAO
from .software_project_dao import SoftwareProjectDAO
from .knowledge_fragment_dao import KnowledgeFragmentDAO # Added new DAO
from .family_member_dao import FamilyMemberDAO # Added new DAO

__all__ = [
    "BaseDAO",
    "AssistantDAO",
    "ConversationDAO",
    "ProfileDAO",
    "ProjectDAO",
    "MaterialDAO",
    "SpecificationDAO",
    "MarketResearchDAO",
    "SoftwareProjectDAO",
    "KnowledgeFragmentDAO", # Added to __all__
    "FamilyMemberDAO"       # Added to __all__
]
