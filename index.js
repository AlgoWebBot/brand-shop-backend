const express = require('express');
const app = express();
const cors = require('cors');
const multer = require("multer");
const UPLOAD_FOLDER = "./public/image";
const fs = require("fs");
const path = require("path");
app.use(express.static('public'));
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// cors state for cross origin request service. its create relationship between backend and fontend 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@shimulclaster1.85diumq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, UPLOAD_FOLDER);
            },
            filename: (req, file, cb) => {
                if (file) {
                    const fileExt = path.extname(file.originalname);
                    const fileName =
                        file.originalname
                            .replace(fileExt, "")
                            .toLowerCase()
                            .split(" ")
                            .join("-") +
                        "-" +
                        Date.now();
                    console.log("🚀 ~ fileName:", fileName);
                    cb(null, fileName + fileExt);
                }
            },
        });

        var upload = multer({
            storage: storage,
        });

        const database = client.db("productsDB");
        const products = database.collection("products");
        const cartItem = database.collection("cartItem");
        const categories = database.collection("categories");


        app.get('/products', async (req, res) => {
            const allProducts = await products.find().toArray();
            res.send(allProducts)
        })

        app.get('/carts', async (req, res) => {
            const allCartItem = await cartItem.find().toArray();
            res.send(allCartItem)
        })

        app.get('/brand/:id', async (req, res) => {
            const id = req.params.id;
            const query = { brand_name: id.toLocaleLowerCase() };
            const searchProducts = await products.find(query).toArray();
            res.send(searchProducts)
        })

        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: new ObjectId(id) }
            const product = await products.findOne(query);
            res.send(product);
        })

        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const product = await products.findOne(query);
            res.send(product);
        })

        app.put('/update/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body
            // console.log(body)
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateProduct = {
                $set: {
                    name: body.name,
                    image: body.image,
                    brand_name: body.brand_name,
                    price: body.price,
                    rating: body.rating,
                    category: body.category,
                },
            };
            const result = await products.updateOne(filter, updateProduct, options);
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body
            // console.log(product)
            const result = await products.insertOne(product);
            res.send(result);
        })
        app.post('/carts', async (req, res) => {
            const product = req.body
            console.log(product)
            const result = await cartItem.insertOne(product);
            res.send(result);
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartItem.deleteOne(query);
            res.send(result);
        })


        // ! -------------newly added-----------
        app.post('/add-cat', upload.single('image'), async (req, res) => {
            const { name } = req.body;
            const available = await categories.findOne({ name })
            if (available) {
                return res.send({ message: 'Category already available' });
            }
            const image = req.file.filename;
            const result = await categories.insertOne({ name, image });
            res.send(result);
        })

        app.get('/categories', async (req, res) => {
            const result = await categories.find().toArray();
            res.send(result);
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Product management server is running')
})

app.listen(5000, () => {
    console.log('Server running at port 5000');
})