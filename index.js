const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const db = require("./config/db");
const Book = require("./models/book");

const app = express();
const port = 4222;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get("/", async (req, res) => {
    try {
        const books = await Book.find({});
        res.render("index", { books });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get("/add-book", (req, res) => {
    res.render("add");
});

app.post("/add-book", upload.single("image"), async (req, res) => {
    try {
        const { title, author } = req.body;
        const newBook = new Book({
            title,
            author,
            image: req.file ? req.file.filename : ""
        });
        await newBook.save();
        res.redirect("/");
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get("/edit-book/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        res.render("edit", { book });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post("/edit-book/:id", upload.single("image"), async (req, res) => {
    try {
        const { title, author } = req.body;
        const updateData = { title, author };

        if (req.file) {
            const oldBook = await Book.findById(req.params.id);
            if (oldBook.image) {
                const oldPath = path.join(__dirname, "uploads", oldBook.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.image = req.file.filename;
        }

        await Book.findByIdAndUpdate(req.params.id, updateData);
        res.redirect("/");
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get("/delete-book/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (book.image) {
            const imagePath = path.join(__dirname, "uploads", book.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        await Book.findByIdAndDelete(req.params.id);
        res.redirect("/");
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(port, () => console.log(`Server started at http://localhost:${port}`));