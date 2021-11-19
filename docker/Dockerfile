From public.ecr.aws/bitnami/golang:latest AS build_base
ADD golang /tmp/golangapp
WORKDIR /tmp/golangapp
EXPOSE 8080
run go build main.go
CMD ["go", "run", "main.go"]