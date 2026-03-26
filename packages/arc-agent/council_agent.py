"""
TheRoundTable Council Agent for ARC-AGI-3

This agent bridges the ARC-AGI-3 Python SDK with the TypeScript deliberation engine.
Instead of making decisions locally, it sends observations to the council and receives
action decisions back. 14 AI agents across 7 providers deliberate on every action.

Usage:
    python council_agent.py --game ls20
    python council_agent.py --game ft09 --council-url http://localhost:3001

The agent:
    1. Observes the game frame
    2. POSTs the frame to the council's /arc-agi/observe endpoint
    3. The council deliberates (2-round protocol, 3-5 agents)
    4. Receives an action decision with full reasoning metadata
    5. Submits the action to the ARC-AGI-3 environment
"""

import os
import sys
import json
import time
import argparse
import logging
import requests
from typing import Optional

# ARC-AGI-3 SDK imports
from arcengine import FrameData, FrameDataRaw, GameAction, GameState
from agents.agent import Agent

logger = logging.getLogger("council_agent")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

# Map string action names to GameAction enum values
ACTION_MAP = {
    "RESET": GameAction.RESET,
    "ACTION1": GameAction.ACTION1,
    "ACTION2": GameAction.ACTION2,
    "ACTION3": GameAction.ACTION3,
    "ACTION4": GameAction.ACTION4,
    "ACTION5": GameAction.ACTION5,
    "ACTION6": GameAction.ACTION6,
    "ACTION7": GameAction.ACTION7,
}


