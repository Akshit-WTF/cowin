@echo off
cls
set nodeV=
for /f "delims=" %%a in ('node -v') do @set nodeV=%%a
if  %nodeV% NEQ [] (
  npm install
) else (
   ECHO PLEASE INSTALL NODE.JS - https://cowin-docs.glitch.me/requirements.html#nodejs
)