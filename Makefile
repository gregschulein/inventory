.PHONY: image clean run

image:
	podman build -f Containerfile -t inventory:latest

clean:
	podman image rm inventory

run:
	podman run -it --rm --name inventory -p 3000:3000 localhost/inventory:latest
