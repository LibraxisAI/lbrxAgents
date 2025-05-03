use crate::services::AgentCard;
use chrono::{DateTime, Utc};
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Copy)]
pub enum RightPanel { Orchestrator, Logs, Metrics }

#[derive(Debug)]
pub struct AppState {
    pub agents: HashMap<String, AgentCard>, // key = uuid
    pub selected_index: usize,
    pub last_refresh: DateTime<Utc>,
    pub commands: Vec<String>,
    pub right_panel: RightPanel,
    pub logs: VecDeque<String>,
    pub memory_series: Vec<u64>,
    pub semgrep_alerts: Vec<crate::services::SemgrepAlert>,
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
            memory_series: Vec::new(),
            semgrep_alerts: Vec::new(),
        }
    }
}