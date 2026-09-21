import sqlite3
import json
import os
import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "urdhva.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pos_x REAL NOT NULL,
        pos_y REAL NOT NULL,
        pos_z REAL NOT NULL,
        width REAL NOT NULL,
        length REAL NOT NULL,
        approved_floors INTEGER NOT NULL,
        actual_floors INTEGER NOT NULL,
        approved_depth REAL NOT NULL,
        actual_depth REAL NOT NULL,
        units_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS infrastructure (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        path_json TEXT NOT NULL,
        radius REAL NOT NULL,
        color TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS underground_features (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        pos_x REAL NOT NULL,
        pos_y REAL NOT NULL,
        pos_z REAL NOT NULL,
        radius REAL NOT NULL,
        depth REAL NOT NULL,
        status TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS drone_surveys (
        id TEXT PRIMARY KEY,
        building_name TEXT NOT NULL,
        filename TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        result_building_id TEXT,
        report_json TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gpr_scans (
        id TEXT PRIMARY KEY,
        scan_name TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        findings_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS survey_imports (
        id TEXT PRIMARY KEY,
        filename TEXT,
        file_type TEXT,
        records_json TEXT,
        parcels_json TEXT,
        import_date TEXT,
        status TEXT DEFAULT 'imported'
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blockchain_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_id TEXT,
        record_hash TEXT,
        timestamp TEXT,
        source TEXT,
        data_snapshot TEXT,
        verified INTEGER DEFAULT 1
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS survey_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_id TEXT,
        import_id TEXT,
        match_status TEXT,
        matched_records INTEGER DEFAULT 0,
        needs_verification INTEGER DEFAULT 0,
        unmatched INTEGER DEFAULT 0,
        link_date TEXT
    )
    """)

    # ── Standards-compliant ULPIN registry (State+District+Tehsil+Village+Parcel) ──
    # Tracks every base ULPIN ever issued so the next parcel number per village
    # is always unique, even across restarts.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ulpin_registry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state_code TEXT NOT NULL,
        district_code TEXT NOT NULL,
        subdistrict_code TEXT NOT NULL,
        village_code TEXT NOT NULL,
        parcel_no INTEGER NOT NULL,
        base_ulpin TEXT UNIQUE NOT NULL,
        building_id TEXT,
        issued_at TEXT NOT NULL
    )
    """)

    # ── Users (real login credentials) ──
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # ── Revoked JWTs (so POST /api/auth/logout can actually invalidate a token) ──
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti TEXT PRIMARY KEY,
        revoked_at TEXT NOT NULL
    )
    """)

    # Add shape & LiDAR metadata columns if they do not exist
    for col_def in [
        "shape TEXT DEFAULT 'rectangle'",
        "shape_params_json TEXT DEFAULT '{}'",
        "source_type TEXT DEFAULT 'Standard Cadastre'",
        "source_file TEXT",
        "point_count INTEGER",
        "survey_date TEXT",
        "confidence REAL DEFAULT 99.1",
        # 14-digit standards-compliant ULPIN base (State+District+Tehsil+Village+Parcel),
        # stored compact/no-separators. Unit-level ULPINs are this base + a vertical suffix.
        "base_ulpin TEXT"
    ]:
        try:
            cursor.execute(f"ALTER TABLE buildings ADD COLUMN {col_def}")
        except Exception:
            pass

    conn.commit()

    # Seed data if buildings table is empty
    cursor.execute("SELECT COUNT(*) FROM buildings")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_data(conn)

    # Seed demo login accounts (idempotent — only runs if `users` is empty)
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users(conn)

    conn.close()


def seed_users(conn):
    """Seeds one demo account per role with clearly-labeled demo credentials.
    Passwords are hashed with bcrypt — never stored in plaintext."""
    import bcrypt
    import uuid

    cursor = conn.cursor()
    demo_accounts = [
        ("citizen_demo",    "Citizen@123",    "citizen",    "Demo Citizen"),
        ("corporator_demo", "Corporator@123", "corporator", "Demo Corporator"),
        ("builder_demo",    "Builder@123",    "builder",    "Demo Builder"),
        ("datasurvey_demo", "DataSurvey@123", "datasurvey", "Demo Data & Survey Officer"),
    ]
    now = datetime.datetime.now().isoformat()
    for username, password, role, full_name in demo_accounts:
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            """
            INSERT OR IGNORE INTO users (id, username, password_hash, role, full_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (str(uuid.uuid4()), username, password_hash, role, full_name, now),
        )
    conn.commit()
    print("Demo user accounts seeded (see backend/database.py seed_users() for credentials).")

def seed_data(conn):
    cursor = conn.cursor()
    public_data_dir = Path(__file__).parent.parent / "public" / "data"
    buildings_file = public_data_dir / "buildings.json"
    infra_file = public_data_dir / "infrastructure.json"

    if buildings_file.exists():
        with open(buildings_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            buildings = data.get("buildings", [])
            for b in buildings:
                pos = b.get("position", [0, 0, 0])
                fp = b.get("footprint", [10, 10])
                base_ulpin = b.get("baseUlpin")
                cursor.execute("""
                INSERT OR REPLACE INTO buildings (
                    id, name, pos_x, pos_y, pos_z, width, length,
                    approved_floors, actual_floors, approved_depth, actual_depth, units_json,
                    base_ulpin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    b["id"],
                    b["name"],
                    pos[0], pos[1], pos[2],
                    fp[0], fp[1],
                    b.get("approvedFloors", 5),
                    b.get("actualFloors", 5),
                    b.get("approvedDepth", -6.0),
                    b.get("actualDepth", -6.0),
                    json.dumps(b.get("units", [])),
                    base_ulpin
                ))

                # Register the seeded base ULPIN in the registry too, so that
                # generate_base_ulpin() continues the sequence correctly for
                # that village instead of ever reissuing/colliding with it.
                if base_ulpin:
                    try:
                        import ulpin as ulpin_module
                        loc = ulpin_module.resolve_locality(b["id"])
                        parcel_no = int(base_ulpin[10:14])
                        cursor.execute("""
                        INSERT OR IGNORE INTO ulpin_registry (
                            state_code, district_code, subdistrict_code, village_code,
                            parcel_no, base_ulpin, building_id, issued_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            base_ulpin[0:2], base_ulpin[2:4],
                            loc["subdistrict_code"], loc["village_code"],
                            parcel_no, base_ulpin, b["id"],
                            datetime.datetime.now().isoformat()
                        ))
                    except Exception:
                        pass

            features = data.get("undergroundFeatures", [])
            for feat in features:
                pos = feat.get("position", [0, 0, 0])
                cursor.execute("""
                INSERT OR REPLACE INTO underground_features (
                    id, type, label, pos_x, pos_y, pos_z, radius, depth, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    feat["id"],
                    feat["type"],
                    feat["label"],
                    pos[0], pos[1], pos[2],
                    feat.get("radius", 2.0),
                    feat.get("depth", -5.0),
                    feat.get("status", "active")
                ))

    if infra_file.exists():
        with open(infra_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            infras = data.get("infrastructure", [])
            for inf in infras:
                cursor.execute("""
                INSERT OR REPLACE INTO infrastructure (
                    id, type, label, path_json, radius, color
                ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    inf["id"],
                    inf["type"],
                    inf["label"],
                    json.dumps(inf["path"]),
                    inf.get("radius", 0.5),
                    inf.get("color", "#3b82f6")
                ))

    conn.commit()
    print("Database seeded successfully.")

def reset_database_to_defaults():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM buildings")
    cursor.execute("DELETE FROM infrastructure")
    cursor.execute("DELETE FROM underground_features")
    cursor.execute("DELETE FROM drone_surveys")
    cursor.execute("DELETE FROM gpr_scans")
    cursor.execute("DELETE FROM alerts")
    conn.commit()
    seed_data(conn)
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
