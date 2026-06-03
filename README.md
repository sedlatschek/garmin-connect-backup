# Garmin Connect Backup

`garmin-connect-backup` as a simple command line tool that downloads all available data from a Garmin Connect account.

## Installation

```sh
npm i -G garmin-connect-backup`
garmin-connect-backup --configure
```

## Usage

```sh
garmin-connect-backup
```

## Todos

- [ ] Make sure chunks are always the same time intervals, no matter when the start date is set. Otherwise the same data might be downloaded multiple times if the backup is run multiple times.
