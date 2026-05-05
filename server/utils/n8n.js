const llamarN8N = async (webhook, payload) => {
    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error(`Error llamando a N8N (${webhook}):`, err.message);
    }
};

module.exports = { llamarN8N };