use serde::Deserialize;
use std::{fs, path::Path};

#[derive(Debug, Clone, Deserialize)]
pub struct AgentCard {
    pub uuid: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub capabilities: Option<Vec<String>>,
}

/// Scan `.a2a/discovery/*.json` and return list of AgentCard
pub fn scan_agents(root: &Path) -> Vec<AgentCard> {
    let mut out = Vec::new();
    let discovery = root.join(".a2a/discovery");
    if let Ok(entries) = fs::read_dir(discovery) {
        for entry in entries.flatten() {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(data) = fs::read_to_string(entry.path()) {
                    if let Ok(card) = serde_json::from_str::<AgentCard>(&data) {
                        out.push(card);
                    }
                }
            }
        }
    }
    out
} 