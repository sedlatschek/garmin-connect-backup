# Garmin Connect Backup

`garmin-connect-backup` is a command line tool that downloads all available data from a Garmin Connect account and saves it as JSON files locally.

## Installation

```sh
npm install -g garmin-connect-backup
```

## Usage

```sh
garmin-connect-backup --from 2024-01-01
```

The `--from` flag is required. All other options are optional and can also be set via a config file or environment variables.

## Configuration

Options can be provided via CLI flags, a YAML config file, or environment variables. CLI flags take precedence over the config file, which takes precedence over environment variables.

### CLI flags

| Flag | Description | Default |
|------|-------------|---------|
| `--from <date>` | Start date for backup (`YYYY-MM-DD`) | *(required)* |
| `--to <date>` | End date for backup (`YYYY-MM-DD`) | Yesterday |
| `--config <path>` | Path to YAML/YML configuration file | — |
| `--output-dir <path>` | Directory to write backup files to | `./backup` |
| `--username <email>` | Garmin Connect username / email | — |
| `--password <password>` | Garmin Connect password | — |
| `--requests-per-second <n>` | Max Garmin API requests per second | `1` |
| `--services <names>` | Comma-separated list of services to back up | *(all)* |

### Config file

Create a YAML file (e.g. `config.yml`) and pass it with `--config`:

```yaml
from: "2024-01-01"
to: "2024-12-31"
outputDir: "./my-backup"
username: "your@email.com"
password: "yourpassword"
requestsPerSecond: 2
services:
  - activities
  - sleep-service
  - hrv-service
```

Omitting `services` (or leaving it out entirely) backs up all services.

### Environment variables

Credentials can also be provided via environment variables:

```sh
export GARMIN_USERNAME="your@email.com"
export GARMIN_PASSWORD="yourpassword"
garmin-connect-backup --from 2024-01-01
```

If credentials are not provided by any of the above means, the tool will prompt for them interactively.

## Output

Files are written to `./backup` (or the configured `outputDir`) as JSON. Each service creates its own subdirectory. Date-scoped endpoints produce one file per day or per time window.

## Backed-up data

The following data is downloaded from Garmin Connect:

| Service | Data |
|---------|------|
| `activities` | Activity list with details + activity types |
| `bloodpressure-service` | Blood pressure readings |
| `fitnessage-service` | Fitness age |
| `goal-service` | Goals |
| `healthstatus-service` | Health status |
| `hrv-service` | Heart rate variability |
| `metrics-service` | Health metrics |
| `nutrition-service` | Nutrition / calorie intake |
| `sleep-service` | Sleep data |
| `usersummary-service` | Daily summary, steps, floors, intensity minutes, respiration, calories, hydration |
| `userstats-service` | User statistics |
| `userprofile-service` | User profile |
| `device-service` | Registered devices |
| `weight-service` | Weight measurements |
| `wellness-service` | SpO2, respiration, sleep, events, stress, body battery |

## ToDo
- [ ] Configurable if content is saved only on per day basis
- [ ] fitnessstats-service
- [ ] wellness-activity-service
