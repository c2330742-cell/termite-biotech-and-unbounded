#!/usr/bin/env python3
"""
UNBOUNDED — Launch Point

Start here to access everything: the CLI gateway, the web portal,
the data dashboard, and the full project repositories.
"""

import os
import sys
import subprocess
import webbrowser
import urllib.parse

BASE = os.path.dirname(os.path.abspath(__file__))
TERMITE_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'termite-projects')

def check_termite():
    if os.path.isdir(TERMITE_BASE):
        files = os.listdir(TERMITE_BASE)
        print(f"  ✅  Termite project accessible: {len(files)} items found")
    else:
        print(f"  ⚠  Termite project NOT found at: {TERMITE_BASE}")
        print(f"      Expected location: {TERMITE_BASE}")

def file_uri(path):
    return 'file://' + urllib.parse.quote(path, safe='/:\\')

def banner():
    print()
    print("  ╔══════════════════════════════════════════════════╗")
    print("  ║             ✦  U N B O U N D E D  ✦            ║")
    print("  ║    From the soil to the screen — and beyond     ║")
    print("  ╚══════════════════════════════════════════════════╝")
    print()
    print(f"  📁  Termite Project:  {TERMITE_BASE}")
    print(f"  📁  UNBOUNDED:         {BASE}")
    print()
    check_termite()
    print()

def menu():
    print()
    print("  ┌──────────────────────────────────────────────────┐")
    print("  │  [1]  Launch CLI Gateway (src/gateway.py)       │")
    print("  │  [2]  Start Web Server (port 8080)              │")
    print("  │  [3]  Open Web Portal (portal.html)             │")
    print("  │  [4]  Open Data Dashboard (dashboard.html)      │")
    print("  │  [5]  Open Landing Page (index.html)            │")
    print("  │  [6]  Open Project Folder                       │")
    print("  │  [0]  Exit                                      │")
    print("  └──────────────────────────────────────────────────┘")
    print()

def main():
    banner()
    
    server_proc = None
    
    while True:
        menu()
        choice = input("  Select: ").strip()
        
        if choice == '1':
            gateway = os.path.join(BASE, 'src', 'gateway.py')
            if os.path.exists(gateway):
                print("\n  Launching CLI Gateway...\n")
                subprocess.call([sys.executable, gateway])
                print("\n  ── Back from gateway ──")
            else:
                print(f"\n  ⚠  Gateway not found at: {gateway}")
                print("      Expected: src/gateway.py inside the UNBOUNDED folder")
        
        elif choice == '2':
            if server_proc and server_proc.poll() is None:
                print("  ⚠  Server already running on http://localhost:8080")
                webbrowser.open('http://localhost:8080')
                continue
            
            site_dir = os.path.join(BASE, 'site')
            if not os.path.isdir(site_dir):
                print(f"\n  ⚠  Site directory not found at: {site_dir}")
                continue

            print(f"\n  Starting web server at http://localhost:8080")
            print(f"  Serving: {site_dir}")
            print("  (Close terminal or press Ctrl+C to stop)\n")
            
            try:
                server_proc = subprocess.Popen(
                    [sys.executable, '-m', 'http.server', '8080', '--directory', site_dir],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                import time
                time.sleep(1)
                webbrowser.open('http://localhost:8080')
            except Exception as e:
                print(f"  ⚠  Could not start server: {e}")
        
        elif choice == '3':
            portal = os.path.join(BASE, 'site', 'portal.html')
            if os.path.exists(portal):
                print(f"\n  Opening portal: {portal}\n")
                webbrowser.open(file_uri(portal))
            else:
                print(f"\n  ⚠  Portal not found at: {portal}")
                print("      Expected: site/portal.html inside the UNBOUNDED folder")
        
        elif choice == '4':
            dashboard = os.path.join(BASE, 'site', 'dashboard.html')
            if os.path.exists(dashboard):
                print(f"\n  Opening dashboard: {dashboard}\n")
                webbrowser.open(file_uri(dashboard))
            else:
                print(f"\n  ⚠  Dashboard not found at: {dashboard}")
                print("      Expected: site/dashboard.html inside the UNBOUNDED folder")
        
        elif choice == '5':
            landing = os.path.join(BASE, 'site', 'index.html')
            if os.path.exists(landing):
                print(f"\n  Opening landing page: {landing}\n")
                webbrowser.open(file_uri(landing))
            else:
                print(f"\n  ⚠  Landing page not found at: {landing}")
                print("      Expected: site/index.html inside the UNBOUNDED folder")
        
        elif choice == '6':
            print(f"\n  Opening project folder: {BASE}\n")
            webbrowser.open(file_uri(BASE))
        
        elif choice == '0':
            if server_proc and server_proc.poll() is None:
                print("\n  Stopping web server...")
                server_proc.terminate()
                server_proc.wait()
            print("\n  ✦  The beacon remains. Come back anytime.  ✦\n")
            break
        
        else:
            print("  ⚠  Invalid choice. Select 0-6.")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  ✦  Until next time.  ✦\n")
        sys.exit(0)
