"""
VERSLOMATIKA • AI B2B EKOSISTEMA
Modernus valdymo pultas (CustomTkinter GUI) su Windows Autostart integracija.
Vieta: E:\\Verslomatika
"""

import os
import sys
import time
import json
import urllib.request
import webbrowser
import threading
import subprocess
from datetime import datetime

# Užtikriname UTF-8 terminalo ir GUI srautus
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import psutil
import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
STARTUP_DIR = os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup")
AUTOSTART_BAT_NAME = "Verslomatika_AutoStart.bat"
AUTOSTART_BAT_PATH = os.path.join(STARTUP_DIR, AUTOSTART_BAT_NAME)

SERVICES = {
    "reputationpro": {
        "id": "reputationpro",
        "name": "ReputationPro",
        "title": "🌟 ReputationPro (Port 3000)",
        "desc": "5★ Google atsiliepimų apsauga, demo puslapiai (/r/[slug]), registracija (/checkout) ir vadovo pultas (/admin).",
        "port": 3000,
        "url": "http://127.0.0.1:3000",
        "health_url": "http://127.0.0.1:3000/api/health",
        "cwd": os.path.join(ROOT_DIR, "apps", "reputationpro"),
        "cmd": ["cmd.exe", "/c", "npx next start -H 127.0.0.1 -p 3000"],
    },
    "reviveleads": {
        "id": "reviveleads",
        "name": "ReviveLeads",
        "title": "🔄 ReviveLeads (Port 3002)",
        "desc": "Snaudžiančių klientų bazių atgaivinimo ir konversijų skatinimo platforma su automatizuotomis kampanijomis.",
        "port": 3002,
        "url": "http://127.0.0.1:3002",
        "health_url": "http://127.0.0.1:3002/api/health",
        "cwd": os.path.join(ROOT_DIR, "apps", "reviveleads"),
        "cmd": ["cmd.exe", "/c", "npx next start -H 127.0.0.1 -p 3002"],
    },
    "bridge": {
        "id": "bridge",
        "name": "Holding Bridge",
        "title": "🌉 Holding Bridge Server (Port 5050)",
        "desc": "Antigravity ↔ Codex agentų tarpusavio ryšio, būsenos (state) sinchronizavimo ir API tiltas.",
        "port": 5050,
        "url": "http://127.0.0.1:5050",
        "health_url": "http://127.0.0.1:5050/api/state",
        "cwd": os.path.join(ROOT_DIR, "bridge"),
        "cmd": [sys.executable, "bridge_server.py"],
    },
    "tunnel": {
        "id": "tunnel",
        "name": "Cloudflare VPS Tunnel",
        "title": "☁️ Cloudflare VPS Tunelis (24/7 Saugi Vieša Prieiga)",
        "desc": "reputacija.verslomatika.lt ir reviveleads.verslomatika.lt tiesioginis saugus tunelis į šį PC.",
        "port": 20241,
        "url": "https://reputacija.verslomatika.lt",
        "health_url": "http://127.0.0.1:20241/ready",
        "cwd": ROOT_DIR,
        "cmd": [os.path.join(ROOT_DIR, "tools", "cloudflared.exe"), "tunnel", "--metrics", "127.0.0.1:20241", "run", "verslomatika-vps"],
    }
}


def is_port_listening(port: int) -> bool:
    """Patikrina, ar nurodytas portas yra klausomas."""
    try:
        for c in psutil.net_connections(kind='inet'):
            if c.status == psutil.CONN_LISTEN and c.laddr.port == port:
                return True
    except Exception:
        pass
    return False


