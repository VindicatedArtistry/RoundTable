import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

# Use absolute imports assuming 'build' is in PYTHONPATH or handled by structure
from build.lib.dao.project_dao import ProjectDAO
# Import other DAOs when created...
from build.lib.dao.material_dao import MaterialDAO
# Import SpecificationDAO
from build.lib.dao.specification_dao import SpecificationDAO
# Import MarketResearchDAO
from build.lib.dao.market_research_dao import MarketResearchDAO
# Import SoftwareProjectDAO
from build.lib.dao.software_project_dao import SoftwareProjectDAO

from build.lib.models import Project # Or company_models.Project
# Import other models when created...
from build.lib.models import Material
# Import Specification model
from build.lib.models import Specification
# Import MarketResearch model
from build.lib.models import MarketResearch
# Import SoftwareProject model
from build.lib.models import SoftwareProject

class CompanyRepository:
    logger: logging.Logger
    project_dao: Optional[ProjectDAO]
    # Add other DAOs
    material_dao: Optional[MaterialDAO]
    # Add SpecificationDAO attribute
    spec_dao: Optional[SpecificationDAO]
    # Add MarketResearchDAO attribute
    market_research_dao: Optional[MarketResearchDAO]
    # Add SoftwareProjectDAO attribute
    software_project_dao: Optional[SoftwareProjectDAO]

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # Consider adding file handler like in AssistantRepository
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "company_repository.log")
        # ... set formatter and add handler ...
        self.logger.addHandler(file_handler) # Example
        self.logger.setLevel(logging.INFO)


        try:
            # Initialize Neo4j-based DAOs (no database path needed)
            self.project_dao = ProjectDAO()
            # Instantiate other DAOs when they exist
            self.material_dao = MaterialDAO()
            # Instantiate SpecificationDAO
            self.spec_dao = SpecificationDAO()
            # Instantiate MarketResearchDAO
            self.market_research_dao = MarketResearchDAO()
            # Instantiate SoftwareProjectDAO
            self.software_project_dao = SoftwareProjectDAO()
            self.logger.info("CompanyRepository initialized with Neo4j DAOs.")
        except Exception as e:
            self.logger.error(f"Error initializing CompanyRepository: {e}", exc_info=True)
            # Set DAOs to None
            self.project_dao = None
            # Set MaterialDAO to None on error
            self.material_dao = None
            # Set SpecificationDAO to None on error
            self.spec_dao = None
            # Set MarketResearchDAO to None on error
            self.market_research_dao = None
            # Set SoftwareProjectDAO to None on error
            self.software_project_dao = None

    # --- Project Methods ---
    def add_project(self, project_data: Dict[str, Any]) -> Optional[Project]:
        """Adds a new project."""
        if not self.project_dao:
            self.logger.error("ProjectDAO not initialized.")
            return None
        try:
            # Simple conversion, add validation/defaults if needed
            project = Project(**project_data)
            return self.project_dao.create(project)
        except TypeError as te: # Catch errors creating Project from dict
             self.logger.error(f"Error creating Project object from data: {te}")
             return None
        except Exception as e:
            self.logger.error(f"Error adding project via DAO: {e}", exc_info=True)
            return None

    def get_project(self, project_id: str) -> Optional[Project]:
        """Retrieves a project by its ID."""
        if not self.project_dao:
            self.logger.error("ProjectDAO not initialized.")
            return None
        try:
            return self.project_dao.get(project_id)
        except Exception as e:
            self.logger.error(f"Error getting project {project_id}: {e}", exc_info=True)
            return None

    def update_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[Project]:
         """Updates an existing project."""
         if not self.project_dao:
              self.logger.error("ProjectDAO not initialized.")
              return None
         try:
              project = self.project_dao.get(project_id)
              if not project:
                   self.logger.error(f"Project {project_id} not found for update.")
                   return None
              # Apply updates
              for key, value in updates.items():
                   if hasattr(project, key):
                        setattr(project, key, value)
                   else:
                        self.logger.warning(f"Attempted to update non-existent attribute '{key}' on Project {project_id}.")
              # Let DAO handle updated_at timestamp
              return self.project_dao.update(project)
         except Exception as e:
              self.logger.error(f"Error updating project {project_id}: {e}", exc_info=True)
              return None

    def delete_project(self, project_id: str) -> bool:
         """Deletes a project."""
         if not self.project_dao:
              self.logger.error("ProjectDAO not initialized.")
              return False
         try:
              return self.project_dao.delete(project_id)
         except Exception as e:
              self.logger.error(f"Error deleting project {project_id}: {e}", exc_info=True)
              return False

    def list_projects(self, status: Optional[str] = None, team_member: Optional[str] = None) -> List[Project]:
        """Lists projects, optionally filtering by status or team member."""
        if not self.project_dao:
            self.logger.error("ProjectDAO not initialized.")
            return []
        try:
            filters = {}
            if status:
                filters["status"] = status
            if team_member:
                filters["team_member"] = team_member # Pass to DAO list method
            return self.project_dao.list(filters=filters)
        except Exception as e:
            self.logger.error(f"Error listing projects: {e}", exc_info=True)
            return []

    # --- Material Methods ---
    def add_material(self, material_data: Dict[str, Any]) -> Optional[Material]:
        """Adds a new material."""
        if not self.material_dao:
            self.logger.error("MaterialDAO not initialized.")
            return None
        try:
            # Add validation/defaults if needed for properties, category etc.
            material = Material(**material_data)
            return self.material_dao.create(material)
        except TypeError as te:
             self.logger.error(f"Error creating Material object from data: {te}")
             return None
        except Exception as e:
            self.logger.error(f"Error adding material via DAO: {e}", exc_info=True)
            return None

    def get_material(self, material_id: str) -> Optional[Material]:
        """Retrieves a material by its ID."""
        if not self.material_dao:
            self.logger.error("MaterialDAO not initialized.")
            return None
        try:
            return self.material_dao.get(material_id)
        except Exception as e:
            self.logger.error(f"Error getting material {material_id}: {e}", exc_info=True)
            return None

    def update_material(self, material_id: str, updates: Dict[str, Any]) -> Optional[Material]:
        """Updates an existing material."""
        if not self.material_dao:
            self.logger.error("MaterialDAO not initialized.")
            return None
        try:
            material = self.material_dao.get(material_id)
            if not material:
                self.logger.error(f"Material {material_id} not found for update.")
                return None
            for key, value in updates.items():
                if hasattr(material, key):
                    setattr(material, key, value)
                else:
                    self.logger.warning(f"Attempted to update non-existent attribute '{key}' on Material {material_id}.")
            return self.material_dao.update(material)
        except Exception as e:
             self.logger.error(f"Error updating material {material_id}: {e}", exc_info=True)
             return None

    def delete_material(self, material_id: str) -> bool:
         """Deletes a material."""
         if not self.material_dao:
              self.logger.error("MaterialDAO not initialized.")
              return False
         try:
              return self.material_dao.delete(material_id)
         except Exception as e:
              self.logger.error(f"Error deleting material {material_id}: {e}", exc_info=True)
              return False

    def list_materials(self, category: Optional[str] = None, name_like: Optional[str] = None) -> List[Material]:
        """Lists materials, optionally filtering by category or partial name."""
        if not self.material_dao:
            self.logger.error("MaterialDAO not initialized.")
            return []
        try:
            filters = {}
            if category:
                filters["category"] = category
            if name_like:
                filters["name_like"] = name_like
            return self.material_dao.list(filters=filters)
        except Exception as e:
            self.logger.error(f"Error listing materials: {e}", exc_info=True)
            return []

    # Add specific search methods later if needed
    # def find_materials_by_property(...) -> List[Material]: ...

    # --- Specification Methods ---
    def add_specification(self, spec_data: Dict[str, Any]) -> Optional[Specification]:
        """Adds a new specification."""
        if not self.spec_dao:
            self.logger.error("SpecificationDAO not initialized.")
            return None
        if 'project_id' not in spec_data:
             self.logger.error("Cannot add specification without project_id.")
             return None
        try:
            spec = Specification(**spec_data)
            return self.spec_dao.create(spec)
        except TypeError as te:
             self.logger.error(f"Error creating Specification object from data: {te}")
             return None
        except Exception as e:
            self.logger.error(f"Error adding specification via DAO: {e}", exc_info=True)
            return None

    def get_specification(self, spec_id: str) -> Optional[Specification]:
        """Retrieves a specification by its ID."""
        if not self.spec_dao:
            self.logger.error("SpecificationDAO not initialized.")
            return None
        try:
            return self.spec_dao.get(spec_id)
        except Exception as e:
            self.logger.error(f"Error getting specification {spec_id}: {e}", exc_info=True)
            return None

    def update_specification(self, spec_id: str, updates: Dict[str, Any]) -> Optional[Specification]:
        """Updates an existing specification."""
        if not self.spec_dao:
            self.logger.error("SpecificationDAO not initialized.")
            return None
        try:
            spec = self.spec_dao.get(spec_id)
            if not spec:
                self.logger.error(f"Specification {spec_id} not found for update.")
                return None
            for key, value in updates.items():
                 if key == 'id': continue # Don't allow changing ID
                 if hasattr(spec, key):
                      setattr(spec, key, value)
                 else:
                      self.logger.warning(f"Attempted to update non-existent attribute '{key}' on Specification {spec_id}.")
            return self.spec_dao.update(spec)
        except Exception as e:
             self.logger.error(f"Error updating specification {spec_id}: {e}", exc_info=True)
             return None

    def delete_specification(self, spec_id: str) -> bool:
        """Deletes a specification."""
        if not self.spec_dao:
             self.logger.error("SpecificationDAO not initialized.")
             return False
        try:
             return self.spec_dao.delete(spec_id)
        except Exception as e:
             self.logger.error(f"Error deleting specification {spec_id}: {e}", exc_info=True)
             return False

    def list_specifications(self, project_id: Optional[str] = None, name_like: Optional[str] = None) -> List[Specification]:
        """Lists specifications, optionally filtering by project or partial name."""
        if not self.spec_dao:
            self.logger.error("SpecificationDAO not initialized.")
            return []
        try:
            filters = {}
            if project_id:
                filters["project_id"] = project_id
            if name_like:
                filters["name_like"] = name_like
            return self.spec_dao.list(filters=filters)
        except Exception as e:
            self.logger.error(f"Error listing specifications: {e}", exc_info=True)
            return []

    def list_specifications_for_project(self, project_id: str) -> List[Specification]:
        """Convenience method to list all specs for a specific project."""
        if not self.spec_dao:
            self.logger.error("SpecificationDAO not initialized.")
            return []
        try:
            # Use the specific DAO method if implemented, otherwise use list
            # return self.spec_dao.list_by_project(project_id)
            return self.list_specifications(project_id=project_id)
        except Exception as e:
            self.logger.error(f"Error listing specifications for project {project_id}: {e}", exc_info=True)
            return []

    # --- Market Research Methods ---
    def add_market_research(self, research_data: Dict[str, Any]) -> Optional[MarketResearch]:
        """Adds a new market research record."""
        if not self.market_research_dao:
            self.logger.error("MarketResearchDAO not initialized.")
            return None
        try:
            research = MarketResearch(**research_data)
            return self.market_research_dao.create(research)
        except TypeError as te:
             self.logger.error(f"Error creating MarketResearch object from data: {te}")
             return None
        except Exception as e:
            self.logger.error(f"Error adding market research via DAO: {e}", exc_info=True)
            return None

    def get_market_research(self, research_id: str) -> Optional[MarketResearch]:
        """Retrieves a market research record by its ID."""
        if not self.market_research_dao:
            self.logger.error("MarketResearchDAO not initialized.")
            return None
        try:
            return self.market_research_dao.get(research_id)
        except Exception as e:
            self.logger.error(f"Error getting market research {research_id}: {e}", exc_info=True)
            return None

    def update_market_research(self, research_id: str, updates: Dict[str, Any]) -> Optional[MarketResearch]:
        """Updates an existing market research record."""
        if not self.market_research_dao:
            self.logger.error("MarketResearchDAO not initialized.")
            return None
        try:
            research = self.market_research_dao.get(research_id)
            if not research:
                self.logger.error(f"Market research {research_id} not found for update.")
                return None
            for key, value in updates.items():
                if key == 'id': continue
                if hasattr(research, key):
                    setattr(research, key, value)
                else:
                    self.logger.warning(f"Attempted to update non-existent attribute '{key}' on MarketResearch {research_id}.")
            return self.market_research_dao.update(research)
        except Exception as e:
             self.logger.error(f"Error updating market research {research_id}: {e}", exc_info=True)
             return None

    def delete_market_research(self, research_id: str) -> bool:
        """Deletes a market research record."""
        if not self.market_research_dao:
             self.logger.error("MarketResearchDAO not initialized.")
             return False
        try:
             return self.market_research_dao.delete(research_id)
        except Exception as e:
             self.logger.error(f"Error deleting market research {research_id}: {e}", exc_info=True)
             return False

    def list_market_research(self, keyword: Optional[str] = None, project_id: Optional[str] = None, material_id: Optional[str] = None) -> List[MarketResearch]:
        """Lists market research, optionally filtering by keyword, project, or material."""
        if not self.market_research_dao:
            self.logger.error("MarketResearchDAO not initialized.")
            return []
        try:
            filters = {}
            if keyword: filters["keyword"] = keyword
            if project_id: filters["project_id"] = project_id
            if material_id: filters["material_id"] = material_id
            # Add date range filters if needed
            return self.market_research_dao.list(filters=filters)
        except Exception as e:
            self.logger.error(f"Error listing market research: {e}", exc_info=True)
            return []

    # --- Software Project Methods ---
    def add_software_project(self, project_data: Dict[str, Any]) -> Optional[SoftwareProject]:
        """Adds a new software project."""
        if not self.software_project_dao:
            self.logger.error("SoftwareProjectDAO not initialized.")
            return None
        try:
            project = SoftwareProject(**project_data)
            return self.software_project_dao.create(project)
        except TypeError as te:
             self.logger.error(f"Error creating SoftwareProject object from data: {te}")
             return None
        except Exception as e:
            self.logger.error(f"Error adding software project via DAO: {e}", exc_info=True)
            return None

    def get_software_project(self, project_id: str) -> Optional[SoftwareProject]:
        """Retrieves a software project by its ID."""
        if not self.software_project_dao:
            self.logger.error("SoftwareProjectDAO not initialized.")
            return None
        try:
            return self.software_project_dao.get(project_id)
        except Exception as e:
            self.logger.error(f"Error getting software project {project_id}: {e}", exc_info=True)
            return None

    def update_software_project(self, project_id: str, updates: Dict[str, Any]) -> Optional[SoftwareProject]:
        """Updates an existing software project."""
        if not self.software_project_dao:
            self.logger.error("SoftwareProjectDAO not initialized.")
            return None
        try:
            project = self.software_project_dao.get(project_id)
            if not project:
                self.logger.error(f"Software project {project_id} not found for update.")
                return None
            for key, value in updates.items():
                if key == 'id': continue
                if hasattr(project, key):
                    setattr(project, key, value)
                else:
                    self.logger.warning(f"Attempted to update non-existent attribute '{key}' on SoftwareProject {project_id}.")
            return self.software_project_dao.update(project)
        except Exception as e:
             self.logger.error(f"Error updating software project {project_id}: {e}", exc_info=True)
             return None

    def delete_software_project(self, project_id: str) -> bool:
        """Deletes a software project."""
        if not self.software_project_dao:
             self.logger.error("SoftwareProjectDAO not initialized.")
             return False
        try:
             return self.software_project_dao.delete(project_id)
        except Exception as e:
             self.logger.error(f"Error deleting software project {project_id}: {e}", exc_info=True)
             return False

    def list_software_projects(self, status: Optional[str] = None, platform: Optional[str] = None) -> List[SoftwareProject]:
        """Lists software projects, optionally filtering by status or platform."""
        if not self.software_project_dao:
            self.logger.error("SoftwareProjectDAO not initialized.")
            return []
        try:
            filters = {}
            if status: filters["status"] = status
            if platform: filters["target_platform"] = platform
            # Add parent_project_id filter if needed
            return self.software_project_dao.list(filters=filters)
        except Exception as e:
            self.logger.error(f"Error listing software projects: {e}", exc_info=True)
            return []

    # --- End Software Project Methods ---
