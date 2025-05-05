use ratatui::{prelude::*, widgets::*};
use crate::app::AppState;

pub fn draw_logs(f: &mut Frame, area: Rect, state: &AppState) {
    let text: Vec<Line> = state
        .logs
        .iter()
        .map(|l| Line::raw(l.clone()))
        .collect();
    let paragraph = Paragraph::new(text)
        .block(Block::default().title("Logs").borders(Borders::ALL))
        .scroll((state.logs.len().saturating_sub(area.height as usize) as u16, 0));
    f.render_widget(paragraph, area);
} 