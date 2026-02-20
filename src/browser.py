from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QPushButton,
    QLabel,
    QHBoxLayout,
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEnginePage
from PyQt6.QtCore import QUrl
import sys
import json
import os

DATA_FILE = os.path.expanduser("~/.browser_groups.json")


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


class Sidebar(QWidget):
    def __init__(self, sites, on_navigate):
        super().__init__()
        self.setFixedWidth(180)
        self.collapsed_width = 40
        self.expanded_width = 180
        self.is_collapsed = False
        self.setStyleSheet("background-color: #0f0f0f;")

        self.layout = QVBoxLayout()
        self.layout.setContentsMargins(10, 16, 10, 16)
        self.layout.setSpacing(6)

        # header row
        header = QHBoxLayout()
        self.title = QLabel("Sites")
        self.title.setStyleSheet("color: #e2e8f0; font-size: 13px; font-weight: bold;")

        self.toggle_btn = QPushButton("‹")
        self.toggle_btn.setFixedSize(20, 20)
        self.toggle_btn.setStyleSheet("""
            QPushButton {
                background: none;
                color: #94a3b8;
                border: none;
                font-size: 14px;
            }
            QPushButton:hover { color: #e2e8f0; }
        """)
        self.toggle_btn.clicked.connect(self.toggle)

        header.addWidget(self.title)
        header.addStretch()
        header.addWidget(self.toggle_btn)
        self.layout.addLayout(header)

        # site buttons
        self.buttons = []
        for key, url in sites.items():
            label = url.replace("https://", "").replace("www.", "").split("/")[0]
            btn = QPushButton(f"{key}  {label}")
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #1e1e1e;
                    color: #e2e8f0;
                    border: none;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: left;
                    font-size: 11px;
                }
                QPushButton:hover {
                    background-color: #2a2a2a;
                    color: #3b82f6;
                }
            """)
            btn.clicked.connect(lambda checked, u=url: on_navigate(u))
            self.layout.addWidget(btn)
            self.buttons.append(btn)

        self.layout.addStretch()
        self.setLayout(self.layout)

    def toggle(self):
        self.is_collapsed = not self.is_collapsed
        for btn in self.buttons:
            btn.setVisible(not self.is_collapsed)
        self.title.setVisible(not self.is_collapsed)
        if self.is_collapsed:
            self.setFixedWidth(self.collapsed_width)
            self.toggle_btn.setText("›")
        else:
            self.setFixedWidth(self.expanded_width)
            self.toggle_btn.setText("‹")


class FullscreenPage(QWebEnginePage):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.fullScreenRequested.connect(self.handle_fullscreen)

    def handle_fullscreen(self, request):
        request.accept()


class BrowserWindow(QMainWindow):
    def __init__(self, sites):
        super().__init__()
        self.setWindowTitle("Browser")
        self.resize(1280, 800)

        # central widget with horizontal layout
        container = QWidget()
        layout = QHBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # browser view
        self.browser = QWebEngineView()
        page = FullscreenPage(self.browser)
        self.browser.setPage(page)
        self.browser.setUrl(QUrl(list(sites.values())[0]))

        # sidebar
        sidebar = Sidebar(sites, self.navigate)

        layout.addWidget(sidebar)
        layout.addWidget(self.browser)

        self.setCentralWidget(container)

    def navigate(self, url):
        self.browser.setUrl(QUrl(url))


def main():
    if len(sys.argv) < 2:
        print("Usage: python browser.py <group_name>")
        sys.exit(1)

    group_name = sys.argv[1]
    sites = load_group(group_name)

    app = QApplication(sys.argv)
    window = BrowserWindow(sites)
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
