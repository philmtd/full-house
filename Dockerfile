FROM alpine AS builder
# Install SSL ca certificates.
# Ca-certificates is required to call HTTPS endpoints.
RUN apk update && apk add --no-cache ca-certificates && update-ca-certificates

FROM scratch

# Import from builder.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ADD /config/fullhouse-default.yaml /app/config/
ADD /full-house /app/
ADD /frontend/dist /app/frontend

WORKDIR /app

CMD ["/app/full-house", "server"]
