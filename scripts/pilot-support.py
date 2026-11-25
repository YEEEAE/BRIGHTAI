"""Private operator-side register for requests received through the approved support mailbox."""
import argparse
import json
import os
import sqlite3
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--database", required=True)
parser.add_argument("--workspace", type=uuid.UUID, required=True)
parser.add_argument("--operator", type=uuid.UUID, required=True)
actions = parser.add_subparsers(dest="action", required=True)
opening = actions.add_parser("open")
opening.add_argument("category", choices=["access", "availability", "privacy", "deletion", "usage"])
opening.add_argument("severity", choices=["normal", "high", "critical"])
for name in ["show", "assign", "escalate", "close"]:
    sub = actions.add_parser(name)
    sub.add_argument("ticket", type=uuid.UUID)
    if name in ["assign", "escalate"]:
        sub.add_argument("owner", type=uuid.UUID)
args = parser.parse_args()
os.umask(0o077)
db = sqlite3.connect(args.database, timeout=10)
db.row_factory = sqlite3.Row
with db:
    db.execute("""CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY, workspace TEXT NOT NULL, category TEXT NOT NULL,
        severity TEXT NOT NULL, owner TEXT NOT NULL, state TEXT NOT NULL)""")
    db.execute("""CREATE TABLE IF NOT EXISTS history (
        ticket TEXT NOT NULL, actor TEXT NOT NULL, owner TEXT NOT NULL, state TEXT NOT NULL,
        at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))""")
    db.execute("BEGIN IMMEDIATE")
    ticket = str(uuid.uuid4() if args.action == "open" else args.ticket)
    workspace, actor = str(args.workspace), str(args.operator)
    if args.action == "open":
        db.execute("INSERT INTO tickets VALUES (?,?,?,?,?,?)",
                   (ticket, workspace, args.category, args.severity, actor, "open"))
    row = db.execute("SELECT * FROM tickets WHERE workspace=? AND id=?", (workspace, ticket)).fetchone()
    if row is None:
        parser.error("Unknown ticket for this workspace")
    if args.action not in ["open", "show"]:
        if row["state"] == "closed":
            parser.error("Ticket already closed")
        state = {"assign": "assigned", "escalate": "escalated", "close": "closed"}[args.action]
        db.execute("UPDATE tickets SET state=?,owner=? WHERE id=?",
                   (state, str(getattr(args, "owner", row["owner"])), ticket))
    row = db.execute("SELECT * FROM tickets WHERE id=?", (ticket,)).fetchone()
    if args.action != "show":
        db.execute("INSERT INTO history(ticket,actor,owner,state) VALUES (?,?,?,?)",
                   (ticket, actor, row["owner"], row["state"]))
    history = db.execute("SELECT actor,owner,state,at FROM history WHERE ticket=? ORDER BY rowid", (ticket,))
    result = {**dict(row), "history": [dict(event) for event in history]}
print(json.dumps(result))
