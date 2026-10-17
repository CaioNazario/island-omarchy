PLUGIN_ID := caionazario.island
DIST := dist/$(PLUGIN_ID)
# qmllint precisa ver os módulos do Quickshell e os tipos gerados no build.
# `uncreatable-type` desligado: o qmltypes do Quickshell 0.3.1 marca
# PanelWindow como não criável, mas é o tipo que o próprio Omarchy instancia.
QMLLINT ?= $(firstword $(wildcard /usr/lib/qt6/bin/qmllint) $(shell command -v qmllint 2>/dev/null))
QML_FILES = $(shell find $(DIST) dev -name '*.qml')

.PHONY: test lint build dev smoke shot clean

test:
	npx vitest run

lint: build
	npx eslint .
	npx prettier --check .
	npx tsc --noEmit -p tsconfig.json
	npx tsc -p tsconfig.test.json
	$(QMLLINT) --max-warnings 0 --uncreatable-type disable -I /usr/lib/qt6/qml $(QML_FILES)
	# O validador do Omarchy só existe numa máquina com Omarchy (não na CI).
	if command -v omarchy >/dev/null; then omarchy plugin validate $(DIST); fi

build: clean
	npx tsc -p tsconfig.json
	node scripts/build-core.mjs $(DIST)/core
	node scripts/build-plugin.mjs $(DIST)

dev: build
	scripts/nested.sh dev

smoke: build
	scripts/nested.sh smoke

shot:
	scripts/nested.sh shot

clean:
	rm -rf dist
