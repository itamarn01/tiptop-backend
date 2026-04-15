const mongoose = require('mongoose')
//const dbConnectAtlas = "mongodb+srv://tiptoptherapyapp:341IcvrwkjvHSTWh@tiptop.izmnu.mongodb.net/live";
const dbConnectAtlas = "mongodb+srv://tiptoptherapyapp_db_user:Tiptop1234@tiptop.b4ik2vh.mongodb.net/";
mongoose.connect(dbConnectAtlas, { /* useNewUrlParser: true, useUnifiedTopology: true */ }).then(() => {
    console.log("mongo connected");
})
    .catch((e) => {
        console.log("no connected");
    });
