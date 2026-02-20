import webview
import json
import os
import sys
import time

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


class Api:
    def __init__(self, sites):
        self.sites = sites

    def navigate(self, url):
        window.load_url(url)

    def get_sites(self):
        return self.sites


def build_html(sites):
    buttons = ""
    for key, url in sites.items():
        label = url.replace("https://", "").replace("www.", "").split("/")[0]
        buttons += f"<button onclick=\"navigate('{url}')\">{key}: {label}</button>\n"

    return f"""
    <html>
    <head>
    <style>
        body {{
            background: #1e1e1e;
            color: white;
            font-family: Helvetica, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            gap: 8px;
            margin: 0;
        }}
        button {{
            width: 200px;
            padding: 8px;
            background: #333;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        }}
        button:hover {{ background: #444; }}
        h3 {{ margin-bottom: 10px; }}
    </style>
    </head>
    <body>
    <h3>Switch to:</h3>
    {buttons}
    </body>
    <script>
        function navigate(url) {{
            pywebview.api.navigate(url);
        }}
    </script>
    </html>
    """


def main():
    global window
    if len(sys.argv) < 2:
        print("Usage: python browser.py <group_name>")
        sys.exit(1)

    group_name = sys.argv[1]
    sites = load_group(group_name)
    api = Api(sites)

    # main browser window
    window = webview.create_window("Browser", list(sites.values())[0], frameless=True)

    # small control panel window
    webview.create_window(
        "Control Panel",
        html=build_html(sites),
        js_api=api,
        width=250,
        height=100 + len(sites) * 45,
        on_top=True,
        frameless=False,
    )

    webview.start()


if __name__ == "__main__":
    main()
