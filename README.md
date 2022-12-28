# Full House

[![CircleCI](https://circleci.com/gh/philmtd/full-house/tree/master.svg?style=svg)](https://circleci.com/gh/philmtd/full-house/tree/master)
[![Docker Image Version (latest semver)](https://img.shields.io/docker/v/philmtd/full-house?color=2496ED&label=philmtd%2Ffull-house&logo=docker&logoColor=white&sort=semver)](https://hub.docker.com/r/philmtd/full-house/tags)

This is a simple software implementation of a [Planning Poker](https://en.wikipedia.org/wiki/Planning_poker) game,
mostly used in agile software development.

Players can join a game while e.g. being in a refinement meeting and use this game to estimate the issues discussed in the meeting.

## Run with Docker

Full House can be easily run with Docker:

```bash
docker run -p 8080:8080 philmtd/full-house
```

## Install in Kubernetes with Helm

The [Full House Helm chart](https://artifacthub.io/packages/helm/philmtd/full-house) is available in the following chart repo:

```bash
helm repo add philmtd https://philmtd.github.io/helm-charts
```

## Configuration

Full House runs perfectly fine with the default configuration.

### Customising voting schemes
It is possible to adjust the available voting schemes from which the users can choose when creating a new game. 
Per default there are the following two schemes available:

```yaml
fullHouse:
  votingSchemes:
    - name: Fibonacci
      scheme: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
      includesQuestionmark: true
    - name: Extended Fibonacci
      scheme: [0, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
      includesQuestionmark: true
```

If you want your own custom voting schemes you need to place your configuration in a `fullhouse.yaml` in the `config` sub-directory
of the Full House installation directory.

Each scheme needs a name, the numbers available to vote (need to be 0 or greater, can be floating point numbers) and you can define whether 
to include a questionmark `?` voting card or not. If you use a custom config the defaults will be overwritten, so if you want to include the default
schemes just copy them into your configuration.

## Persistence

Full House does not persist any data. All the state is kept in memory.

This has some theoretical downsides:

* Restarting the application will wipe all currently running games and the players will have to create a new game.
* As memory is unique to the application, Full House cannot be scaled horizontally.

Practically these should not appear as problems at the scale this app is intended for.

## Screenshots

The UI has light and dark modes:

| Voting                                           | Results                                            |
|--------------------------------------------------|----------------------------------------------------|
| ![Voting in light mode](./docs/voting-light.png) | ![Results in light mode](./docs/results-light.png) |
| ![Voting in light mode](./docs/voting-dark.png)  | ![Results in dark mode](./docs/results-dark.png)   |
