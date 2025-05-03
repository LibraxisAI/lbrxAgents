use std::{fs, path::Path, collections::VecDeque};

pub fn read_latest_logs(root: &Path, max_lines: usize) -> VecDeque<String> {
    let mut entries: Vec<_> = fs::read_dir(root.join("logs"))
        .unwrap_or_default()
        .filter_map(|e| e.ok())
        .collect();
    // sort by modified desc
    entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
    entries.reverse();

    let mut lines = VecDeque::with_capacity(max_lines);
    for entry in entries {
        if lines.len() >= max_lines { break; }
        if let Ok(content) = fs::read_to_string(entry.path()) {
            for line in content.lines().rev() {
                lines.push_front(line.to_string());
                if lines.len() >= max_lines { break; }
            }
        }
    }
    lines
} 