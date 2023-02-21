const EventEmitter = require('events');
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');


class TopggClient extends EventEmitter {
    constructor(config) {
        super();
        
        if (!config) {
            throw new Error('No config provided');
        }
        if (config.mongo && config.supabase) {
            throw new Error('Only one database can be used!');
        }
        if (config.mongo && (!config.mongo.url || !config.mongo.collection || !config.mongo.db)) {
            throw new Error('MongoDB config is incomplete!');
        }
        if (config.supabase && (!config.supabase.url || !config.supabase.key || !config.supabase.table)) {
            throw new Error('Supabase config is incomplete!');
        }

        this.config = {
            port: config?.port || 3000,
            path: config?.path ? `/${config.path.replace(/^\/|\/$/g, '')}` : '/vote',
            auth: config?.auth || null,
            mongo: {
                url: config?.mongo?.url,
                db: config?.mongo?.db || 'bot',
                collection: config?.mongo?.collection || 'votes'
            },
            supabase: {
                url: config?.supabase?.url,
                key: config?.supabase?.key,
                table: config?.supabase?.table || 'votes'
            },
            debug: config?.debug || false
        };

        this.mongo = null;
        this.supabase = null;
        if (this.config.mongo.url) {
            const mongo = new MongoClient(this.config.mongo.url, { useUnifiedTopology: true });
            mongo.connect().then(() => {
                this.mongo = mongo;
                if (this.config.debug) this.emit('debug', 'Connected to MongoDB');
            })
        }
        if (this.config.supabase.url) {
            this.supabase = createClient(this.config.supabase.url, this.config.supabase.key);
            if (this.config.debug) this.emit('debug', 'Connected to Supabase');
        }

        this.server = require('express')();
        this.server.use(require('body-parser').json());
        this.server.post(this.config.path, this.incomingVote.bind(this));
        this.server.all(this.config.path, (req, res) => { res.status(200).json({ err: "This is a POST endpoint" }); if (this.config.debug) this.emit('debug', `GET request to ${this.config.path}`); });
        this.server.all('*', (req, res) => {
            res.status(404).json({ error: 'Not found' });
            if (this.config.debug) this.emit('debug', `404 Not found: ${req.url}`);
        });
        this.server.listen(this.config.port, () => {
            if (this.config.debug) this.emit('debug', `Listening on port ${this.config.port}`);
        });
    }
    
    async incomingVote(req, res, next) {
        if (this.config.auth && req.headers.authorization !== this.config.auth) {
            if (this.config.debug) this.emit('debug', `Unauthorized request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.body.bot || !req.body.user || !req.body.type || !req.body.isWeekend) {
            if (this.config.debug) this.emit('debug', `Invalid request from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            return res.status(400).json({ error: 'Invalid request' });
        }
        if (this.mongo) {
            await this.mongo.db().collection(this.config.mongo.collection).insertOne({
                bot: req.body.bot,
                user: req.body.user,
                type: req.body.type,
                isWeekend: req.body.isWeekend,
                query: req.body.query || null,
                timestamp: Date.now()
            }).then(() => {
                if (this.config.debug) this.emit('debug', `Inserted vote from ${req.body.user} for ${req.body.bot} (Weekend: ${req.body.isWeekend})`);
            }).catch((err) => {
                if (this.config.debug) this.emit('debug', `Error inserting vote from ${req.body.user} for ${req.body.bot} (Weekend: ${req.body.isWeekend}): ${err}`);
            })
        }
        if (this.supabase) {
            await this.supabase.from(this.config.supabase.table).insert({
                bot: req.body.bot,
                user: req.body.user,
                type: req.body.type,
                is_weekend: req.body.isWeekend,
                query: req.body.query || null,
                timestamp: Date.now()
            }).then(() => {
                if (this.config.debug) this.emit('debug', `Inserted vote from ${req.body.user} for ${req.body.bot} (Weekend: ${req.body.isWeekend})`);
            }).catch((err) => {
                if (this.config.debug) this.emit('debug', `Error inserting vote from ${req.body.user} for ${req.body.bot} (Weekend: ${req.body.isWeekend}): ${err}`);
            })
        }
        this.emit('vote', req.body.bot, req.body.user);
        res.status(200).json({ success: true });

        if (this.config.debug) this.emit('debug', `Vote received from ${req.body.user} for ${req.body.bot} (Weekend: ${req.body.isWeekend})`);
    }

    async hasVoted(bot, user, filter) {
        let mongoFilter = {};

        if (!this.mongo && !this.supabase) throw new Error('No database provided');

        if (this.mongo) {
            if (filter && typeof filter === 'string' && filter.endsWith('h')) {
                const hours = parseInt(filter.replace('h', ''));
                if (hours) {
                    mongoFilter = { timestamp: { $gt: Date.now() - (hours * 60 * 60 * 1000) } };
                }
            }
            const vote = await this.mongo.db().collection(this.config.mongo.collection).findOne({
                bot,
                user,
                ...mongoFilter
            });
            return !!vote;
        }
        if (this.supabase) {
            let data;
            if ((filter && typeof filter === 'string' && filter.endsWith('h')) && parseInt(filter.replace('h', ''))) {
                data = await this.supabase.from(this.config.supabase.table).select().eq('bot', bot).eq('user', user).gte('timestamp', Date.now() - (parseInt(filter.replace('h', '')) * 60 * 60 * 1000));
                data = data.data;
            }
            else {
                data = await this.supabase.from(this.config.supabase.table).select().eq('bot', bot).eq('user', user);
                data = data.data;
            }
            return !!data[0];
        }

        return false;
    }
}

module.exports = TopggClient;
