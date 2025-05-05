use ratatui::{prelude::*, widgets::*};
use crate::app::AppState;

pub fn draw_agent_list(f: &mut Frame, area: Rect, state: &AppState) {
    let items: Vec<ListItem> = state
        .agents
        .values()
        .enumerate()
        .map(|(idx, card)| {
            let content = Line::raw(format!(
                "{} {}",
                if idx == state.selected_index { "▶" } else { " " },
                card.name
            ));
            ListItem::new(content)
        })
        .collect();

    let list = List::new(items)
        .block(Block::default().title("Agents").borders(Borders::ALL))
        .highlight_symbol("▶");

    f.render_widget(list, area);
} 