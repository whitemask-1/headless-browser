import json
import os

DATA_FILE = os.path.expanduser("~/.browser_groups.json")


def load():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE) as f:
        return json.load(f)


def save(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def main():
    data = load()

    while True:
        print("\nGroups:", list(data.keys()) or "none")
        print("1) Create/edit group  2) Delete group  3) View group  q) Quit")
        choice = input("> ").strip()

        if choice == "q":
            break

        elif choice == "1":
            name = input("Group name: ").strip()
            print("Enter URLs one per line, empty line to finish:")
            urls = {}
            i = 1
            while True:
                url = input(f"  {i}: ").strip()
                if not url:
                    break
                urls[str(i)] = url
                i += 1
            data[name] = urls
            save(data)
            print(f"Saved group '{name}'")

        elif choice == "2":
            name = input("Group to delete: ").strip()
            if name in data:
                del data[name]
                save(data)
                print(f"Deleted '{name}'")
            else:
                print("Not found")

        elif choice == "3":
            name = input("Group to view: ").strip()
            if name in data:
                for k, v in data[name].items():
                    print(f"  {k}: {v}")
            else:
                print("Not found")


if __name__ == "__main__":
    main()
