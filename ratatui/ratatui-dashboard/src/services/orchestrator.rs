use std::{fs, path::Path};

/// Read orchestrator queue file and return recent commands as Vec<String>
pub fn read_queue(root: &Path) -> Vec<String> {
    let path = root.join(".a2a/orchestrator/commands/queue.jsonl");
    if let Ok(data) = fs::read_to_string(path) {
        data.lines()
            .rev()
            .take(50)
            .map(|s| s.to_string())
            .collect()
    } else {
        Vec::new()
    }
} 