use std::path::Path;
use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct MemoryMetrics {
    pub used: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SemgrepAlert {
    pub path: String,
    pub message: String,
    pub severity: String,
}

pub fn read_memory(root: &Path) -> Option<MemoryMetrics> {
    let path = root.join("var/memory_metrics.json");
    if let Ok(data) = std::fs::read_to_string(path) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&data) {
            return Some(MemoryMetrics { used: v["used"].as_u64().unwrap_or(0) });
        }
    }
    None
}

pub fn read_semgrep(root: &Path) -> Vec<SemgrepAlert> {
    let path = root.join("scripts/semgrep-report.json");
    if let Ok(data) = std::fs::read_to_string(path) {
        if let Ok(alerts) = serde_json::from_str::<Vec<SemgrepAlert>>(&data) {
            return alerts;
        }
    }
    Vec::new()
} 