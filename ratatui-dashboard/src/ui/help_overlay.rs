use ratatui::{prelude::*, widgets::*};

pub fn draw_help(f: &mut Frame) {
    let area = centered_rect(60, 40, f.size());
    let text = vec![
        Line::raw("r – refresh"),
        Line::raw("Tab/l – toggle logs/orchestrator"),
        Line::raw("m – metrics panel"),
        Line::raw("? – toggle help"),
        Line::raw("q – quit"),
    ];
    let block = Paragraph::new(text).block(Block::default().title("Help").borders(Borders::ALL));
    f.render_widget(Clear, area); // Clear behind
    f.render_widget(block, area);
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(r);
    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(popup_layout[1])[1]
} 