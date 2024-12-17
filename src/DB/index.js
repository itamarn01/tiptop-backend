const mongoose = require('mongoose')
const dbConnectAtlas = "mongodb+srv://tiptoptherapyapp:341IcvrwkjvHSTWh@tiptop.izmnu.mongodb.net/test";
mongoose.connect(dbConnectAtlas, { /* useNewUrlParser: true, useUnifiedTopology: true */ }).then(() => {
    console.log("mongo connected");
})
    .catch((e) => {
        console.log("no connected");
    });
