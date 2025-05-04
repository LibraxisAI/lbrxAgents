use ratatui::{prelude::*, widgets::*};
use crate::app::AppState;

pub fn draw_metrics(f: &mut Frame, area: Rect, state: &AppState) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(5), Constraint::Min(0)].as_ref())
        .split(area);

    // Sparkline for memory usage
    let data: Vec<u64> = state.memory_series.iter().cloned().collect();
    let spark = Sparkline::default()
        .block(Block::default().title("Memory used (MB)").borders(Borders::ALL))
        .data(&data);
    f.render_widget(spark, chunks[0]);

    // Semgrep alerts list
    let alert_items: Vec<ListItem> = state
        .semgrep_alerts
        .iter()
        .map(|a| {
            let style = match a.severity.as_str() {
                "ERROR" => Style::default().fg(Color::Red),
                "WARNING" => Style::default().fg(Color::Yellow),
                _ => Style::default().fg(Color::White),
            };
            ListItem::new(Line::raw(format!("{}: {}", a.path, a.message))).style(style)
        })
        .collect();
    let list = List::new(alert_items)
        .block(Block::default().title("Semgrep alerts").borders(Borders::ALL));
    f.render_widget(list, chunks[1]);
} 