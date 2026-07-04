const { Pool } = require("pg")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(text, params = []) {
    return pool.query(text, params)
}

async function initSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS bots (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            phone TEXT,
            status TEXT DEFAULT 'disconnected',
            prefix TEXT DEFAULT '!',
            welcome_msg TEXT DEFAULT '',
            goodbye_msg TEXT DEFAULT '',
            auto_reply TEXT DEFAULT '',
            anti_spam INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS commands (
            id SERIAL PRIMARY KEY,
            bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            type TEXT DEFAULT 'custom',
            response TEXT,
            description TEXT DEFAULT '',
            UNIQUE(bot_id, name)
        );
        CREATE TABLE IF NOT EXISTS blacklist (
            id SERIAL PRIMARY KEY,
            bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
            number TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(bot_id, number)
        );
        CREATE TABLE IF NOT EXISTS stats (
            id SERIAL PRIMARY KEY,
            bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
            date TEXT NOT NULL,
            messages_received INTEGER DEFAULT 0,
            commands_used INTEGER DEFAULT 0,
            UNIQUE(bot_id, date)
        );
        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
            level TEXT DEFAULT 'info',
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `)
}

module.exports = { query, pool, initSchema }
