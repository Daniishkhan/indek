PNPM ?= pnpm

.PHONY: dev seed

dev:
	$(PNPM) dev

seed:
	$(PNPM) seed
