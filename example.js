const TopggClient = require("./index.js");

const topgg = new TopggClient({
    port: 3000,
    path: "/vote",
    mongo: {
        url: "mongodb://localhost:27017",
        db: "bot",
        collection: "votes"
    },
    // or if you want to use supabase
    supabase: {
        url: "https://supabaseurl.supabase.co",
        key: "supabasekey",
        table: "votes"
    },
    debug: true
});

topgg.on("vote", (bot, user) => {
    console.log(`${user} voted for ${bot}`);
});

topgg.on("debug", (msg) => {
    console.log(msg);
});

// to get if a user has voted
const hasVoted = await topgg.hasVoted("botid", "userid", "12h");
// returns `true` or `false`
