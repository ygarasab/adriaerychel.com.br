const { CosmosClient } = require('@azure/cosmos');

const CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
const DATABASE_ID = process.env.COSMOS_DATABASE_ID || 'adriaerychel';
const GUESTS_CONTAINER_ID = process.env.COSMOS_GUESTS_CONTAINER_ID || 'guests';

const client = CONNECTION_STRING ? new CosmosClient(CONNECTION_STRING) : null;
const containerPromise = client
  ? client
      .database(DATABASE_ID)
      .containers.createIfNotExists({
        id: GUESTS_CONTAINER_ID,
        partitionKey: { paths: ['/id'] },
      })
      .then(({ container }) => container)
  : null;

function send(context, status, body) {
  context.res = { status, body };
}

module.exports = async function (context, req) {
  if (!client) {
    context.log.error('COSMOS_CONNECTION_STRING ausente nas Application Settings.');
    return send(context, 503, { ok: false, error: 'service_unavailable' });
  }

  const body = req.body || {};
  const guestId = String(body.guestId || '').trim().toLowerCase();
  const attending = body.attending === 'yes' ? 'yes' : body.attending === 'no' ? 'no' : null;
  const message = String(body.message || '').trim().slice(0, 1000);

  if (!guestId) return send(context, 400, { ok: false, error: 'guest_required' });
  if (!attending) return send(context, 400, { ok: false, error: 'attending_required' });

  try {
    const container = await containerPromise;

    let existing;
    try {
      const read = await container.item(guestId, guestId).read();
      existing = read.resource;
    } catch (err) {
      if (err.code === 404) return send(context, 404, { ok: false, error: 'guest_not_found' });
      throw err;
    }
    if (!existing) return send(context, 404, { ok: false, error: 'guest_not_found' });

    const confirmation = {
      attending,
      message,
      confirmedAt: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
    };

    const next = {
      ...existing,
      confirmation,
      updatedAt: confirmation.confirmedAt,
    };

    await container.items.upsert(next);

    return send(context, 200, {
      ok: true,
      guest: { id: existing.id, name: existing.name },
      reconfirmed: Boolean(existing.confirmation),
    });
  } catch (err) {
    context.log.error('Falha ao gravar confirmação no Cosmos', err);
    return send(context, 500, { ok: false, error: 'internal_error' });
  }
};