def check_http_health(url: str, timeout: float = 1.2) -> bool:
    """Patikrina HTTP endpointo prieinamumą."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Verslomatika-GUI-Monitor/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status in (200, 201, 204)
    except Exception:
        return False


def kill_processes_on_port(port: int):
    """Sustabdo visus procesus, kurie naudoja nurodytą portą."""
    killed_pids = set()
    try:
        for c in psutil.net_connections(kind='inet'):
            if c.status == psutil.CONN_LISTEN and c.laddr.port == port and c.pid:
                killed_pids.add(c.pid)
    except Exception:
        pass

    for pid in killed_pids:
        try:
            p = psutil.Process(pid)
            for child in p.children(recursive=True):
                try:
                    child.kill()
                except Exception:
                    pass
            p.kill()
        except Exception:
            pass


def is_autostart_configured() -> bool:
    """Patikrina, ar autostart failas yra Windows Startup aplanke."""
    return os.path.exists(AUTOSTART_BAT_PATH)


def configure_autostart(enable: bool) -> bool:
    """Įjungia arba išjungia automatinį paleidimą po Windows perkrovimo."""
    try:
        if enable:
            os.makedirs(STARTUP_DIR, exist_ok=True)
            pythonw_path = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
            if not os.path.exists(pythonw_path):
                pythonw_path = sys.executable

            gui_script = os.path.join(ROOT_DIR, "verslomatika_gui.py")
            bat_content = (
                "@echo off\r\n"
                f"cd /d \"{ROOT_DIR}\"\r\n"
                f"start \"\" \"{pythonw_path}\" \"{gui_script}\" --autostart\r\n"
            )
            with open(AUTOSTART_BAT_PATH, "w", encoding="utf-8") as f:
                f.write(bat_content)
            return True
        else:
            if os.path.exists(AUTOSTART_BAT_PATH):
                os.remove(AUTOSTART_BAT_PATH)
            return True
    except Exception as e:
        print(f"[Autostart Error] {e}")
        return False


class VerslomatikaGUI(ctk.CTk):
    def __init__(self, autostart_mode: bool = False):
        super().__init__()
        self.autostart_mode = autostart_mode

        # Lango konfigūracija
        self.title("Verslomatika AI • Autonominė B2B Sistema")
        self.geometry("1020x820")
        self.minsize(940, 720)
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.service_cards = {}
        self.monitoring_active = True
        self.processes = {}

        self.setup_ui()
        self.log(f"Verslomatika valdymo pultas paleistas iš: {ROOT_DIR}")

        # Start status monitoring thread
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()

        # Jei paleista per Windows autostart, automatiškai paleidžiame visus servisus
        if self.autostart_mode:
            self.log("[AUTOSTART] Aptiktas Windows startas – automatiškai paleidžiami visi servisai...")
            self.after(1000, self.start_all_services)

    def setup_ui(self):
        # 1. HEADER FRAME
        header_frame = ctk.CTkFrame(self, corner_radius=12, fg_color="#18181b")
        header_frame.pack(fill="x", padx=16, pady=(16, 8))

        title_container = ctk.CTkFrame(header_frame, fg_color="transparent")
        title_container.pack(side="left", padx=16, pady=12)

        title_label = ctk.CTkLabel(
            title_container,
            text="VERSLOMATIKA",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color="#60a5fa"
        )
        title_label.pack(anchor="w")

        subtitle_label = ctk.CTkLabel(
            title_container,
            text="Autonominė B2B Agentinė Sistema & 5★ Reputacijos Platforma • E:\\Verslomatika",
            font=ctk.CTkFont(size=12),
            text_color="#94a3b8"
        )
        subtitle_label.pack(anchor="w")

        # Global Quick Action Buttons
        btn_container = ctk.CTkFrame(header_frame, fg_color="transparent")
        btn_container.pack(side="right", padx=16, pady=12)

        self.btn_start_all = ctk.CTkButton(
            btn_container,
            text="🚀 Paleisti Viską",
            fg_color="#16a34a",
            hover_color="#15803d",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self.start_all_services
        )
        self.btn_start_all.pack(side="left", padx=6)

        self.btn_stop_all = ctk.CTkButton(
            btn_container,
            text="⏹️ Sustabdyti Viską",
            fg_color="#dc2626",
            hover_color="#b91c1c",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self.stop_all_services
        )
        self.btn_stop_all.pack(side="left", padx=6)

        self.btn_restart_all = ctk.CTkButton(
            btn_container,
            text="🔄 Perkrauti",
            fg_color="#475569",
            hover_color="#334155",
            font=ctk.CTkFont(size=13),
            width=90,
            command=self.restart_all_services
        )
        self.btn_restart_all.pack(side="left", padx=6)

        # 2. AUTOSTART CARD FRAME
        autostart_frame = ctk.CTkFrame(self, corner_radius=12, fg_color="#1e293b")
        autostart_frame.pack(fill="x", padx=16, pady=6)

        auto_info = ctk.CTkFrame(autostart_frame, fg_color="transparent")
        auto_info.pack(side="left", padx=16, pady=10)

        auto_title = ctk.CTkLabel(
            auto_info,
            text="⚙️ Windows Autostart (Automatinis paleidimas po PC perkrovimo)",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#f8fafc"
        )
        auto_title.pack(anchor="w")

        self.auto_desc = ctk.CTkLabel(
            auto_info,
            text="Kiekvieną kartą įjungus ar perkrovus kompiuterį, visi Verslomatika servisai automatiškai startuos fone.",
            font=ctk.CTkFont(size=12),
            text_color="#94a3b8"
        )
        self.auto_desc.pack(anchor="w")

        self.autostart_switch_var = ctk.BooleanVar(value=is_autostart_configured())
        self.autostart_switch = ctk.CTkSwitch(
            autostart_frame,
            text="Įjungtas į Windows Startup",
            variable=self.autostart_switch_var,
            onvalue=True,
            offvalue=False,
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self.toggle_autostart
        )
        self.autostart_switch.pack(side="right", padx=20, pady=10)

        # 3. SERVICES LIST (CARDS)
        services_container = ctk.CTkFrame(self, corner_radius=12, fg_color="#0f172a")
        services_container.pack(fill="x", padx=16, pady=6)

        services_title = ctk.CTkLabel(
            services_container,
            text="🌐 PAGRINDINĖS SISTEMOS PASLAUGOS IR PRIEIGOS TAŠKAI",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#94a3b8"
        )
        services_title.pack(anchor="w", padx=16, pady=(12, 6))

        for key, srv in SERVICES.items():
            card = self.create_service_card(services_container, key, srv)
            card.pack(fill="x", padx=12, pady=4)

        # 4. AGENTS QUICK ACTIONS FRAME
        agents_frame = ctk.CTkFrame(self, corner_radius=12, fg_color="#18181b")
        agents_frame.pack(fill="x", padx=16, pady=6)

        agents_header = ctk.CTkLabel(
            agents_frame,
            text="🤖 AUTONOMINIAI AGENTAI & GREITIEJI VEIKSMAI",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#94a3b8"
        )
        agents_header.pack(anchor="w", padx=16, pady=(10, 4))

        agents_buttons = ctk.CTkFrame(agents_frame, fg_color="transparent")
        agents_buttons.pack(fill="x", padx=12, pady=(0, 10))

        btn_kubilai = ctk.CTkButton(
            agents_buttons,
            text="🌲 Kubilų Eksporto Agentai (Elena & Klaus)",
            fg_color="#0284c7",
            hover_color="#0369a1",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.trigger_kubilai_agents
        )
        btn_kubilai.pack(side="left", padx=4, expand=True, fill="x")

        btn_verify = ctk.CTkButton(
            agents_buttons,
            text="🧪 Pilna Sistemos Patikra (Verification)",
            fg_color="#0d9488",
            hover_color="#0f766e",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self.trigger_system_verification
        )
        btn_verify.pack(side="left", padx=4, expand=True, fill="x")

        btn_folder = ctk.CTkButton(
            agents_buttons,
            text="📁 Atidaryti E:\\Verslomatika",
            fg_color="#334155",
            hover_color="#1e293b",
            font=ctk.CTkFont(size=12),
            command=self.open_project_folder
        )
        btn_folder.pack(side="left", padx=4, expand=True, fill="x")

        # 5. LOG CONSOLE FRAME
        log_frame = ctk.CTkFrame(self, corner_radius=12, fg_color="#111827")
        log_frame.pack(fill="both", expand=True, padx=16, pady=(6, 16))

        log_header = ctk.CTkFrame(log_frame, fg_color="transparent")
        log_header.pack(fill="x", padx=12, pady=(8, 4))

        log_title = ctk.CTkLabel(
            log_header,
            text="📋 SISTEMOS ĮVYKIŲ IR AGENTŲ ŽURNALAS",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color="#9ca3af"
        )
        log_title.pack(side="left")

        btn_clear_log = ctk.CTkButton(
            log_header,
            text="Išvalyti žurnalą",
            width=90,
            height=24,
            fg_color="#374151",
            hover_color="#4b5563",
            font=ctk.CTkFont(size=11),
            command=self.clear_log
        )
        btn_clear_log.pack(side="right")

        self.log_textbox = ctk.CTkTextbox(
            log_frame,
            fg_color="#030712",
            text_color="#e2e8f0",
            font=ctk.CTkFont(family="Consolas", size=12),
            wrap="word"
        )
        self.log_textbox.pack(fill="both", expand=True, padx=12, pady=(0, 10))

    def create_service_card(self, parent, key: str, srv: dict):
        card = ctk.CTkFrame(parent, corner_radius=8, fg_color="#1e293b")

        left_part = ctk.CTkFrame(card, fg_color="transparent")
        left_part.pack(side="left", fill="x", expand=True, padx=14, pady=10)

        title_row = ctk.CTkFrame(left_part, fg_color="transparent")
        title_row.pack(fill="x", anchor="w")

        srv_title = ctk.CTkLabel(
            title_row,
            text=srv["title"],
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#f8fafc"
        )
        srv_title.pack(side="left")

        status_badge = ctk.CTkLabel(
            title_row,
            text="⏳ TIKRINAMA...",
            font=ctk.CTkFont(size=11, weight="bold"),
            fg_color="#334155",
            text_color="#cbd5e1",
            corner_radius=6,
            padx=8,
            pady=2
        )
        status_badge.pack(side="left", padx=12)

        desc_label = ctk.CTkLabel(
            left_part,
            text=srv["desc"],
            font=ctk.CTkFont(size=11),
            text_color="#94a3b8",
            wraplength=520,
            justify="left"
        )
        desc_label.pack(anchor="w", pady=(2, 0))

        # Actions
        actions_part = ctk.CTkFrame(card, fg_color="transparent")
        actions_part.pack(side="right", padx=14, pady=10)

        btn_start = ctk.CTkButton(
            actions_part,
            text="Paleisti",
            width=80,
            height=28,
            fg_color="#16a34a",
            hover_color="#15803d",
            font=ctk.CTkFont(size=12),
            command=lambda k=key: self.start_service(k)
        )
        btn_start.pack(side="left", padx=4)

        btn_stop = ctk.CTkButton(
            actions_part,
            text="Sustabdyti",
            width=85,
            height=28,
            fg_color="#dc2626",
            hover_color="#b91c1c",
            font=ctk.CTkFont(size=12),
            command=lambda k=key: self.stop_service(k)
        )
        btn_stop.pack(side="left", padx=4)

        btn_open = ctk.CTkButton(
            actions_part,
            text="🌐 Atidaryti",
            width=90,
            height=28,
            fg_color="#2563eb",
            hover_color="#1d4ed8",
            font=ctk.CTkFont(size=12, weight="bold"),
            command=lambda u=srv["url"]: webbrowser.open(u)
        )
        btn_open.pack(side="left", padx=4)

        self.service_cards[key] = {
            "badge": status_badge,
            "btn_start": btn_start,
            "btn_stop": btn_stop,
            "btn_open": btn_open
        }
        return card

    def log(self, message: str):
        """Prideda pranešimą į GUI žurnalą."""
        now = datetime.now().strftime("%H:%M:%S")
        full_msg = f"[{now}] {message}\n"
        self.log_textbox.insert("end", full_msg)
        self.log_textbox.see("end")

    def clear_log(self):
        self.log_textbox.delete("1.0", "end")

    def toggle_autostart(self):
        val = self.autostart_switch_var.get()
        success = configure_autostart(val)
        if success:
            if val:
                self.log("✅ Windows Autostart SĖKMINGAI ĮJUNGTAS! Sukurtas paleidimo failas Windows Startup aplanke.")
                messagebox.showinfo("Autostart", "Automatinis paleidimas sėkmingai įjungtas!\nKiekvieną kartą persikrovus Windows, Verslomatika servisai pasileis automatiškai.")
            else:
                self.log("ℹ️ Windows Autostart išjungtas. Pašalintas failas iš Startup aplanko.")
                messagebox.showinfo("Autostart", "Automatinis paleidimas išjungtas.")
        else:
            self.log("❌ Klaida konfigūruojant Windows Autostart.")
            messagebox.showerror("Klaida", "Nepavyko atnaujinti Windows Startup konfigūracijos.")

    def _monitor_loop(self):
        """Foninis statuso tikrinimo ciklas kas 2 sekundes."""
        while self.monitoring_active:
            for key, srv in SERVICES.items():
                port = srv["port"]
                health_url = srv["health_url"]

                is_port_up = is_port_listening(port)
                is_http_up = check_http_health(health_url) if is_port_up else False

                self.after(0, self._update_service_status, key, is_port_up, is_http_up)
            time.sleep(2.5)

    def _update_service_status(self, key: str, is_port_up: bool, is_http_up: bool):
        card = self.service_cards.get(key)
        if not card:
            return

        badge = card["badge"]
        btn_start = card["btn_start"]
        btn_stop = card["btn_stop"]

        if is_http_up:
            badge.configure(text="🟢 VEIKIA (200 OK)", fg_color="#14532d", text_color="#86efac")
            btn_start.configure(state="disabled")
            btn_stop.configure(state="normal")
        elif is_port_up:
            badge.configure(text="🟡 JUNGIMASIS...", fg_color="#713f12", text_color="#fde047")
            btn_start.configure(state="disabled")
            btn_stop.configure(state="normal")
        else:
            badge.configure(text="🔴 SUSTABDYTA", fg_color="#334155", text_color="#cbd5e1")
            btn_start.configure(state="normal")
            btn_stop.configure(state="disabled")

    def start_service(self, key: str):
        threading.Thread(target=self._start_service_async, args=(key,), daemon=True).start()

    def _start_service_async(self, key: str):
        srv = SERVICES.get(key)
        if not srv:
            return

        self.log(f"Paleidžiamas {srv['name']} (Port {srv['port']})...")
        try:
            # Paleidžiame foninį procesą
            p = subprocess.Popen(
                srv["cmd"],
                cwd=srv["cwd"],
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            self.processes[key] = p
            self.log(f"Procesas paleistas (PID: {p.pid}). Laukiama porto {srv['port']} atsako...")
        except Exception as e:
            self.log(f"❌ Klaida paleidžiant {srv['name']}: {e}")

    def stop_service(self, key: str):
        threading.Thread(target=self._stop_service_async, args=(key,), daemon=True).start()

    def _stop_service_async(self, key: str):
        srv = SERVICES.get(key)
        if not srv:
            return

        self.log(f"Sustabdomas {srv['name']} (Port {srv['port']})...")
        try:
            kill_processes_on_port(srv["port"])
            self.log(f"✅ {srv['name']} sėkmingai sustabdytas.")
        except Exception as e:
            self.log(f"❌ Klaida stabdant {srv['name']}: {e}")

    def start_all_services(self):
        self.log("🚀 Paleidžiami visi Verslomatika servisai...")
        for key in ["bridge", "reputationpro", "reviveleads", "tunnel"]:
            if not is_port_listening(SERVICES[key]["port"]):
                self.start_service(key)
                time.sleep(1.0)

    def stop_all_services(self):
        self.log("⏹️ Sustabdomi visi servisai...")
        for key in SERVICES.keys():
            self.stop_service(key)

    def restart_all_services(self):
        self.log("🔄 Perkraunami visi servisai...")
        self.stop_all_services()
        threading.Thread(target=self._restart_after_delay, daemon=True).start()

    def _restart_after_delay(self):
        time.sleep(3.0)
        self.start_all_services()

    def trigger_kubilai_agents(self):
        threading.Thread(target=self._run_kubilai_async, daemon=True).start()

    def _run_kubilai_async(self):
        self.log("🌲 [AGENTAI] Paleidžiamas Kubilų eksporto ciklas (Elena, Klaus, Sophie, Erik)...")
        cmd = [sys.executable, "run_kubilai_agents.py", "--business", "kubilai_europa", "--agent", "all"]
        try:
            proc = subprocess.Popen(
                cmd,
                cwd=ROOT_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            for line in proc.stdout:
                line_str = line.strip()
                if line_str:
                    self.log(f"[Kubilai] {line_str}")
            proc.wait()
            self.log("✅ [AGENTAI] Kubilų eksporto ciklas sėkmingai baigtas! Rezultatai atnaujinti.")
        except Exception as e:
            self.log(f"❌ [AGENTAI] Klaida vykdant kubilų agentus: {e}")

    def trigger_system_verification(self):
        threading.Thread(target=self._run_verification_async, daemon=True).start()

    def _run_verification_async(self):
        self.log("🧪 [TESTAS] Pradedama pilna sistemos patikra (test_full_system_verification.py)...")
        cmd = [sys.executable, "test_full_system_verification.py"]
        try:
            proc = subprocess.Popen(
                cmd,
                cwd=ROOT_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            for line in proc.stdout:
                line_str = line.strip()
                if line_str:
                    self.log(f"[Test] {line_str}")
            proc.wait()
            self.log("✅ [TESTAS] Patikra baigta!")
        except Exception as e:
            self.log(f"❌ [TESTAS] Klaida atliekant patikrą: {e}")

    def open_project_folder(self):
        try:
            os.startfile(ROOT_DIR)
        except Exception as e:
            self.log(f"Klaida atidarant aplanką: {e}")


def main():
    autostart = "--autostart" in sys.argv
    app = VerslomatikaGUI(autostart_mode=autostart)
    app.mainloop()


if __name__ == "__main__":
    main()
