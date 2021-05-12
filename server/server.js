const mongoose = require('mongoose')
const Document = require('./Document')
const PORT = process.env.PORT || 3001
mongoose.connect('mongodb+srv://<username>:<password>@<url>/<databaseName>?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});
console.log(PORT)
const defaultValue = ""
const io = require('socket.io')(PORT, {
    cors: {
        origin: 'http://localhost:3000', //React server address
        methods: ["GET", "POST"],
    },
})

io.on("connection", socket => {
    console.log("Connected")
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)

        socket.emit("load-document", document.data)
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })
})

async function findOrCreateDocument(id) {
    if (id == null) return
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })

}