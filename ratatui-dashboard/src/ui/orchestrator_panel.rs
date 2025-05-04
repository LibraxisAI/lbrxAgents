use ratatui::{prelude::*, widgets::*};
use crate::app::AppState;

pub fn draw_orchestrator(f: &mut Frame, area: Rect, state: &AppState) {
    let items: Vec<ListItem> = state
        .commands
        .iter()
        .take(area.height as usize - 2)
        .map(|cmd| ListItem::new(Line::raw(cmd.clone())))
        .collect();

    let list = List::new(items)
        .block(Block::default().title("Orchestrator Queue").borders(Borders::ALL));

    f.render_widget(list, area);
} 