from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import json
import os
import sys
import tkinter as tk
import threading
import time

DATA_FILE = os.path.expanduser("~/.browser_groups.json")
driver = None
root = None
panel_frame = None
is_minimized = False
dots_frame = None


def load_group(name):
    if not os.path.exists(DATA_FILE):
        print("No groups saved. Run manage.py first.")
        sys.exit(1)
    with open(DATA_FILE) as f:
        data = json.load(f)
    if name not in data:
        print(f"Group '{name}' not found. Available: {list(data.keys())}")
        sys.exit(1)
    return data[name]


def get_chrome_window_position():
    # Try to get Chrome window position to anchor panel near it
    try:
        pos = driver.get_window_position()
        size = driver.get_window_size()
        return pos["x"], pos["y"], size["width"], size["height"]
    except:
        return 0, 0, 1280, 800


def navigate(url):
    if driver:
        driver.get(url)


def close_all():
    if driver:
        try:
            driver.quit()
        except:
            pass
    if root:
        root.destroy()
    os.sys.exit(0)


def toggle_minimize():
    global is_minimized
    if is_minimized:
        expand_panel()
    else:
        minimize_panel()


def minimize_panel():
    global is_minimized
    is_minimized = True
    panel_frame.pack_forget()
    dots_frame.pack(pady=6, padx=6)
    root.update_idletasks()
    root.geometry(f"60x28")


def expand_panel():
    global is_minimized
    is_minimized = False
    dots_frame.pack_forget()
    panel_frame.pack(fill="both", expand=True, padx=0, pady=0)
    root.update_idletasks()
    root.geometry("")


def sync_position():
    # Keep the panel anchored to top-left of Chome window
    while True:
        try:
            if driver and root:
                x, y, w, h = get_chrome_window_position()
                root.geometry(f"+{x+10}+{y+10}")
        except:
            pass
        time.sleep(0.5)


def launch_control_panel(sites):
    global root, panel_frame, dots_frame

    # colors
    BG = "#0f0f0f"
    BTN_BG = "#1e1e1e"
    BTN_HOVER = "#2a2a2a"
    ACCENT = "#3b82f6"
    TEXT = "#e2e8f0"
    SUBTEXT = "#94a3b8"
    DOT = "#3b82f6"

    root = tk.Tk()
    root.title("")
    root.configure(bg=BG)
    root.attributes("-topmost", True)
    root.overrideredirect(True)  # removes window chrome entirely
    root.attributes("-alpha", 0.92)

    # position top-left of chrome
    x, y, w, h = get_chrome_window_position()
    root.geometry(f"+{x + 10}+{y + 10}")

    # drag support
    drag_data = {"x": 0, "y": 0}

    def on_drag_start(event):
        drag_data["x"] = event.x_root - root.winfo_x()
        drag_data["y"] = event.y_root - root.winfo_y()

    def on_drag_motion(event):
        root.geometry(
            f"+{event.x_root - drag_data['x']}+{event.y_root - drag_data['y']}"
        )

    # ── minimized dots view ──────────────────────────────────────
    dots_frame = tk.Frame(root, bg=BG)

    dot_row = tk.Frame(dots_frame, bg=BG)
    dot_row.pack()

    for color in [DOT, "#22d3ee", "#a78bfa"]:
        d = tk.Label(
            dot_row, text="●", fg=color, bg=BG, font=("Helvetica", 10), cursor="hand2"
        )
        d.pack(side="left", padx=2)

    dots_frame.bind("<Button-1>", lambda e: toggle_minimize())
    for child in dots_frame.winfo_children():
        child.bind("<Button-1>", lambda e: toggle_minimize())
        for sub in child.winfo_children():
            sub.bind("<Button-1>", lambda e: toggle_minimize())

    dots_frame.bind("<ButtonPress-1>", on_drag_start)
    dots_frame.bind("<B1-Motion>", on_drag_motion)

    # ── expanded panel view ──────────────────────────────────────
    panel_frame = tk.Frame(root, bg=BG, padx=12, pady=10)

    # header
    header = tk.Frame(panel_frame, bg=BG)
    header.pack(fill="x", pady=(0, 8))

    title = tk.Label(
        header,
        text="⠿ Sites",
        fg=TEXT,
        bg=BG,
        font=("Helvetica", 11, "bold"),
        cursor="fleur",
    )
    title.pack(side="left")
    title.bind("<ButtonPress-1>", on_drag_start)
    title.bind("<B1-Motion>", on_drag_motion)

    # minimize button
    min_btn = tk.Label(
        header, text="—", fg=SUBTEXT, bg=BG, font=("Helvetica", 11), cursor="hand2"
    )
    min_btn.pack(side="right", padx=(8, 0))
    min_btn.bind("<Button-1>", lambda e: toggle_minimize())

    # close button
    close_btn = tk.Label(
        header, text="✕", fg=SUBTEXT, bg=BG, font=("Helvetica", 11), cursor="hand2"
    )
    close_btn.pack(side="right")
    close_btn.bind("<Button-1>", lambda e: close_all())

    def on_enter(e, btn, url):
        btn.configure(bg=BTN_HOVER, fg=ACCENT)

    def on_leave(e, btn, url):
        btn.configure(bg=BTN_BG, fg=TEXT)

    # site buttons
    for key, url in sites.items():
        label = url.replace("https://", "").replace("www.", "").split("/")[0]
        row = tk.Frame(panel_frame, bg=BTN_BG, cursor="hand2")
        row.pack(fill="x", pady=2)

        num = tk.Label(
            row,
            text=f" {key}",
            fg=ACCENT,
            bg=BTN_BG,
            font=("Helvetica", 10, "bold"),
            width=2,
        )
        num.pack(side="left", padx=(6, 0), pady=6)

        btn = tk.Label(
            row,
            text=label,
            fg=TEXT,
            bg=BTN_BG,
            font=("Helvetica", 10),
            anchor="w",
            cursor="hand2",
        )
        btn.pack(side="left", padx=8, pady=6, fill="x", expand=True)

        for widget in [row, num, btn]:
            widget.bind("<Button-1>", lambda e, u=url: navigate(u))
            widget.bind("<Enter>", lambda e, b=btn, u=url: on_enter(e, b, u))
            widget.bind("<Leave>", lambda e, b=btn, u=url: on_leave(e, b, u))

    # separator
    tk.Frame(panel_frame, bg="#1e1e1e", height=1).pack(fill="x", pady=(8, 4))
    # footer
    footer = tk.Label(
        panel_frame,
        text="drag to move  •  — to minimize",
        fg=SUBTEXT,
        bg=BG,
        font=("Helvetica", 8),
    )
    footer.pack()

    panel_frame.pack(fill="both", expand=True)

    # start position sync thread
    sync_thread = threading.Thread(target=sync_position, daemon=True)
    sync_thread.start()

    root.mainloop()


def start_browser(sites):
    global driver
    options = webdriver.ChromeOptions()
    options.add_argument("--app=" + list(sites.values())[0])
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()), options=options
    )


def main():
    if len(sys.argv) < 2:
        print("Usage: python browser.py <group_name>")
        sys.exit(1)

    group_name = sys.argv[1]
    sites = load_group(group_name)

    t = threading.Thread(target=start_browser, args=(sites,), daemon=True)
    t.start()

    time.sleep(2)

    launch_control_panel(sites)


if __name__ == "__main__":
    main()
