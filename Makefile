.PHONY: all lint fmt deps test build-web build run clean

all: build

lint:
	golangci-lint run

fmt:
	go fmt ./...

deps:
	go mod tidy
	cd web && npm install

test:
	go test ./...

build-web:
	cd web && npm run build

build: build-web
	go build -o tusk .

run:
	go run . serve

clean:
	rm -rf web/dist tusk exports/ test_export.json
