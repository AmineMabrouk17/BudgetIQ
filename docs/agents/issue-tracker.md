# Issue Tracker Configuration

- **Provider**: GitHub Issues (`gh` CLI)
- **Repository**: Current repository (`${GITHUB_REPOSITORY}`)
- **Fetch an issue**: `gh issue view <number> --json number,title,body,labels,comments`
- **Create a PR**: `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`
- **Review diff base**: `git diff origin/main...HEAD`
