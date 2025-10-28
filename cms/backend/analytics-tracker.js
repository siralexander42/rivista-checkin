// analytics-tracker.js
// Sistema di tracking analytics leggero per CHECK-IN Magazine

const mongoose = require('mongoose');

// Schema per pageviews
const pageviewSchema = new mongoose.Schema({
    url: { type: String, required: true, index: true },
    path: { type: String, required: true },
    magazineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Magazine' },
    magazineSlug: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    ip: { type: String },
    country: { type: String },
    device: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Schema per sessioni
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    ip: { type: String },
    userAgent: { type: String },
    country: { type: String },
    device: { type: String },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    pageviews: { type: Number, default: 0 },
    duration: { type: Number, default: 0 } // in secondi
});

// Schema per eventi custom
const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true, index: true },
    eventData: { type: Object },
    url: { type: String },
    magazineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Magazine' },
    sessionId: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Indici composti per performance
pageviewSchema.index({ timestamp: -1, magazineId: 1 });
pageviewSchema.index({ magazineSlug: 1, timestamp: -1 });
sessionSchema.index({ startTime: -1 });
eventSchema.index({ eventName: 1, timestamp: -1 });

const Pageview = mongoose.model('Pageview', pageviewSchema);
const Session = mongoose.model('Session', sessionSchema);
const Event = mongoose.model('Event', eventSchema);

/**
 * Traccia una pageview
 */
async function trackPageview(data) {
    try {
        const pageview = new Pageview({
            url: data.url,
            path: data.path || new URL(data.url).pathname,
            magazineId: data.magazineId,
            magazineSlug: data.magazineSlug,
            referrer: data.referrer,
            userAgent: data.userAgent,
            ip: data.ip,
            country: data.country || 'Unknown',
            device: detectDevice(data.userAgent),
            browser: detectBrowser(data.userAgent)
        });
        
        await pageview.save();
        return pageview;
    } catch (error) {
        console.error('Error tracking pageview:', error);
        return null;
    }
}

/**
 * Traccia una sessione
 */
async function trackSession(sessionId, data) {
    try {
        let session = await Session.findOne({ sessionId });
        
        if (!session) {
            session = new Session({
                sessionId,
                ip: data.ip,
                userAgent: data.userAgent,
                country: data.country || 'Unknown',
                device: detectDevice(data.userAgent),
                startTime: new Date()
            });
        } else {
            session.endTime = new Date();
            session.pageviews += 1;
            session.duration = Math.floor((session.endTime - session.startTime) / 1000);
        }
        
        await session.save();
        return session;
    } catch (error) {
        console.error('Error tracking session:', error);
        return null;
    }
}

/**
 * Traccia un evento custom
 */
async function trackEvent(eventName, data) {
    try {
        const event = new Event({
            eventName,
            eventData: data.eventData,
            url: data.url,
            magazineId: data.magazineId,
            sessionId: data.sessionId,
            timestamp: new Date()
        });
        
        await event.save();
        return event;
    } catch (error) {
        console.error('Error tracking event:', error);
        return null;
    }
}

/**
 * Ottieni statistiche pageviews
 */
async function getPageviewStats(filters = {}) {
    try {
        const match = {};
        
        // Filtro per data
        if (filters.startDate || filters.endDate) {
            match.timestamp = {};
            if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
        }
        
        // Filtro per rivista
        if (filters.magazineId) {
            match.magazineId = mongoose.Types.ObjectId(filters.magazineId);
        }
        
        const stats = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$ip' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalViews: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' }
                }
            }
        ]);
        
        return stats[0] || { totalViews: 0, uniqueVisitors: 0 };
    } catch (error) {
        console.error('Error getting pageview stats:', error);
        return { totalViews: 0, uniqueVisitors: 0 };
    }
}

/**
 * Ottieni top pagine
 */
async function getTopPages(filters = {}, limit = 10) {
    try {
        const match = {};
        
        if (filters.startDate || filters.endDate) {
            match.timestamp = {};
            if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
        }
        
        if (filters.magazineId) {
            match.magazineId = mongoose.Types.ObjectId(filters.magazineId);
        }
        
        const topPages = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$path',
                    views: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$ip' }
                }
            },
            {
                $project: {
                    path: '$_id',
                    views: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' },
                    _id: 0
                }
            },
            { $sort: { views: -1 } },
            { $limit: limit }
        ]);
        
        return topPages;
    } catch (error) {
        console.error('Error getting top pages:', error);
        return [];
    }
}

/**
 * Ottieni statistiche per device
 */
async function getDeviceStats(filters = {}) {
    try {
        const match = {};
        
        if (filters.startDate || filters.endDate) {
            match.timestamp = {};
            if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
        }
        
        const deviceStats = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$device',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    device: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);
        
        return deviceStats;
    } catch (error) {
        console.error('Error getting device stats:', error);
        return [];
    }
}

/**
 * Ottieni statistiche per browser
 */
async function getBrowserStats(filters = {}) {
    try {
        const match = {};
        
        if (filters.startDate || filters.endDate) {
            match.timestamp = {};
            if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
        }
        
        const browserStats = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$browser',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    browser: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        return browserStats;
    } catch (error) {
        console.error('Error getting browser stats:', error);
        return [];
    }
}

/**
 * Ottieni trend giornaliero
 */
async function getDailyTrend(filters = {}, days = 30) {
    try {
        const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
        const startDate = filters.startDate ? new Date(filters.startDate) : new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        
        const match = {
            timestamp: { $gte: startDate, $lte: endDate }
        };
        
        if (filters.magazineId) {
            match.magazineId = mongoose.Types.ObjectId(filters.magazineId);
        }
        
        const trend = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' },
                        day: { $dayOfMonth: '$timestamp' }
                    },
                    views: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$ip' }
                }
            },
            {
                $project: {
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day'
                        }
                    },
                    views: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' },
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);
        
        return trend;
    } catch (error) {
        console.error('Error getting daily trend:', error);
        return [];
    }
}

/**
 * Ottieni referrer top
 */
async function getTopReferrers(filters = {}, limit = 10) {
    try {
        const match = { referrer: { $exists: true, $ne: '' } };
        
        if (filters.startDate || filters.endDate) {
            match.timestamp = {};
            if (filters.startDate) match.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) match.timestamp.$lte = new Date(filters.endDate);
        }
        
        const topReferrers = await Pageview.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$referrer',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    referrer: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);
        
        return topReferrers;
    } catch (error) {
        console.error('Error getting top referrers:', error);
        return [];
    }
}

// Utility: Rileva device da user agent
function detectDevice(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return 'mobile';
    }
    return 'desktop';
}

// Utility: Rileva browser da user agent
function detectBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
    
    return 'Other';
}

module.exports = {
    Pageview,
    Session,
    Event,
    trackPageview,
    trackSession,
    trackEvent,
    getPageviewStats,
    getTopPages,
    getDeviceStats,
    getBrowserStats,
    getDailyTrend,
    getTopReferrers
};
