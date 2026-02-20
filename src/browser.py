import webview
import threading
import json
import os
import sys
import tkinter as tk

DATA_FILE = os.path.expanduser("~/.browser_groups.json")

window = None


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


def launch_control_panel(sites):
    root = tk.Tk()
    root.title("Browser Control")
    root.attributes("-topmost", True)
    root.resizable(False, False)

    tk.Label(root, text="Switch to:", font=("Helvetica", 13, "bold")).pack(pady=(10, 5))

    for key, url in sites.items():
        label = url.replace("https://", "").replace("www.", "").split("/")[0]
        tk.Button(
            root,
            text=f"{key}: {label}",
            width=25,
            command=lambda u=url: window.load_url(u),
        ).pack(pady=2, padx=10)

    tk.Button(
        root,
        text="Close Browser",
        fg="red",
        command=lambda: [window.destroy(), root.destroy()],
    ).pack(pady=10)

    root.mainloop()


def main():
    global window
    if len(sys.argv) < 2:
        print("Usage: python browser.py <group_name>")
        sys.exit(1)

    group_name = sys.argv[1]
    sites = load_group(group_name)

    window = webview.create_window(
        "Browser", list(sites.values())[0], frameless=True
    )

    t = threading.Thread(target=launch_control_panel, args=(sites,), daemon=True)
    t.start()

    webview.start()


if __name__ == "__main__":
    main()