class CouncilAgent(Agent):
    """
    ARC-AGI-3 agent powered by TheRoundTable multi-agent deliberation council.

    Instead of a single LLM choosing actions, this agent sends each observation
    to a council of 14 AI agents across 7 different providers. They deliberate
    using a 2-round propose/evaluate/converge protocol, and the winning strategy
    is mapped to a concrete GameAction.

    The consciousness graph compounds learning across environments —
    the council gets smarter with every game it plays.
    """

    def __init__(self, council_url: str = "http://localhost:3001", **kwargs):
        super().__init__(**kwargs)
        self.council_url = council_url.rstrip("/")
        self.session_id: Optional[str] = None
        self._start_session()

    def _start_session(self) -> None:
        """Create a council session for this game."""
        try:
            resp = requests.post(
                f"{self.council_url}/arc-agi/session",
                json={"gameId": self.game_id},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            self.session_id = data["sessionId"]
            logger.info(f"Council session started: {self.session_id}")
        except Exception as e:
            logger.error(f"Failed to start council session: {e}")
            self.session_id = None

    def is_done(self, frames: list[FrameData], latest_frame: FrameData) -> bool:
        """Game is done when we win."""
        return latest_frame.state is GameState.WIN

    def choose_action(
        self, frames: list[FrameData], latest_frame: FrameData
    ) -> GameAction:
        """
        Send the current frame to the council and receive an action decision.

        The council sees the full grid state, available actions, game state,
        and action history. It deliberates and returns the best action.
        """
        # Convert frame to JSON-serializable format for the council
        frame_data = self._frame_to_dict(latest_frame)

        # If no session or council is unreachable, fall back to simple logic
        if not self.session_id:
            return self._fallback_action(latest_frame)

        try:
            resp = requests.post(
                f"{self.council_url}/arc-agi/observe",
                json={
                    "sessionId": self.session_id,
                    "frame": frame_data,
                },
                timeout=60,  # Council deliberation can take up to 30s
            )
            resp.raise_for_status()
            decision = resp.json()

            # No action needed (e.g., game already won)
            if decision.get("action") is None:
                return GameAction.RESET

            action_name = decision["action"]
            action = ACTION_MAP.get(action_name)

            if action is None:
                logger.warning(f"Unknown action from council: {action_name}")
                return self._fallback_action(latest_frame)

            # Set coordinate data for ACTION6
            if action_name == "ACTION6" and "data" in decision:
                action.set_data(decision["data"])

            # Attach reasoning metadata
            reasoning = decision.get("reasoning", {})
            action.reasoning = {
                "thought": reasoning.get("thought", ""),
                "confidence": reasoning.get("confidence", 0),
                "deliberation_id": reasoning.get("deliberationId", ""),
                "convergence": reasoning.get("convergenceMethod", ""),
                "agents": reasoning.get("participatingAgents", []),
                "constitutional": reasoning.get("constitutionallyValid", False),
            }

            logger.info(
                f"Council decided: {action_name} "
                f"(confidence={reasoning.get('confidence', 0):.2f}, "
                f"method={reasoning.get('convergenceMethod', '?')})"
            )

            return action

        except requests.Timeout:
            logger.warning("Council deliberation timed out, using fallback")
            return self._fallback_action(latest_frame)
        except Exception as e:
            logger.error(f"Council request failed: {e}")
            return self._fallback_action(latest_frame)

    def _frame_to_dict(self, frame: FrameData) -> dict:
        """Convert FrameData to a JSON-serializable dict for the council API."""
        return {
            "gameId": self.game_id,
            "frame": frame.frame if isinstance(frame.frame, list) else [
                row.tolist() if hasattr(row, "tolist") else list(row)
                for row in frame.frame
            ],
            "state": frame.state.name if hasattr(frame.state, "name") else str(frame.state),
            "levelsCompleted": frame.levels_completed,
            "winLevels": frame.win_levels if hasattr(frame, "win_levels") else [],
            "guid": frame.guid if hasattr(frame, "guid") else "",
            "fullReset": frame.full_reset if hasattr(frame, "full_reset") else False,
            "availableActions": [
                a.name if hasattr(a, "name") else str(a)
                for a in (frame.available_actions if hasattr(frame, "available_actions") else [])
            ],
        }

    def _fallback_action(self, frame: FrameData) -> GameAction:
        """Simple fallback when the council is unreachable."""
        if frame.state in [GameState.NOT_PLAYED, GameState.GAME_OVER]:
            return GameAction.RESET

        # Pick first non-reset available action
        if hasattr(frame, "available_actions"):
            for action in frame.available_actions:
                if action is not GameAction.RESET:
                    if action.is_simple():
                        action.reasoning = "Fallback: council unreachable"
                    return action

        return GameAction.ACTION1

    def cleanup(self, scorecard=None) -> None:
        """Close the council session when the game ends."""
        if self.session_id:
            try:
                resp = requests.post(
                    f"{self.council_url}/arc-agi/session/{self.session_id}/close",
                    timeout=10,
                )
                if resp.ok:
                    data = resp.json()
                    logger.info(
                        f"Council session closed: {data.get('finalActionCount', '?')} actions, "
                        f"{data.get('finalLevelsCompleted', '?')} levels completed"
                    )
            except Exception as e:
                logger.warning(f"Failed to close council session: {e}")

        super().cleanup(scorecard)


def main():
    parser = argparse.ArgumentParser(description="TheRoundTable Council Agent for ARC-AGI-3")
    parser.add_argument("--game", required=True, help="Game ID (e.g., ls20, ft09)")
    parser.add_argument(
        "--council-url",
        default=os.getenv("COUNCIL_URL", "http://localhost:3001"),
        help="URL of the TheRoundTable orchestration server",
    )
    parser.add_argument("--max-actions", type=int, default=80, help="Maximum actions before stopping")
    args = parser.parse_args()

    logger.info(f"Starting Council Agent for game: {args.game}")
    logger.info(f"Council URL: {args.council_url}")

    # Initialize ARC-AGI-3 environment
    from arc_agi import Arcade

    arc = Arcade()
    env = arc.make(args.game, render_mode="terminal")
    card_id = arc.open_scorecard(tags=["council", "theroundtable"])

    agent = CouncilAgent(
        council_url=args.council_url,
        card_id=card_id,
        game_id=args.game,
        agent_name="council",
        ROOT_URL=os.getenv("ARC_API_URL", "https://api.arcprize.org"),
        record=True,
        arc_env=env,
    )

    agent.MAX_ACTIONS = args.max_actions
    agent.main()

    # Finalize
    scorecard = arc.get_scorecard(card_id)
    logger.info(f"Final scorecard: {json.dumps(scorecard, indent=2, default=str)}")
    arc.close_scorecard(card_id)


if __name__ == "__main__":
    main()
