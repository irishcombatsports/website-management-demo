# Deployment Notes

This folder is the permanent home for the flexible website and management system demo.

## Correct live URLs

- Full backend demo: https://web-production-edb70f.up.railway.app
- Static frontend demo: https://irishcombatsports.github.io/website-management-demo/
- GitHub repo: https://github.com/irishcombatsports/website-management-demo

## Correct Railway project

- Project name: `website-management-system-demo`
- Project ID: `1b4f2512-eb91-4cff-bf88-dc1162513275`
- Service: `web`

## Deploying

Deploy only from this folder:

```bash
cd /Users/evan/website-management-demo
npm run deploy:demo
```

The deploy script checks the Railway project ID before uploading. If the folder is linked to the wrong Railway project, it will stop instead of overwriting another site.

Do not deploy this demo from `/Users/evan/combat-club-template`; that folder has been used for another client-style site.
