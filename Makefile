.PHONY: all lint fmt deps test build-web build run clean

all: build

lint:
	go vet ./...
	cd web && npm run lint

fmt:
	go fmt ./...
	cd web && npm run format

deps:
	go mod tidy
	cd web && npm install

test: build-web
	go test ./...

build-web:
	cd web && npm run build

build: build-web
	go build -o tusk .

run: build
	./tusk serve

clean:
	rm -rf web/dist tusk exports/ test_export.json
