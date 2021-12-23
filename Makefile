go-%:
	$(MAKE) -f go.mk $*

clean: go-clean

build-and-docker: go-build-for-docker docker

docker:
	docker build -t philmtd/full-house .
