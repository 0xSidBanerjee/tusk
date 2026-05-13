.PHONY: all lint fmt deps test build-web build run release clean

all: build

lint: build-web
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

build: deps build-web
	go build -o tusk .

run: build
	./tusk serve

release:
	goreleaser release --snapshot --clean

clean:
	rm -rf web/dist tusk exports/ test_export.json
