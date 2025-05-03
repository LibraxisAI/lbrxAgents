use crate::services::AgentCard;
use chrono::{DateTime, Utc};
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Copy)]
pub enum RightPanel { Orchestrator, Logs }

#[derive(Debug)]
pub struct AppState {
    pub agents: HashMap<String, AgentCard>, // key = uuid
    pub selected_index: usize,
    pub last_refresh: DateTime<Utc>,
    pub commands: Vec<String>,
    pub right_panel: RightPanel,
    pub logs: VecDeque<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            agents: HashMap::new(),
            selected_index: 0,
            last_refresh: Utc::now(),
            commands: Vec::new(),
            right_panel: RightPanel::Orchestrator,
            logs: VecDeque::with_capacity(500),
        }
    }
}