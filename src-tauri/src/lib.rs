use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Manager;
use std::sync::Mutex;

// Global state to track recent files submenu
struct AppState {
    recent_files_menu: Mutex<Option<Submenu<tauri::Wry>>>,
}

#[tauri::command]
fn update_recent_files(app: tauri::AppHandle, files: Vec<String>) -> Result<(), String> {
    let state = app.state::<AppState>();
    let recent_menu = state.recent_files_menu.lock().unwrap();

    if let Some(submenu) = recent_menu.as_ref() {
        // Clear existing items
        let items = submenu.items().map_err(|e| e.to_string())?;
        for item in items {
            let _ = submenu.remove(&item);
        }

        // Add new items
        for (i, file_path) in files.iter().enumerate() {
            // Extract just the filename for display
            let display_name = file_path
                .split('/')
                .last()
                .or_else(|| file_path.split('\\').last())
                .unwrap_or(file_path);

            let menu_item = MenuItem::with_id(
                &app,
                &format!("recent-{}", i),
                display_name,
                true,
                None::<&str>,
            ).map_err(|e| e.to_string())?;

            submenu.append(&menu_item).map_err(|e| e.to_string())?;
        }

        if files.is_empty() {
            let empty_item = MenuItem::with_id(
                &app,
                "no-recent-files",
                "No Recent Files",
                false,
                None::<&str>,
            ).map_err(|e| e.to_string())?;
            submenu.append(&empty_item).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            recent_files_menu: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![update_recent_files])
        .setup(|app| {
            // Create native menu
            let menu = Menu::new(app)?;

            // File Menu
            let file_menu = Submenu::new(app, "File", true)?;
            file_menu.append(&MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?)?;
            file_menu.append(&MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?)?;

            // Recent Files submenu - managed dynamically from frontend
            let recent_files_submenu = Submenu::new(app, "Open Recent", true)?;
            let empty_item = MenuItem::with_id(app, "no-recent-files", "No Recent Files", false, None::<&str>)?;
            recent_files_submenu.append(&empty_item)?;
            file_menu.append(&recent_files_submenu)?;

            // Store reference to recent files submenu in app state
            let state: tauri::State<AppState> = app.state();
            *state.recent_files_menu.lock().unwrap() = Some(recent_files_submenu);

            file_menu.append(&PredefinedMenuItem::separator(app)?)?;
            file_menu.append(&MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?)?;
            file_menu.append(&MenuItem::with_id(app, "save-as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?)?;

            #[cfg(not(target_os = "macos"))]
            {
                file_menu.append(&PredefinedMenuItem::separator(app)?)?;
                file_menu.append(&PredefinedMenuItem::quit(app, Some("Quit"))?)?;
            }

            menu.append(&file_menu)?;

            // Edit Menu
            let edit_menu = Submenu::new(app, "Edit", true)?;
            edit_menu.append(&MenuItem::with_id(app, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?)?;
            edit_menu.append(&MenuItem::with_id(app, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?)?;
            edit_menu.append(&PredefinedMenuItem::separator(app)?)?;
            edit_menu.append(&MenuItem::with_id(app, "cut", "Cut", true, Some("CmdOrCtrl+X"))?)?;
            edit_menu.append(&MenuItem::with_id(app, "copy", "Copy", true, Some("CmdOrCtrl+C"))?)?;
            edit_menu.append(&MenuItem::with_id(app, "paste", "Paste", true, Some("CmdOrCtrl+V"))?)?;
            edit_menu.append(&MenuItem::with_id(app, "select-all", "Select All", true, Some("CmdOrCtrl+A"))?)?;
            edit_menu.append(&PredefinedMenuItem::separator(app)?)?;
            edit_menu.append(&MenuItem::with_id(app, "find", "Find...", true, Some("CmdOrCtrl+F"))?)?;
            edit_menu.append(&MenuItem::with_id(app, "replace", "Find and Replace...", true, Some("CmdOrCtrl+H"))?)?;

            menu.append(&edit_menu)?;

            // View Menu
            let view_menu = Submenu::new(app, "View", true)?;
            view_menu.append(&MenuItem::with_id(app, "toggle-theme", "Toggle Theme", true, Some("CmdOrCtrl+T"))?)?;
            view_menu.append(&PredefinedMenuItem::separator(app)?)?;
            view_menu.append(&MenuItem::with_id(app, "increase-font-size", "Bigger", true, Some("CmdOrCtrl+Plus"))?)?;
            view_menu.append(&MenuItem::with_id(app, "decrease-font-size", "Smaller", true, Some("CmdOrCtrl+Minus"))?)?;
            view_menu.append(&MenuItem::with_id(app, "reset-font-size", "Actual Size", true, Some("CmdOrCtrl+0"))?)?;
            view_menu.append(&PredefinedMenuItem::separator(app)?)?;
            view_menu.append(&PredefinedMenuItem::fullscreen(app, Some("Enter Full Screen"))?)?;

            menu.append(&view_menu)?;

            // Window Menu (macOS)
            #[cfg(target_os = "macos")]
            {
                let window_menu = Submenu::new(app, "Window", true)?;
                window_menu.append(&PredefinedMenuItem::minimize(app, Some("Minimize"))?)?;
                window_menu.append(&PredefinedMenuItem::maximize(app, Some("Zoom"))?)?;
                window_menu.append(&PredefinedMenuItem::separator(app)?)?;
                window_menu.append(&PredefinedMenuItem::close_window(app, Some("Close Window"))?)?;
                menu.append(&window_menu)?;
            }

            // Help Menu
            let help_menu = Submenu::new(app, "Help", true)?;
            help_menu.append(&MenuItem::with_id(app, "about", "About TheText", true, None::<&str>)?)?;

            menu.append(&help_menu)?;

            // Set the menu
            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(|app, event| {
                if let Some(window) = app.get_webview_window("main") {
                    let menu_id = event.id().as_ref();

                    // Handle recent file items
                    if menu_id.starts_with("recent-") {
                        if let Some(index_str) = menu_id.strip_prefix("recent-") {
                            if let Ok(index) = index_str.parse::<usize>() {
                                let _ = window.emit("menu-open-recent-index", index);
                            }
                        }
                        return;
                    }

                    let event_name = match menu_id {
                        "new" => "menu-new-file",
                        "open" => "menu-open-file",
                        "save" => "menu-save-file",
                        "save-as" => "menu-save-file-as",
                        "undo" => "menu-undo",
                        "redo" => "menu-redo",
                        "cut" => "menu-cut",
                        "copy" => "menu-copy",
                        "paste" => "menu-paste",
                        "select-all" => "menu-select-all",
                        "find" => "menu-find",
                        "replace" => "menu-replace",
                        "toggle-theme" => "menu-toggle-theme",
                        "increase-font-size" => "menu-increase-font-size",
                        "decrease-font-size" => "menu-decrease-font-size",
                        "reset-font-size" => "menu-reset-font-size",
                        "about" => "menu-about",
                        _ => return,
                    };
                    let _ = window.emit(event_name, ());
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
