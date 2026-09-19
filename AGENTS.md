# Development Rules

- Do not invent NISR data or present test fixtures as observations.
- Inspect and validate AHS 2024 and SAS 2024/2025 sources before finalizing DTOs.
- Do not change source values, silently impute missing values, or make province data district-level.
- Preserve available provenance for every displayed statistic.
- Keep this MVP frontend-only. Do not add backend, database, Python, ML, or authentication infrastructure.
- Do not add dependencies or abstractions without a concrete requirement.
- Keep the product understandable and test changes.
- Prefer simple solutions and do not build unused abstractions.
