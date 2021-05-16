# Function to test if the script is running with adminstrative privileges
function Administrator-Test {
    $CurrentUser = [Security.Principal.WindowsIdentity]::GetCurrent();
    (New-Object Security.Principal.WindowsPrincipal $CurrentUser).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

# Check whether the installer has administrative privileges.
# If not, run it as administrator.
if ((Administrator-Test) -eq $False) {
    # Not running with elevated perms, so let's run it as administrator.
    PowerShell -NoProfile -ExecutionPolicy Unrestricted -Command "& {Start-Process PowerShell -ArgumentList '-NoProfile -NoExit -ExecutionPolicy Unrestricted -File "$MyInvocation.MyCommand.Definition"' -Verb RunAs}";
    # We need to exit it otherwise the rest of the script will keep on running.
    Exit 0
}

# Function to print message from Installer
# Params:
#   $1 The message string
Function Print::Installer($1) {
  $NC = $host.ui.RawUI.ForegroundColor
  $host.ui.RawUI.ForegroundColor = "Cyan"

  Write-Host "[Installer]: " -NoNewline

  $host.ui.RawUI.ForegroundColor = $NC

  Write-Host "$1"
}

# Function to print error
# Params:
#   $1 The error string
Function Print::Error($1) {
  $NC = $host.ui.RawUI.ForegroundColor
  $host.ui.RawUI.ForegroundColor = "Red"

  Write-Host "[ERROR]: " -NoNewline

  $host.ui.RawUI.ForegroundColor = $NC

  Write-Host "$1"

  Write-Host

 Exit 1
}

# Function to print 'Done' after a step is complete
Function Print::Done() {
  Print::Installer "Done."
  Write-Host
}


# Function to install any given package(s) from the package manager
# Params:
#   $1 The list of package names
Function Install::Package($1) {
  choco install $1 -y
  If (-Not ($?)) {
    Print::Error "Unable to download and install $1."
  }
  refreshenv
}

# Function to install system packages required by Lavalink
# List of packages:
#   1. Chocolatey
#   2. Java (Zulu 13.29.9)
Function Install::Packages() {
	Print::Installer "Installing required system packages..."

  Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
  If (-Not ($?)) {
    Print::Error "Unable to download and install Chocolatey."
  }

  # Install Java
  Install::Package "nodejs-lts"

  Print::Done
}

Function Main() {

	Install::Packages

	Write-Host
}

Main

Exit 0

#EOF