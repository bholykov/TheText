use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Create native menu
            let menu = Menu::new(app)?;

            // File Menu
            let file_menu = Submenu::new(app, "File", true)?;
            file_menu.append(&MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?)?;
            file_menu.append(&MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?)?;
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
                    let event_name = match event.id().as_ref() {
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
