GO         ?= go
LINTER     ?= golangci-lint
GO_TESTSUM ?= gotestsum
VERSION	   := $(shell [ -z $$(git tag --points-at HEAD) ] && echo "unknown" || echo $$(git tag --points-at HEAD))
COMMIT     := $(shell git rev-parse --short HEAD)
LDFLAGS    += -ldflags '-extldflags "-static" -s -w -X=main.GitTag=$(VERSION) -X=main.GitCommit=$(COMMIT)' # -s -w reduces binary size by removing some debug information
BUILDFLAGS += -installsuffix cgo --tags release

BUILD_PATH ?= $(shell pwd)
CMD = $(BUILD_PATH)/full-house
CMD_SRC = cmd/fullhouse/*.go

all: build lint

.PHONY: build test test-ci lint lint-ci clean prepare build-for-docker

clean:
	rm -f $(CMD)

run:
	$(GO) run $(LDFLAGS) $(CMD_SRC) $(ARGS)

test:
	$(GO) test -v ./pkg/**/* -coverprofile cover.out

test-ci:
	$(GO_TESTSUM) --format testname --junitfile test_results.xml -- -v ./pkg/**/* -coverprofile cover.out

lint:
	$(GO) mod verify
	$(LINTER) run -v

lint-ci:
	$(GO) mod verify
	$(LINTER) run -v --out-format=junit-xml > linter_results.xml

prepare:
	$(GO) mod download

build:
	$(GO) build -o $(CMD) -a $(BUILDFLAGS) $(LDFLAGS) $(CMD_SRC)

build-for-docker:
	CGO_ENABLED=0 GOOS=linux $(GO) build -o $(CMD) -a $(BUILDFLAGS) $(LDFLAGS) $(CMD_SRC)
	upx $(CMD) # reduce binary size

mod-outdated: # needs https://github.com/psampaz/go-mod-outdated
	$(GO) list -u -m -json all | go-mod-outdated -update -direct
