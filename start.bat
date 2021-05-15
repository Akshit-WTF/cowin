if exist node_modules\ (
  goto f1
) else (
  goto f2
)

:f1
node index

:f2
npm install