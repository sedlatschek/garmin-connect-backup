# Garmin Connect Backup

- After finishing changes,
  - run `npm run typecheck`
  - run `npm run lint`
  - run `npm run test`
- Avoid `as` assertions
- Avoid `any` type
- Add tests for new features and bug fixes
- If you are adding a new feature, also add it to the README.md

## Patterns

- Inversion of Control

## Naming conventions

- Endpoints that go over a timespan are usually called summaries
- Endpoints that only include one day, are usually just called the resources name
