@echo off
set ip_address_string="IPv4 Address"
echo Network Connection Test
for /f "usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do echo Your IP Address is: %%f
pause