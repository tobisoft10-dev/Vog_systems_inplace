import subprocess

passwords = [
    '150609%M',
    'Vog2026!',
    'VogTekstil2026!',
    'Siparis2026!',
    'Vog123456!',
    'Vog123456',
    'Vog2025!',
    'Meyer2026!',
    'Meyer123!',
    '123456',
    'Password123!',
    'sa',
    'admin',
    'Root123!'
]

found = None
for pwd in passwords:
    cmd = f'sqlcmd -S .\\SQLEXPRESS -U sa -P "{pwd}" -Q "SELECT TOP 1 Id, Model FROM [SIPARIS].[dbo].[Siparisler]"'
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if 'Login failed' not in res.stderr and 'Error' not in res.stderr and res.returncode == 0:
        print("FOUND WORKING SA PASSWORD: " + pwd)
        found = pwd
        break

if not found:
    print("❌ SA password not found in standard list.")
