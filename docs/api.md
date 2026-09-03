# API and integrations

Mailflare exposes APIs for domain management and sending email. Authentication and mailbox permissions still apply to these routes.

## Domain management

Adding or removing a domain from Mailflare also updates Cloudflare Email Routing and sending resources.

| Mailflare route | Purpose |
| --- | --- |
| `GET /api/domains` | List connected domains |
| `POST /api/domains` | Connect a domain and configure Cloudflare |
| `GET /api/domains/[id]` | Get a connected domain |
| `DELETE /api/domains/[id]` | Remove a domain and clean up its Cloudflare resources |
| `GET /api/domains/[id]/dns` | View its routing and sending DNS status |

The hostname must be the apex of a zone available to the configured Cloudflare credentials, or a subdomain of that zone. Creating a mailbox also creates the Cloudflare Email Routing rule that delivers its address to the `mailflare` Worker.

## Sending email

Send email through `POST /api/v1/send`. Attachments are optional and use Base64-encoded content:

```json
{
  "from": "support@example.com",
  "to": "user@example.net",
  "subject": "Report",
  "text": "Attached.",
  "attachments": [
    {
      "filename": "report.pdf",
      "type": "application/pdf",
      "contentBase64": "<base64 data>"
    }
  ]
}
```

The dashboard composer accepts up to 10 attachments, with a 10 MB limit per file and a 20 MB combined limit. Attachment metadata is stored in D1 and file content is stored in R2. Downloads require access to the mailbox containing the message.

## Real-time updates

Mailflare uses a Durable Object WebSocket hub to notify connected users after an inbound message is stored. Mailbox owners, the domain administrator, and delegated users receive events for mailboxes they can access.

The `REALTIME` binding and its migration are declared in `wrangler.jsonc`. When a WebSocket is temporarily unavailable, the app retries the connection and uses a slower refresh until it recovers.
