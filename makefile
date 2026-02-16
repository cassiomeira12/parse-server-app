.PHONY: rebase
rebase:
	@echo ""
	@read -p "Enter the branch to rebase: " branch_selected; \
	echo "git rebase $${branch_selected}"; \
	git rebase $${branch_selected}

.PHONY: push
push:
	@echo ""
	@git push --force-with-lease