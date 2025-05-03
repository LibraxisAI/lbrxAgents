use std::io;
use ratatui::{prelude::*, widgets::*};
use crossterm::{event::{self, Event, KeyCode}, execute, terminal::{enable_raw_mode, disable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen}};
use ratatui_dashboard::app::{AppState, RightPanel};
use ratatui_dashboard::services::{scan_agents, read_queue, read_latest_logs};
use ratatui_dashboard::ui::{draw_agent_list, draw_orchestrator, draw_logs};
use std::path::PathBuf;

fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut state = AppState::default();
    let project_root = PathBuf::from(".");

    // initial load
    state.agents = scan_agents(&project_root).into_iter().map(|a| (a.uuid.clone(), a)).collect();
    state.commands = read_queue(&project_root);
    state.logs = read_latest_logs(&project_root, 500);

    loop {
        terminal.draw(|f| {
            let size = f.size();
            let block = Block::default().title("lbrxAgents Dashboard (q to quit)").borders(Borders::ALL);
            f.render_widget(block, size);

            let chunks = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Percentage(30), Constraint::Percentage(70)].as_ref())
                .split(size);
            draw_agent_list(f, chunks[0], &state);
            match state.right_panel {
                RightPanel::Orchestrator => draw_orchestrator(f, chunks[1], &state),
                RightPanel::Logs => draw_logs(f, chunks[1], &state),
            }
        })?;

        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                match key.code {
                    KeyCode::Char('q') => break,
                    KeyCode::Char('r') => {
                        state.agents = scan_agents(&project_root).into_iter().map(|a| (a.uuid.clone(), a)).collect();
                        state.commands = read_queue(&project_root);
                        state.logs = read_latest_logs(&project_root, 500);
                    },
                    KeyCode::Tab | KeyCode::Char('l') => {
                        state.right_panel = match state.right_panel { RightPanel::Orchestrator => RightPanel::Logs, RightPanel::Logs => RightPanel::Orchestrator };
                    },
                    _ => {}
                }
            }
        }
    }

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;
    Ok(())
} 