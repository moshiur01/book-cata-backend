require("dotenv").config();
const express = require("express");
const port = 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

//# Middleware:
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Book Catalog backed!");
});

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    client.connect();
    const booksCollection = client.db("books").collection("allbooks");
    const commentsCollection = client.db("books").collection("reviews");
    const wishlistCollection = client.db("books").collection("wishlist");
    const readingCollection = client.db("books").collection("reading");
    const finishedCollection = client.db("books").collection("finished");

    app.get("/books", async (req, res) => {
      const book = await booksCollection.find({}).toArray();
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const book = await booksCollection.findOne({
        _id: new ObjectId(id),
      });
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    });

    app.post("/books", async (req, res) => {
      const book = await booksCollection.insertOne(req.body);
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Can't created new books" });
      }
    });

    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const book = await booksCollection.deleteOne({ _id: new ObjectId(id) });
      if (book.deletedCount > 0) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Can't delete book" });
      }
    });

    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body.data;

      const data = {
        title: body.title,
        author: body.author,
        genre: body.genre,
        publicationYear: body.publicationYear,
        publicationYear: body.image,
        publicationYear: body.summary,
      };
      try {
        const book = await booksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: data }
        );

        if (book) {
          res.status(200).json(book);
        } else {
          res.status(404).json({ message: "Can't update books" });
        }
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const book = await commentsCollection.find({ id: id }).toArray();
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Book not found" });
      }
    });

    //@ Get wishlist:
    app.get("/wishlist/:email", async (req, res) => {
      const email = req.params.email;
      const wishlist = await wishlistCollection.find({ email }).toArray();
      if (wishlist) {
        res.status(200).json(wishlist);
      } else {
        res.status(404).json({ message: "Can't find wishlist" });
      }
    });

    //@ Get reading:
    app.get("/reading/:email", async (req, res) => {
      const email = req.params.email;
      const reading = await readingCollection.find({ email }).toArray();
      if (reading) {
        res.status(200).json(reading);
      } else {
        res.status(404).json({ message: "Can't find reading" });
      }
    });

    //@ Create new book:
    app.post("/add-book", async (req, res) => {
      const currentTime = new Date();
      req.body.timestamp = currentTime.toISOString();
      const book = await booksCollection.insertOne(req.body);
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: "Can't created new books" });
      }
    });

    //@ Create new comment:
    app.post("/review", async (req, res) => {
      const currentTime = new Date();
      req.body.timestamp = currentTime.toISOString();
      const comment = await commentsCollection.insertOne(req.body);
      if (comment) {
        res.status(200).json(comment);
      } else {
        res.status(404).json({ message: "Can't post a comment" });
      }
    });

    //@ Create wishlist :
    app.patch("/wishlist", async (req, res) => {
      try {
        const data = req.body;
        const { email, id } = data;

        const checkEmail = await wishlistCollection.findOne({
          email,
        });

        const checkId = await wishlistCollection.findOne({
          id,
        });

        if (checkEmail && checkId) {
          const wishlistBookData = {
            email,
            id,
            wishlist: true,
          };

          const updateResult = await wishlistCollection.updateOne(
            { id },
            { $set: wishlistBookData }
          );

          res.status(200).json(updateResult);
        } else {
          const insertResult = await wishlistCollection.insertOne(data);
          res.status(200).json(insertResult);
        }
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    //@ Create reading :
    app.patch("/reading", async (req, res) => {
      try {
        const data = req.body;
        const { email, id } = data;

        const checkEmail = await readingCollection.findOne({
          email,
        });

        const checkId = await readingCollection.findOne({
          id,
        });

        if (checkEmail && checkId) {
          const readingBookData = {
            email,
            id,
            reading: true,
          };

          const updateResult = await readingCollection.updateOne(
            { id },
            { $set: readingBookData }
          );

          res.status(200).json(updateResult);
        } else {
          const insertResult = await readingCollection.insertOne(data);
          res.status(200).json(insertResult);
        }
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } finally {
    await client.close();
  }
}
run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
