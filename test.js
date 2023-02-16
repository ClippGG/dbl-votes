const TopggClient = require("./index.js");

const topgg = new TopggClient({
    port: 3000,
    path: "/vote",
    mongo: {
        url: "mongodb://localhost:27017",
        db: "bot",
        collection: "votes"
    },
    debug: true
});

topgg.on("vote", (bot, user) => {
    console.log(`${user} voted for ${bot}`);
});

topgg.on("debug", (msg) => {
    console.log(msg);
});
