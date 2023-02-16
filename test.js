const TopggClient = require("./index.js");

const client = new TopggClient({
    port: 3000,
    path: "/vote",
    mongo: {
        url: "mongodb://localhost:27017",
        db: "bot",
        collection: "votes"
    },
    debug: true
});

client.on("vote", (bot, user) => {
    console.log(`${user} voted for ${bot}`);
});

client.on("debug", (msg) => {
    console.log(msg);
});
