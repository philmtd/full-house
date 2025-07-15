FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder
WORKDIR /src
COPY . .
RUN apk add --no-cache ca-certificates && update-ca-certificates
RUN GOOS=linux GOARCH=$(echo $TARGETPLATFORM | cut -d'/' -f2) go build -o /full-house ./cmd/fullhouse

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
ADD /config/fullhouse-default.yaml /app/config/
ADD /frontend/dist/browser /app/frontend
COPY --from=builder /full-house /app/full-house
WORKDIR /app
CMD ["/app/full-house", "server"]
