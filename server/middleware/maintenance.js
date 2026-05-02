const maintenance = (req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true') {
        return res.status(503).json({ ok: false, maintenance: true })
    }
    next()
}

module.exports = maintenance